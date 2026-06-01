#!/usr/bin/env python3
"""
Idempotent Cloudflare setup for arielglow.com:
- DNS CNAME (@, www) -> Pages
- Pages custom domains
- Always Use HTTPS + HTTPS rewrites
- DMARC TXT (fixes Security Insights email warnings)
- Zone redirect rule: apex -> www (backup to Pages middleware)
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
DMARC = "v=DMARC1; p=none; rua=mailto:hi@arielglow.com"
REDIRECT_DESC = "Redirect apex to www"


def main() -> int:
    token = os.environ.get("CF_TOKEN") or os.environ.get("CLOUDFLARE_API_TOKEN")
    account = os.environ.get("CF_ACCOUNT") or os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    if not token or not account:
        print("Missing CF_TOKEN / CLOUDFLARE_API_TOKEN or account id", file=sys.stderr)
        return 1

    api = CloudflareApi(token)
    errors: list[str] = []

    zones = api.get(f"/zones?name={ZONE_NAME}")
    if not zones.get("result"):
        print(f"Zone {ZONE_NAME} not found or token lacks Zone:Read", file=sys.stderr)
        return 1
    zone_id = zones["result"][0]["id"]
    print(f"Zone: {ZONE_NAME} ({zone_id})")

    # DNS
    records = api.get(f"/zones/{zone_id}/dns_records?per_page=100")
    if not records.get("success"):
        errors.append(f"DNS list: {records.get('errors')}")
        existing: list[dict] = []
    else:
        existing = records.get("result") or []

    for name in ("www", "@"):
        upsert_cname(api, zone_id, existing, name, PAGES_TARGET)

    upsert_txt(api, zone_id, existing, "_dmarc", DMARC)

    # SSL / HTTPS
    for setting, value in (
        ("always_use_https", "on"),
        ("automatic_https_rewrites", "on"),
        ("ssl", "full"),
    ):
        res = api.patch(f"/zones/{zone_id}/settings/{setting}", {"value": value})
        if res.get("success"):
            print(f"Setting {setting}={value} OK")
        else:
            errors.append(f"Setting {setting}: {res.get('errors')}")

    # Pages custom domains
    for domain in CUSTOM_DOMAINS:
        res = api.post(
            f"/accounts/{account}/pages/projects/{PAGES_PROJECT}/domains",
            {"name": domain},
        )
        if res.get("success"):
            print(f"Pages domain bound: {domain}")
        elif any(
            e.get("code") == 8000018
            for e in (res.get("errors") or [])
        ):
            print(f"Pages domain already bound: {domain}")
        else:
            errors.append(f"Pages domain {domain}: {res.get('errors')}")

    # Redirect rule (zone-level backup)
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
        rules = [r for r in rs.get("rules", []) if r.get("description") != REDIRECT_DESC]
        rules.insert(0, rule)
        res = api.put(f"/zones/{zone_id}/rulesets/{rs['id']}", {"rules": rules})
    else:
        res = api.put(
            f"/zones/{zone_id}/rulesets/phases/{phase}/entrypoint",
            {"rules": [rule]},
        )
    if res.get("success"):
        print("Apex -> www redirect rule OK")
    else:
        errors.append(f"Redirect rule: {res.get('errors')}")

    if errors:
        print("\nWarnings/errors:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 2

    print("\nAll Cloudflare hardening checks passed.")
    return 0


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


def upsert_cname(api: CloudflareApi, zone_id: str, existing: list[dict], name: str, content: str) -> None:
    target = fqdn(name)
    for rec in existing:
        if rec["name"] == target and rec["type"] == "CNAME" and rec["content"] == content:
            print(f"DNS CNAME OK: {target} -> {content}")
            return
    for rec in existing:
        if rec["name"] == target and rec["type"] in ("A", "AAAA", "CNAME"):
            print(f"DNS delete {rec['type']} {target} ({rec['content']})")
            api.delete(f"/zones/{zone_id}/dns_records/{rec['id']}")
    res = api.post(
        f"/zones/{zone_id}/dns_records",
        {"type": "CNAME", "name": name, "content": content, "proxied": True, "ttl": 1},
    )
    if res.get("success"):
        print(f"DNS CNAME created: {target} -> {content}")
    else:
        raise RuntimeError(f"DNS CNAME {target}: {res.get('errors')}")


def upsert_txt(api: CloudflareApi, zone_id: str, existing: list[dict], name: str, content: str) -> None:
    target = fqdn(name)
    for rec in existing:
        if rec["name"] == target and rec["type"] == "TXT" and rec["content"].strip('"') == content:
            print(f"DNS TXT OK: {target}")
            return
    for rec in existing:
        if rec["name"] == target and rec["type"] == "TXT" and "_dmarc" in target:
            print(f"DNS delete old DMARC at {target}")
            api.delete(f"/zones/{zone_id}/dns_records/{rec['id']}")
    res = api.post(
        f"/zones/{zone_id}/dns_records",
        {"type": "TXT", "name": name, "content": content, "ttl": 1},
    )
    if res.get("success"):
        print(f"DNS TXT created: {target}")
    else:
        raise RuntimeError(f"DNS TXT {target}: {res.get('errors')}")


if __name__ == "__main__":
    sys.exit(main())
