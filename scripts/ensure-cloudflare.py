#!/usr/bin/env python3
"""
Idempotent Cloudflare setup for arielglow.com.
Verifies DNS via API; applies changes when the API token allows.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

ZONE_NAME = "arielglow.com"
PAGES_TARGET = "arielglow-website.pages.dev"
PAGES_PROJECT = "arielglow-website"
CUSTOM_DOMAINS = ("www.arielglow.com", "arielglow.com")
DMARC = (
    "v=DMARC1; p=none; adkim=r; aspf=r; pct=100; fo=1; rua=mailto:hi@arielglow.com"
)
REDIRECT_DESC = "Redirect apex to www"
BOT_CONFIG = {
    "fight_mode": True,
    "ai_bots_protection": "block",
    "crawler_protection": "enabled",
    "enable_js": True,
    "cf_robots_variant": "policy_only",
    "content_bots_protection": "disabled",
}
TURNSTILE_NAME = "arielglow-static-site"
TURNSTILE_DOMAINS = ("arielglow.com", "www.arielglow.com")
SECURITY_TXT_URL = "https://www.arielglow.com/.well-known/security.txt"


def norm_host(value: str) -> str:
    return value.rstrip(".").lower()


def is_auth_error(res: dict) -> bool:
    return any(e.get("code") == 10000 for e in (res.get("errors") or []))


def main() -> int:
    token = (
        os.environ.get("CLOUDFLARE_HARDENING_TOKEN")
        or os.environ.get("CF_TOKEN")
        or os.environ.get("CLOUDFLARE_API_TOKEN")
    )
    account = os.environ.get("CF_ACCOUNT") or os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    if not token or not account:
        print("Missing CF_TOKEN / CLOUDFLARE_API_TOKEN or account id", file=sys.stderr)
        return 1

    api = CloudflareApi(token)
    warnings: list[str] = []

    zones = api.get(f"/zones?name={ZONE_NAME}")
    if not zones.get("result"):
        print(f"Zone {ZONE_NAME} not found or token lacks Zone:Read", file=sys.stderr)
        return 1
    zone_id = zones["result"][0]["id"]
    print(f"Zone: {ZONE_NAME} ({zone_id})")

    records = api.get(f"/zones/{zone_id}/dns_records?per_page=100")
    if not records.get("success"):
        warnings.append(f"DNS list: {records.get('errors')}")
        existing: list[dict] = []
    else:
        existing = records.get("result") or []

    dns_ok = True
    for name in ("www", "@"):
        ok, msg = ensure_cname(api, zone_id, existing, name, PAGES_TARGET)
        print(msg)
        if not ok:
            dns_ok = False

    ok, msg = ensure_dmarc_txt(api, zone_id, existing)
    print(msg)
    if not ok:
        warnings.append("DMARC TXT not applied (grant DNS Edit or fix _dmarc manually)")

    ok, msg = ensure_dmarc_management(api, zone_id)
    print(msg)
    if not ok:
        warnings.append(msg)

    ok, msg = ensure_bot_management(api, zone_id)
    print(msg)
    if not ok:
        warnings.append(msg)

    ok, msg = ensure_turnstile(api, account)
    print(msg)
    if not ok:
        warnings.append(msg)

    for setting, value in (
        ("always_use_https", "on"),
        ("automatic_https_rewrites", "on"),
        ("ssl", "full"),
    ):
        res = api.patch(f"/zones/{zone_id}/settings/{setting}", {"value": value})
        if res.get("success"):
            print(f"Setting {setting}={value} OK")
        elif is_auth_error(res):
            cur = api.get(f"/zones/{zone_id}/settings/{setting}")
            current = (cur.get("result") or {}).get("value")
            if current == value or (setting == "always_use_https" and current == "on"):
                print(f"Setting {setting} already {current} (no edit permission)")
            else:
                warnings.append(
                    f"Setting {setting}: needs SSL Edit (currently {current}, want {value})"
                )
        else:
            warnings.append(f"Setting {setting}: {res.get('errors')}")

    for domain in CUSTOM_DOMAINS:
        res = api.post(
            f"/accounts/{account}/pages/projects/{PAGES_PROJECT}/domains",
            {"name": domain},
        )
        if res.get("success"):
            print(f"Pages domain bound: {domain}")
        elif any(e.get("code") == 8000018 for e in (res.get("errors") or [])):
            print(f"Pages domain already bound: {domain}")
        else:
            warnings.append(f"Pages domain {domain}: {res.get('errors')}")

    phase = "http_request_dynamic_redirect"
    entry = api.get(f"/zones/{zone_id}/rulesets/phases/{phase}/entrypoint")
    rule = {
        "expression": '(http.host eq "arielglow.com")',
        "description": REDIRECT_DESC,
        "action": "redirect",
        "action_parameters": {
            "from_value": {
                "status_code": 301,
                "target_url": {
                    "expression": 'concat("https://www.arielglow.com", http.request.uri.path)'
                },
                "preserve_query_string": True,
            }
        },
    }
    if entry.get("result"):
        rs = entry["result"]
        if any(r.get("description") == REDIRECT_DESC for r in rs.get("rules", [])):
            print("Apex -> www redirect rule already present")
        else:
            rules = [r for r in rs.get("rules", []) if r.get("description") != REDIRECT_DESC]
            rules.insert(0, rule)
            res = api.put(f"/zones/{zone_id}/rulesets/{rs['id']}", {"rules": rules})
            if res.get("success"):
                print("Apex -> www redirect rule OK")
            else:
                warnings.append(f"Redirect rule: {res.get('errors')}")
    else:
        res = api.put(
            f"/zones/{zone_id}/rulesets/phases/{phase}/entrypoint",
            {"rules": [rule]},
        )
        if res.get("success"):
            print("Apex -> www redirect rule OK")
        elif is_auth_error(res):
            warnings.append("Redirect rule: token lacks Zone Rules Edit (Pages middleware still active)")
        else:
            warnings.append(f"Redirect rule: {res.get('errors')}")

    live_ok = verify_live_site()
    print(f"\nLive site check: {'OK' if live_ok else 'FAILED'}")
    sec_ok = verify_security_txt()
    print(f"security.txt check: {'OK' if sec_ok else 'FAILED'}")
    if not sec_ok:
        warnings.append("security.txt missing or invalid after deploy")

    if warnings:
        print("\nWarnings:", file=sys.stderr)
        for w in warnings:
            print(f"  - {w}", file=sys.stderr)

    if not live_ok:
        return 1
    if not dns_ok:
        print(
            "\nDNS not verified via API (token may lack DNS Read/Edit). "
            "If Dashboard CNAMEs are correct, the live site check above is what matters.",
            file=sys.stderr,
        )
    if warnings:
        print("\nCore site OK; optional: upgrade API token (see SETUP-CLOUDFLARE-TOKEN.md).")
        return 0
    print("\nAll Cloudflare hardening checks passed.")
    return 0


def verify_live_site() -> bool:
    try:
        req = urllib.request.Request("https://www.arielglow.com/", method="GET")
        req.add_header("User-Agent", "arielglow-hardening/1.0")
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read(8000).decode("utf-8", errors="replace")
        if "Ariel Bi" not in body:
            print("  FAIL https://www.arielglow.com/: missing site content")
            return False
        print("  OK https://www.arielglow.com/")
    except Exception as exc:
        print(f"  FAIL https://www.arielglow.com/: {exc}")
        return False

    try:
        no_redirect = urllib.request.HTTPRedirectHandler()
        no_redirect.redirect_request = lambda *args, **kwargs: None  # type: ignore[method-assign]
        opener = urllib.request.build_opener(no_redirect)
        req = urllib.request.Request("https://arielglow.com/", method="GET")
        req.add_header("User-Agent", "arielglow-hardening/1.0")
        try:
            opener.open(req, timeout=20)
        except urllib.error.HTTPError as e:
            if e.code in (301, 302, 307, 308):
                loc = e.headers.get("Location", "")
                if "www.arielglow.com" in loc:
                    print(f"  OK https://arielglow.com/ -> {loc}")
                    return True
            print(f"  FAIL apex redirect: HTTP {e.code} Location={e.headers.get('Location')}")
            return False
        print("  FAIL apex: expected redirect to www")
        return False
    except Exception as exc:
        print(f"  FAIL https://arielglow.com/: {exc}")
        return False


class CloudflareApi:
    def __init__(self, token: str) -> None:
        self.base = "https://api.cloudflare.com/client/v4"
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

    def request(self, method: str, path: str, data: dict | None = None) -> dict:
        body = json.dumps(data).encode() if data is not None else None
        url = f"{self.base}{path}"
        req = urllib.request.Request(url, data=body, headers=self.headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            return json.loads(e.read().decode())

    def get(self, path: str) -> dict:
        return self.request("GET", path)

    def post(self, path: str, data: dict) -> dict:
        return self.request("POST", path, data)

    def put(self, path: str, data: dict) -> dict:
        return self.request("PUT", path, data)

    def patch(self, path: str, data: dict) -> dict:
        return self.request("PATCH", path, data)

    def delete(self, path: str) -> dict:
        return self.request("DELETE", path)


def fqdn(name: str) -> str:
    if name == "@":
        return ZONE_NAME
    if name.endswith(ZONE_NAME):
        return name
    return f"{name}.{ZONE_NAME}"


def cname_matches(rec: dict, target: str, content: str) -> bool:
    return (
        rec["name"] == target
        and rec["type"] == "CNAME"
        and norm_host(rec["content"]) == norm_host(content)
    )


def ensure_cname(
    api: CloudflareApi, zone_id: str, existing: list[dict], name: str, content: str
) -> tuple[bool, str]:
    target = fqdn(name)
    for rec in existing:
        if cname_matches(rec, target, content):
            return True, f"DNS CNAME OK: {target} -> {content}"

    for rec in existing:
        if rec["name"] == target and rec["type"] in ("A", "AAAA", "CNAME"):
            res = api.delete(f"/zones/{zone_id}/dns_records/{rec['id']}")
            if not res.get("success") and is_auth_error(res):
                return (
                    False,
                    f"DNS CNAME MISSING/WRONG for {target} (token lacks DNS Edit to fix)",
                )

    res = api.post(
        f"/zones/{zone_id}/dns_records",
        {"type": "CNAME", "name": name, "content": content, "proxied": True, "ttl": 1},
    )
    if res.get("success"):
        return True, f"DNS CNAME created: {target} -> {content}"
    if is_auth_error(res):
        return False, f"DNS CNAME cannot create {target} (token lacks DNS Edit)"
    return False, f"DNS CNAME {target}: {res.get('errors')}"


def verify_security_txt() -> bool:
    try:
        req = urllib.request.Request(SECURITY_TXT_URL, method="GET")
        req.add_header("User-Agent", "arielglow-hardening/1.0")
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read(2000).decode("utf-8", errors="replace")
        if "Contact:" in body and "hi@arielglow.com" in body:
            print(f"  OK {SECURITY_TXT_URL}")
            return True
        print(f"  FAIL {SECURITY_TXT_URL}: unexpected content")
        return False
    except Exception as exc:
        print(f"  FAIL {SECURITY_TXT_URL}: {exc}")
        return False


def ensure_bot_management(api: CloudflareApi, zone_id: str) -> tuple[bool, str]:
    desired = BOT_CONFIG
    current = api.get(f"/zones/{zone_id}/bot_management")
    if current.get("success"):
        result = current.get("result") or {}
        if (
            result.get("fight_mode") is True
            and result.get("ai_bots_protection") == "block"
            and result.get("crawler_protection") == "enabled"
        ):
            return True, "Bot management OK (Bot Fight, block AI bots, AI Labyrinth)"
    res = api.put(f"/zones/{zone_id}/bot_management", desired)
    if res.get("success"):
        return True, "Bot management applied (Bot Fight, block AI bots, AI Labyrinth)"
    if is_auth_error(res):
        return False, "Bot management: token lacks Bot Management Edit"
    return False, f"Bot management: {res.get('errors')}"


def ensure_dmarc_management(api: CloudflareApi, zone_id: str) -> tuple[bool, str]:
    res = api.patch(
        f"/zones/{zone_id}/email/security/dmarc-reports",
        {"enabled": True},
    )
    if res.get("success"):
        return True, "DMARC Management enabled"
    if is_auth_error(res):
        return False, "DMARC Management: token lacks Email Security Edit"
    return False, f"DMARC Management: {res.get('errors')}"


def ensure_turnstile(api: CloudflareApi, account: str) -> tuple[bool, str]:
    listed = api.get(f"/accounts/{account}/challenges/widgets")
    if listed.get("success"):
        for widget in listed.get("result") or []:
            if widget.get("name") == TURNSTILE_NAME:
                return True, f"Turnstile widget OK: {TURNSTILE_NAME}"
    res = api.post(
        f"/accounts/{account}/challenges/widgets",
        {
            "name": TURNSTILE_NAME,
            "domains": list(TURNSTILE_DOMAINS),
            "mode": "managed",
        },
    )
    if res.get("success"):
        return True, f"Turnstile widget created: {TURNSTILE_NAME}"
    if is_auth_error(res):
        return False, "Turnstile: token lacks Account Turnstile Edit"
    return False, f"Turnstile: {res.get('errors')}"


def ensure_dmarc_txt(
    api: CloudflareApi, zone_id: str, existing: list[dict]
) -> tuple[bool, str]:
    target = fqdn("_dmarc")
    dmarc_records = [
        rec for rec in existing if rec.get("name") == target and rec.get("type") == "TXT"
    ]
    if len(dmarc_records) == 1:
        txt = dmarc_records[0]["content"].strip('"')
        if txt == DMARC:
            return True, f"DNS TXT OK: {target}"
        res = api.patch(
            f"/zones/{zone_id}/dns_records/{dmarc_records[0]['id']}",
            {"type": "TXT", "name": "_dmarc", "content": DMARC, "ttl": 1},
        )
        if res.get("success"):
            return True, f"DNS TXT updated: {target} (DMARC)"
        if is_auth_error(res):
            return False, f"DNS TXT cannot update {target} (token lacks DNS Edit)"
        return False, f"DNS TXT update {target}: {res.get('errors')}"

    if len(dmarc_records) > 1:
        kept = False
        for rec in dmarc_records:
            txt = rec["content"].strip('"')
            if not kept and txt.startswith("v=DMARC1"):
                res = api.patch(
                    f"/zones/{zone_id}/dns_records/{rec['id']}",
                    {"type": "TXT", "name": "_dmarc", "content": DMARC, "ttl": 1},
                )
                if res.get("success"):
                    kept = True
                    continue
            api.delete(f"/zones/{zone_id}/dns_records/{rec['id']}")
        if kept:
            return True, f"DNS TXT deduped and updated: {target} (DMARC)"
        return False, f"DNS TXT duplicate _dmarc records (token lacks DNS Edit)"

    return ensure_txt(api, zone_id, existing, "_dmarc", DMARC)


def ensure_txt(
    api: CloudflareApi, zone_id: str, existing: list[dict], name: str, content: str
) -> tuple[bool, str]:
    target = fqdn(name)
    for rec in existing:
        if rec["name"] == target and rec["type"] == "TXT":
            txt = rec["content"].strip('"')
            if txt == content or txt.startswith("v=DMARC1"):
                return True, f"DNS TXT OK: {target}"

    res = api.post(
        f"/zones/{zone_id}/dns_records",
        {"type": "TXT", "name": name, "content": content, "ttl": 1},
    )
    if res.get("success"):
        return True, f"DNS TXT created: {target} (DMARC)"
    if is_auth_error(res):
        return False, f"DNS TXT cannot create {target} (token lacks DNS Edit)"
    return False, f"DNS TXT {target}: {res.get('errors')}"


if __name__ == "__main__":
    sys.exit(main())
