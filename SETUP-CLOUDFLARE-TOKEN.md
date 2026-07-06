# Cloudflare API Token（讓本機腳本能自動套用 Security Insights 修正）

目前預設的 Pages 部署 Token **無法**改 DNS、Bot Fight、DMARC。請建立一支 **Hardening Token**（約 2 分鐘）：

1. [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) → **Create Token** → **Create Custom Token**
2. 權限（資源選 **Account** `Ansel.b@me.com's Account` 下所有 Zone，或個別 `arielglow.com`）：

| 權限 | 等級 |
|------|------|
| Zone → DNS | Edit |
| Zone → SSL and Certificates | Edit |
| Zone → Zone Settings | Edit |
| Zone → Bot Management | Edit |
| Zone → Email Security | Edit |
| Zone → Page Rules / Redirect Rules | Edit |
| Account → Cloudflare Pages | Edit |
| Account → Turnstile | Edit |

3. 複製 Token → 本機 `.env` 加入：
   ```
   CLOUDFLARE_HARDENING_TOKEN=貼上這裡
   ```
   或直接把 `CLOUDFLARE_API_TOKEN` 換成這支完整權限 Token。
4. 本機執行：
   ```bash
   bash scripts/harden-security.sh
   ```

腳本會自動維護：Bot Fight、封鎖 AI 機器人、AI Labyrinth、DMARC 記錄與 DMARC Management、Turnstile widget、HTTPS、apex 轉址。

**帳號 MFA**（Security Insights「弱式驗證」）必須在 [Profile → Authentication](https://dash.cloudflare.com/profile/authentication) 手動開啟 2FA，API 無法代為設定。
