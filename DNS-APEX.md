# arielglow.com：DNS 與 www 設定

## 為什麼會出現「www 沒內容、只有根網域有內容」？

常見原因：

1. **`www` 沒有 CNAME 到 Pages**（只有 A 記錄或根本沒記錄）→ 瀏覽器打到錯誤的來源，可能空白或舊的駐留頁。
2. **GitHub Actions 無法改 DNS**：日誌會出現 `Authentication error`（Token 缺少 **Zone → DNS → Edit**）。需手動改一次。
3. **根網域沒有 301 到 www**：兩邊各顯示一份，搜尋引擎也會分裂。網站已用 `functions/_middleware.js` 強制 `arielglow.com` → `www.arielglow.com`。

---

## 請在 Cloudflare 手動確認（約 2 分鐘）

**Dashboard** → **arielglow.com** → **DNS** → **記錄**

| 名稱 | 類型 | 目標 | Proxy |
|------|------|------|-------|
| `www` | **CNAME** | `arielglow-website.pages.dev` | 已代理（橘雲） |
| `@` | **CNAME** | `arielglow-website.pages.dev` | 已代理（橘雲） |

- 若 `www` 或 `@` 是 **A / AAAA** 記錄，請**刪除**後改成上表 CNAME。
- **不要刪** iCloud 的 **MX**、**TXT**（`hi@arielglow.com` 會壞）。

**Workers & Pages** → **arielglow-website** → **Custom domains** 應有：

- `www.arielglow.com`（建議設為主要網域）
- `arielglow.com`

---

## 驗收

改完 DNS 後等 1–5 分鐘，再開：

- https://www.arielglow.com/：應看到 Ariel 首頁
- https://arielglow.com/：應 **自動跳轉** 到 www（網址列變成 `www.`）

若仍空白：瀏覽器 **強制重新整理**（Mac：`Cmd+Shift+R`），或無痕視窗再試。

---

## 自動維護（已設定）

每次 push `main` 部署後，會執行 `scripts/ensure-cloudflare.py`：

- 確認 `@` / `www` CNAME → `arielglow-website.pages.dev`
- 綁定 Pages 自訂網域
- 開啟「一律使用 HTTPS」
- 新增 DMARC（`_dmarc` TXT）
- Zone 層 apex → www 301（與 `functions/_middleware.js` 雙重保險）

也可手動跑：**Actions** → **Cloudflare hardening** → **Run workflow**

### DMARC（安全性見解，手動加一筆即可）

**DNS** → **新增記錄**：

| 類型 | 名稱 | 內容 |
|------|------|------|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:hi@arielglow.com` |

### 一律使用 HTTPS（建議開啟）

**SSL/TLS** → **邊緣憑證** → 開啟 **一律使用 HTTPS**

### API Token 權限（若 Actions 無法自動改 DNS/SSL）

編輯 GitHub Secret 用的 Token，需包含：

- Zone → DNS → Edit
- Zone → SSL and Certificates → Edit
- Zone → Zone → Read
- Zone → Page Rules / Redirect Rules → Edit（或 Account Rulesets）
- Account → Cloudflare Pages → Edit
