# arielglow.com — 根網域 DNS 設定（一次性）

`www.arielglow.com` 正常，但 `arielglow.com`（不含 www）若仍無法開啟，請在 Cloudflare 手動調整：

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → **arielglow.com** → **DNS** → **Records**
2. 刪除 `@`（arielglow.com）的 **A** 記錄（若存在）
3. 新增：

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `@` | `arielglow-website.pages.dev` | Proxied（橘雲） |

4. 確認 **Workers & Pages** → **arielglow-website** → **Custom domains** 已有 `arielglow.com` 與 `www.arielglow.com`

網站內 `_redirects` 會將 `arielglow.com` 301 轉到 `www.arielglow.com`。

若要之後全自動：GitHub Secrets 的 `CLOUDFLARE_API_TOKEN` 需加上 **Zone → DNS → Edit** 權限（含 `arielglow.com`）。
