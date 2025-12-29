# VuDials Stock Monitor (v1)
<img src="assets\vu1-stock-screens.png" width="400"/>

Node (ESM) + Angular app that:

- polls stock quotes
- renders a dial-face PNG
- pushes **needle + backlight + image** to **VuDials** hardware

**App state (config):** `data/app_config.json`

---

## Prerequisites 
The API keys are configured via the **UI settings page**:  
`http://localhost:3000/settings`

<img src="assets\vu1-stock-screens-setting-tab-1.png" width="300"/>
<img src="assets\vu1-stock-screens-setting-tab-2.png" width="300"/>

### 1) VuDials server

- Install and run the VuDials server from:  
  https://vudials.com/
- Default URL used by this project:  
  `http://localhost:5340`
- Generate an API key from the VuDials UI:  
  `http://localhost:5340/index.html?page=api_keys`


---

### 2) Logo.dev API key (dial image logos)

- Create an API key at:  
  https://www.logo.dev/dashboard/api-keys
- Configure it via the UI settings page:  
  `http://localhost:3000/settings`

---

### 3) Node.js

This project is tested with **Node 25.2.1**  
(see `package.json` → `volta`).

Other recent Node versions may work, but Node 25 is recommended.

---

## Quick start

```bash
npm start
```

That’s it.

`npm start` will:
1) build the Angular UI
2) start the Node server
3) start the stock monitor loop automatically

- UI: `http://localhost:3000`
- API base: `http://localhost:3000/api`

---

## Configuration (`data/app_config.json`)

Initial config example:

```json
{
  "vuServer": {
    "url": "http://localhost:5340",
    "apiKey": ""
  },
  "settings": {
    "intervalMinutes": 1,
    "thresholdPercent": 0.1
  },
  "logoDevToken": ""
}
```

Notes:

- `vuServer.apiKey`  
  Generated from the VuDials server UI.

- `settings.intervalMinutes`  
  Polling interval for stock quotes.

- `settings.thresholdPercent`  
  Minimum **percentage price change since the last hardware update** required before pushing a new update.

- `dials`  
  Automatically added to this file after the app discovers connected VuDials hardware.

Most users should configure values through the **UI settings page** instead of editing this file manually.

---

## API endpoints

- `GET /api/config`  
  Returns current config.

- `POST /api/config`  
  Updates config (excluding `dials`).

- `GET /api/preview/:ticker`  
  Renders a PNG preview for a stock ticker.

- `POST /api/refresh-dial`  
  Assigns a ticker to a dial and **forces** a hardware update (bypasses threshold checks).

Example:

```bash
curl -X POST http://localhost:3000/api/refresh-dial   -H "Content-Type: application/json"   -d '{"uid":"<DIAL_UID>","ticker":"AAPL"}'
```

---

## How it works (high level)

- `server/services/monitor.ts`  
  Main polling loop.

- `server/services/dial-service.ts`  
  Core pipeline: stock quote → image render → hardware update.

- `server/services/state.ts`  
  Persisted app config + in-memory per-dial runtime state.

- `server/services/vu-client.ts`  
  VuDials HTTP client.

Per-dial runtime state tracks:
- `lastPrice` – last price actually pushed to hardware
- `lastCrc` – CRC32 of the last rendered image (cheap visual-change detection)

---

## Roadmap

### v1.1
- Run via Electron.
- Start automatically when the OS boots.

### v2
- Make VuDials hardware optional (UI-only mode).
- Richer refresh / control UI.

## License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License.
