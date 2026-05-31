# arielglow.com — 根網域設定說明

## 目前狀態

你已**成功停用駐留頁面**，鎖定的 `default-page.registrar-servers.com` 記錄已消失。👍

現在 DNS 裡只有 `www` 指到網站，**不含 www 的 `arielglow.com` 還沒設定**，所以打 `arielglow.com` 仍可能打不開。

---

## 方法 A 第 5 步（圖解說明）

你截圖裡選的是 **A 記錄** — 這是錯的。Cloudflare Pages 要用 **CNAME**，不是 A。

請照下面填：

1. Cloudflare → **arielglow.com** → **DNS** → **新增記錄**
2. 欄位這樣填：

| 欄位 | 填什麼 |
|------|--------|
| **類型** | 選 **CNAME**（不要選 A） |
| **名稱** | 填 **`@`**（代表 arielglow.com 根網域） |
| **目標** | 填 **`arielglow-website.pages.dev`** |
| **Proxy 狀態** | **已代理**（橘色雲朵 ☁️ 開啟） |
| **TTL** | 自動 |

3. 按 **儲存**

### 為什麼不是 A 記錄？

- **A 記錄** = 填一組 IP 位址（例如 104.21.x.x）
- **CNAME 記錄** = 填一個網域名稱，指向你的 Pages 專案

Cloudflare Pages 的網址是 `arielglow-website.pages.dev`，所以要用 CNAME 指過去。

### 完成後

- `arielglow.com` → 自動轉到 `www.arielglow.com`（網站內 `_redirects` 已設定）
- **不要刪** iCloud 的 MX / TXT 記錄（email 會壞）

---

## 若 CNAME @ 無法新增

改用 **Redirect Rule**（不用改 DNS）：

Cloudflare → **規則** → **Redirect Rules** → 新增：

- 若 `arielglow.com/*` → 轉到 `https://www.arielglow.com/$1`（301）
