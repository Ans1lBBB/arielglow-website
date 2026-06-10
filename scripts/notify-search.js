#!/usr/bin/env node
/**
 * Notify Bing/Yandex (IndexNow) after deploy so name-search pages get recrawled sooner.
 */
const URLS = [
  "https://www.arielglow.com/",
  "https://www.arielglow.com/en/",
];
const KEY = "a1b2c3d4e5f6789012345678abcdef01";
const KEY_LOCATION = `https://www.arielglow.com/${KEY}.txt`;

async function notifyIndexNow() {
  const body = {
    host: "www.arielglow.com",
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: URLS,
  };

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (res.ok || res.status === 202) {
    console.log(`IndexNow OK (${res.status})`);
    return;
  }
  console.warn(`IndexNow ${res.status}: ${text || "(empty)"}`);
}

notifyIndexNow().catch((err) => {
  console.warn("IndexNow failed (non-fatal):", err.message);
});
