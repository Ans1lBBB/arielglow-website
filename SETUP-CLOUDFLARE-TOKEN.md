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
