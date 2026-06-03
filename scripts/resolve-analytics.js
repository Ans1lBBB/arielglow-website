#!/usr/bin/env node
/**
 * Resolves Cloudflare Web Analytics beacon token for arielglow.com.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TOKEN_FILE = path.join(ROOT, ".cf-analytics-token");
const HOSTS = ["www.arielglow.com", "arielglow.com"];

async function cfFetch(url, options = {}) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) throw new Error("CLOUDFLARE_API_TOKEN not set");
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!data.success) {
    const msg = data.errors?.map((e) => e.message).join("; ") || res.statusText;
    throw new Error(msg);
  }
  return data;
}

function pickTokenFromSites(sites) {
  for (const host of HOSTS) {
    const match = sites.find(
      (s) => s.host === host || s.rules?.some((r) => r.host === host)
    );
    if (match?.site_token) return match.site_token;
  }
  const glow = sites.filter(
    (s) =>
      s.host?.includes("arielglow") ||
      s.rules?.some((r) => r.host?.includes("arielglow"))
  );
  return glow[0]?.site_token || null;
}

async function getZoneId(accountId) {
  for (const name of ["arielglow.com", "www.arielglow.com"]) {
    const data = await cfFetch(
      `https://api.cloudflare.com/client/v4/zones?name=${encodeURIComponent(name)}`
    );
    if (data.result?.[0]?.id) return data.result[0].id;
  }
  return null;
}

async function resolveToken() {
  if (process.env.CF_WEB_ANALYTICS_TOKEN) {
    return process.env.CF_WEB_ANALYTICS_TOKEN.trim();
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!process.env.CLOUDFLARE_API_TOKEN || !accountId) {
    return null;
  }

  const list = await cfFetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/rum/site_info/list`
  );
  const sites = list.result || [];
  let token = pickTokenFromSites(sites);

  if (!token) {
    const zoneId = await getZoneId(accountId);
    const body = zoneId
      ? { zone_tag: zoneId, auto_install: false }
      : { host: "www.arielglow.com", auto_install: false };

    const created = await cfFetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/rum/site_info`,
      { method: "POST", body: JSON.stringify(body) }
    );
    token = created.result?.site_token || null;
  }

  return token;
}

async function main() {
  try {
    const token = await resolveToken();
    if (token) {
      fs.writeFileSync(TOKEN_FILE, token, "utf8");
      console.log("Cloudflare Web Analytics token resolved (arielglow.com).");
    } else {
      if (fs.existsSync(TOKEN_FILE)) fs.unlinkSync(TOKEN_FILE);
      console.log("Cloudflare Web Analytics: no token (skip).");
    }
  } catch (err) {
    console.warn("Cloudflare Web Analytics:", err.message);
    if (!fs.existsSync(TOKEN_FILE)) {
      console.warn("Build continues without analytics beacon.");
    }
  }
}

main();
