# Cloudflare API Token（讓 Actions 能自動改 DNS / SSL）

目前 GitHub Secret 的 Token **可以部署 Pages**，但 **不能改 DNS / SSL**（會出現 `Authentication error` code 10000）。

請在 Cloudflare 建立或更新 Token（約 2 分鐘）：

1. [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) → **Create Token**
2. 使用範本 **Edit zone DNS**，或自訂權限：

| 資源 | 權限 |
|------|------|
| Zone `arielglow.com` | DNS → Edit |
| Zone `arielglow.com` | SSL and Certificates → Edit |
| Zone `arielglow.com` | Zone → Read |
| Zone `arielglow.com` | Page Rules / Redirect Rules → Edit |
| Account | Cloudflare Pages → Edit |

3. 複製新 Token → GitHub repo **Settings → Secrets → Actions** → 更新 `CLOUDFLARE_API_TOKEN`
4. **Actions** → **Cloudflare hardening** → **Run workflow**

更新後，每次 push 會自動維護：CNAME、DMARC、一律 HTTPS、apex→www 轉址。

---

## 訪客統計（Cloudflare Web Analytics）

每次部署會自動為 **arielglow.com** 插入 Web Analytics（免費，與 anselbi.com 相同機制）。

**查看數據：** Cloudflare Dashboard → 網域 **arielglow.com** → **Analytics & Logs** → **Web Analytics**

啟用後約 24～48 小時會有穩定圖表。

若 GitHub Actions 出現 `Authentication error`、網站沒有追蹤碼：

1. 到 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) 確認 Token 含 **Account Analytics**（或與 `anselbi-website` 同一支完整權限 Token）
2. 更新本 repo **Settings → Secrets → Actions** 的 `CLOUDFLARE_API_TOKEN`
3. 或於 Cloudflare 後台 **Web Analytics** 新增 `arielglow.com` 後，把 **site token** 存成 Secret：`CF_WEB_ANALYTICS_TOKEN`，再重新部署
