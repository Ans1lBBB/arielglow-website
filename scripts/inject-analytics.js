#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const INDEX = path.join(ROOT, "index.html");
const MARKER = "  <!-- CF_WEB_ANALYTICS -->";

const token =
  process.env.CF_WEB_ANALYTICS_TOKEN?.trim() ||
  (fs.existsSync(path.join(ROOT, ".cf-analytics-token"))
    ? fs.readFileSync(path.join(ROOT, ".cf-analytics-token"), "utf8").trim()
    : "");

let html = fs.readFileSync(INDEX, "utf8");

html = html.replace(
  /\s*<!-- Cloudflare Web Analytics -->[\s\S]*?cloudflareinsights\.com\/beacon\.min\.js[^<]*<\/script>\s*/g,
  "\n"
);

const snippet = token
  ? `  <!-- Cloudflare Web Analytics -->
  <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='${JSON.stringify({ token })}'></script>`
  : MARKER;

if (html.includes(MARKER)) {
  html = html.replace(MARKER, snippet);
} else if (token) {
  html = html.replace("</head>", `${snippet}\n</head>`);
}

fs.writeFileSync(INDEX, html, "utf8");
console.log(token ? "Injected Cloudflare Web Analytics into index.html." : "No token; placeholder kept.");
