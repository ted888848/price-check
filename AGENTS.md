# Price Check — AI 專案脈絡

> 本文件提供 AI agent 維護本專案時所需的架構、資料流、開發指引與注意事項。內容依目前 repository 原始碼整理；修改程式後若架構、IPC 或設定契約變更，應同步更新本文件。

## 專案摘要

- 專案：`price-check`，版本見 `package.json`。
- 類型：Windows Electron 桌面應用程式。
- 用途：解析 Path of Exile（PoE 1 / PoE 2）物品文字，產生交易搜尋條件並查詢價格。
- UI：Vue 3 + TypeScript + Element Plus + UnoCSS。
- 分層：Electron main process、preload bridge、renderer process。
- 外部服務：`pathofexile.tw` trade API、PoE market API、GitHub auto-update；部分程式碼預留 `poedb.tw`。
- 套件管理：pnpm；CI 使用 Node 22、pnpm 11。

## 目錄與入口

```text
src/
  main/        視窗、overlay、快捷鍵、設定、剪貼簿、更新、proxy
  preload/     contextBridge：ipc、electron-store API、proxy port API
  ipc/         IPC channel 名稱與 TypeScript 型別契約
  lib/         共用 API client 與型別宣告
  renderer/    Vue UI、解析器、交易搜尋、市場資料
  assets/      圖示與圖片
  test/        Vitest 測試與測試資料
demo/          使用影片與操作截圖
dist/, release/  建置產物；不要直接修改
```

- `src/main/index.ts`：Electron lifecycle；初始化 config、tray、更新、視窗、快捷鍵。
- `src/preload/index.ts`：暴露 `window.ipc`、`window.store`、`window.proxyServer`。
- `src/renderer/main.ts`：建立 Vue app、註冊 Query client / Element Plus / UnoCSS。
- `src/renderer/App.vue`：組合 `PriceCheck`、設定視窗、overlay 與 widgets。

## 核心資料流

### 啟動

1. `src/main/index.ts` 啟動 Electron 並限制單一 instance。
2. `setupConfig()` 載入 `electron-store` 的 `appConfig`，註冊設定 IPC 與快捷鍵。
3. 建立 tray、檢查 auto-update。
4. 依 `config.poeVersion` 檢查快取；版本不同時從 trade API 載入 leagues/items/stats/static，整理後存入 `APIData` 或 `API2Data`。
5. 建立 overlay，attach 到標題為 `Path of Exile` 或 `Path of Exile 2` 的視窗。

### 價格查詢

1. 全域快捷鍵由 `src/main/shortcuts.ts` 觸發。
2. `src/main/clipboard.ts` 讀取遊戲複製的 item text；暫存寫入剪貼簿後會還原原內容。
3. main 透過 `priceCheck` IPC 將 item text 與 overlay 位置送到 renderer。
4. `PriceCheck.vue` 呼叫 `renderer/lib/itemAnalyze.ts` 的 `ItemAnalyzer`，依分隔線、物品類型、rarity、需求、socket、influence、mod 等段落產生 `ParsedItem`。
5. `NormalPriceCheck.vue` 或 `HeistPriceCheck.vue` 將 `ParsedItem` 轉為 trade query，經 `renderer/lib/tradeSide.ts` 搜尋並分頁抓取結果。
6. `renderer/lib/market.ts` 定期取得市場匯率，供價格換算與顯示。

### 設定與 Widget

- renderer 以 `GET_CONFIG` 同步取得設定，以 `SET_CONFIG` / `UPDATE_CONFIG` 更新。
- main `updateConfig()` 寫入 store、重新註冊快捷鍵、更新 PoE session cookie，並廣播 `UPDATE_CONFIG`。
- `Config.widgets` 目前實作 `regex` widget，可拖曳、顯示/隱藏、儲存 regex；點擊 regex 會切回 PoE 並設定搜尋 regex。

## IPC 契約

IPC channel 的 source of truth 是 `src/ipc/index.ts`；preload 與 renderer 都應使用 `IPC` 常數，不要手寫 channel 字串。

