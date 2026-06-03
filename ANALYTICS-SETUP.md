# Web Analytics（Plan B）

若 CI 顯示 `Authentication error`，在 GitHub 新增：

- Secret 名稱：`CF_WEB_ANALYTICS_TOKEN`
- 值：Cloudflare → **arielglow.com** → **Web Analytics** 的 **site token**

然後 Actions → **Deploy to Cloudflare Pages** → **Run workflow**。

官網說明見 `anselbi-website` 的 `ANALYTICS-SETUP.md`。
