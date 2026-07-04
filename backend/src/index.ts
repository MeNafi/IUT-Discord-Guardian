import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { initSocket } from "./sockets";
import { startSimulator } from "./services/deviceSimulator";

import roomsRouter from "./routes/rooms";
import usageRouter from "./routes/usage";
import alertsRouter from "./routes/alerts";

const app = express();
app.use(cors());
app.use(express.json());

// --- Routes ---
// /api/rooms            -> GET all rooms, GET /:name, POST /update (ESP32), POST /devices/:id/toggle
// /api/usage             -> GET live power + today's kWh estimate
// /api/alerts             -> GET active alerts, POST /:id/resolve
app.use("/api/rooms", roomsRouter);
app.use("/api/usage", usageRouter);
app.use("/api/alerts", alertsRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT ?? 5000);
const httpServer = createServer(app);

initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Office IoT backend listening on http://localhost:${PORT}`);
  console.log(`ESP32 should POST device updates to: http://<public-url>/api/rooms/update`);
  startSimulator();
});