| 常數 | channel | 方向/用途 |
|---|---|---|
| `PRICE_CHECK_SHOW` | `priceCheck` | main → renderer；item text、位置、是否前次搜尋 |
| `OVERLAY_SHOW` | `overlay` | main → renderer；顯示 overlay |
| `FORCE_POE` | `forcePOE` | renderer → main；焦點切回 PoE |
| `POE_ACTIVE` | `poeActive` | main → renderer；PoE focus 狀態 |
| `GET_CONFIG` | `getConfig` | renderer → main sync；回傳 `Config` |
| `SET_CONFIG` | `setConfig` | renderer → main；設定 JSON |
| `UPDATE_CONFIG` | `updateConfig` | 雙向；renderer 傳入，main 廣播更新後設定 |
| `RELOAD_APIDATA` | `reloadAPIData` | renderer invoke main；重新載入 PoE API data |
| `GET_PROXY_PORT` | `getProxyPort` | renderer → main sync；取得本機 Hono proxy port |
| `SET_SEARCH_REGEX` | `setSearchRegex` | renderer → main；設定搜尋 regex |

新增 channel 時，須同步檢查 `src/ipc/index.d.ts`、preload bridge 與所有 listener/handler。

## 設定、快取與環境變數

`appConfig` 主要欄位：`characterName`、`league`、`poeVersion`、`POESESSID`、`priceCheckHotkey`、`settingHotkey`、`prevPriceCheckHotkey`、`shortcuts`、`searchExchangePrefer`、`searchOnlineType`、`autoSearchStackableItems`、`widgets`。

- `POESESSID` 是敏感資料，不得寫入文件、log 或 commit。
- PoE 1 / PoE 2 API 快取分別為 `APIData` / `API2Data`；常見 keys：`APIVersion`、`Leagues`、`APIitems`、`APImods`、`APIStatic`、`currencyImageUrl`、`heistReward`。
- `VITE_URL_BASE`：trade API 基底網址。
- `VITE_MARKET_API_URL`：市場匯率服務基底網址。
- `GH_TOKEN` / `GITHUB_TOKEN`：只供 release/build publish 使用，不能放入文件或 source code。

## 開發與驗證

```powershell
pnpm install
pnpm dev             # Electron + Vite 開發模式
pnpm type-check      # vue-tsc 型別檢查
pnpm test            # Vitest
pnpm build           # 型別檢查、electron-vite build、electron-builder
pnpm ipc-type        # 重新產生 src/ipc/index.d.ts
```

修改後至少執行 `pnpm type-check`；涉及 parser、trade query 或測試資料時再執行 `pnpm test`。build 會產生 `dist/` 與 `release/`，不要手動編輯這些目錄。

## 修改指南

- 解析規則：`src/renderer/lib/itemAnalyze.ts`、`regex.ts`、`const.ts`；並補 `src/test/parseItem.test.ts`。
- Trade query / response：`src/renderer/lib/tradeSide.ts` 與 `components/PriceCheck/*.vue`；注意 rate limit 與 query cache key。
- PoE API schema/轉換：`src/main/setupAPI.ts` 與共用型別，並確認兩套 store。
- OS、視窗、快捷鍵、剪貼簿、更新：`src/main/`；renderer 不應直接 import main-only module。
- 跨 process 通訊：先更新 `src/ipc/index.ts` 型別，再更新 handler、preload、renderer。
- UI：沿用 Element Plus、UnoCSS 與既有元件模式，避免把商業邏輯塞入 utility component。

## 風險與 AI 工作規則

- 部分既有檔案以錯誤編碼顯示亂碼；解析器中的遊戲文字比對是行為契約。修改前請用原始 clipboard text 與測試確認，不要只依畫面亂碼推測。
- `src/main/proxyServer.ts` 啟動隨機 port 的 Hono `/proxy` GET/POST 轉發；修改時檢查 SSRF、錯誤回應與安全影響。
- BrowserWindow 啟用 `webSecurity: false`、`nodeIntegration: true` 且使用 webview；外部內容相關改動屬安全敏感變更。
- `.env.local`、`*.local`、cookie、token 不可提交或輸出。若 token 已進入版本控制，應撤銷/輪替。
- 不要修改 `dist/`、`release/`、`node_modules/`；保留使用者未提交變更，採最小修改。
- 跨 process 變更要追蹤 main → preload → renderer 的型別與生命週期；完成後回報修改檔案、驗證指令與未驗證限制。
