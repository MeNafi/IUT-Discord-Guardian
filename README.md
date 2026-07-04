# Office IoT Monitor — "Lights, Fans, Discord"

Monorepo containing all four deliverables in one place:

```
project/
├── hardware/     Wokwi diagram.json + sketch.ino (ESP32 circuit, 1 room representative)
├── backend/      Express + Prisma + PostgreSQL + Socket.io (single source of truth)
├── frontend/     React + TypeScript dashboard (Socket.io client, top-view layout)
└── bot/          discord.js bot (!status, !room, !usage + proactive alerts)
```

## Architecture (data flow)

```
[Wokwi ESP32 - Work Room 1]  --POST /api/rooms/update-->
[Device Simulator - other rooms]  ------------------->  [Express API + PostgreSQL] --Socket.io--> [React Dashboard]
                                                                    |
                                                          REST (getSnapshot/getRoom/getUsage)
                                                                    |
                                                              [Discord Bot] ---> Discord server
                                                       (also listens on the same Socket.io
                                                        for "alert:new" to post proactively)
```

The backend is the single source of truth — both the dashboard and the bot read from the exact same API/DB, exactly as the architecture requirement asks.

---

## Prerequisites (install once)

| Tool | Why | Check |
|---|---|---|
| Node.js ≥ 18 | runs backend, frontend, bot | `node -v` |
| npm | package manager | `npm -v` |
| PostgreSQL ≥ 14 (local or Docker) | backend database | `psql --version` |
| A Discord bot token | for the bot | https://discord.com/developers/applications |
| ngrok (optional) | expose local backend to the Wokwi ESP32 | `ngrok version` |

If you don't want to install PostgreSQL locally, run it with Docker:
```bash
docker run --name office-iot-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=office_iot -p 5432:5432 -d postgres:16
```

---

## 1) Backend setup

```bash
cd project/backend
npm install
cp .env.example .env        # edit DATABASE_URL if needed

npx prisma migrate dev --name init
npm run prisma:seed         # seeds 3 rooms x 5 devices = 15 devices

npm run dev                 # http://localhost:5000
```

Backend dependencies installed by `npm install`: `express`, `@prisma/client`, `prisma`, `socket.io`, `cors`, `dotenv`, plus TypeScript tooling (`typescript`, `ts-node-dev`, `@types/*`).

## 2) Frontend setup (open a new terminal)

```bash
cd project/frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:5000 by default

npm run dev                 # http://localhost:5173
```

Frontend dependencies: `react`, `react-dom`, `socket.io-client`, plus `vite`, `@vitejs/plugin-react`, `typescript`.

Open `http://localhost:5173` — you should see the office layout, power meter, alerts panel, and device list update live as the backend's simulator changes device states every few seconds.

## 3) Discord bot setup (open a new terminal)

```bash
cd project/bot
npm install
cp .env.example .env
```

Edit `bot/.env`:
```
DISCORD_TOKEN=your-bot-token
BACKEND_API_URL=http://localhost:5000
COMMAND_PREFIX=!
ALERT_CHANNEL_ID=your-channel-id   # optional, enables proactive alert posts
```

Then:
```bash
npm run dev
```

In Discord, invite the bot to your server (OAuth2 URL Generator → scope `bot` → permissions `Send Messages`, `Read Message History`), then try:
```
!status
!room work1
!usage
!help
```

Bot dependencies: `discord.js`, `dotenv`, `socket.io-client`, plus TypeScript tooling.

## 4) Hardware (Wokwi) — Work Room 1's representative circuit

1. Go to wokwi.com → New Project → ESP32.
2. Replace the generated `diagram.json` and `sketch.ino` with the files in `project/hardware/`.
3. Because Wokwi's simulated network can't reach `localhost`, expose your local backend with ngrok:
   ```bash
   ngrok http 5000
   ```
   Copy the `https://xxxx.ngrok-free.app` URL into `hardware/sketch.ino`:
   ```cpp
   const char* BACKEND_URL = "https://xxxx.ngrok-free.app/api/rooms/update";
   ```
4. Run the Wokwi simulation — toggling relays there will now update Work Room 1 live on both the dashboard and the bot.

---

## Run order (for a live demo)

1. PostgreSQL running (Docker or local)
2. `backend` → `npm run dev`
3. `frontend` → `npm run dev`
4. `bot` → `npm run dev`
5. (optional) Wokwi simulation with `ngrok` tunnel pointed at the backend

## Notes / assumptions

- Simulated data covers all 3 rooms by default (`deviceSimulator.ts`); if the ESP32 posts real data for `WorkRoom1`, the simulator backs off that room for 30s so it doesn't fight the real hardware.
- "Today's estimated kWh" in `/api/usage` is a simplified estimate (`current watts × hours elapsed today`), documented in `backend/src/routes/usage.ts` — not a true time-integrated reading, since there's no continuous real current sensor.
- Discord bot responses are template-based (not an LLM call) to avoid requiring an extra API key; `bot/src/lib/formatters.ts` is the single place to swap in an LLM call (e.g. OpenAI/Anthropic) if you want the "strongly encouraged" conversational tone — just replace the return values with a generated string built from the same data.
