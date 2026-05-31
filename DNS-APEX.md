# arielglow.com — 根網域 DNS 無法刪除？

## 為什麼刪不掉？

截圖中 `@`（arielglow.com）的 CNAME 指向 `default-page.registrar-servers.com`，這是 **Cloudflare Registrar 的駐留頁面（Parking Page）** 自動產生的記錄，**在 DNS 頁面無法直接刪除或編輯**。

## 正確做法（二選一）

### 方法 A：停用駐留頁面（推薦）

1. Cloudflare Dashboard → 左側 **網域註冊**（Domain Registration / Registrar）
2. 點 **arielglow.com**
3. 找到 **駐留頁面（Parking Page）** → **停用**
4. 回到 **DNS → 記錄**，鎖定的 CNAME 應會消失或可編輯
5. 新增 CNAME：
   - **名稱**：`@`（或 arielglow.com）
   - **目標**：`arielglow-website.pages.dev`
   - **Proxy**：已代理（橘雲）

### 方法 B：不動 DNS，用轉址規則

若暫時不想動 Registrar：

1. Cloudflare → **arielglow.com** → **規則（Rules）** → **Redirect Rules**（或 Bulk Redirects）
2. 新增規則：
   - **若** Hostname equals `arielglow.com`
   - **則** Dynamic redirect → `https://www.arielglow.com/${uri.path}`
   - 狀態碼 **301**

這樣訪客打 `arielglow.com` 會自動跳到 `www`，無需刪除那筆鎖定記錄。

## 目前狀態

| 網址 | 狀態 |
|------|------|
| `www.arielglow.com` | ✅ 已指向 Pages，網站正常 |
| `arielglow.com` | ⚠️ 仍指向 Registrar 駐留頁，需用上方方法 A 或 B |

Email（iCloud MX / TXT）記錄請**不要刪除**。
