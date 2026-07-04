import { Router } from "express";
import { prisma } from "../lib/prisma";
import { getFullSnapshot } from "../services/snapshot";
import { emitDevicesUpdate } from "../sockets";
import { runAlertEngine } from "../services/alertEngine";
import { markRoomAsReal } from "../services/deviceSimulator";

const router = Router();

// GET /api/rooms -> full snapshot of all rooms (used by dashboard on load,
// and by the Discord bot's !status command)
router.get("/", async (_req, res) => {
  const snapshot = await getFullSnapshot();
  res.json(snapshot);
});

// GET /api/rooms/:name -> a single room's status (used by !room <name>)
router.get("/:name", async (req, res) => {
  const snapshot = await getFullSnapshot();
  const room = snapshot.rooms.find(
    (r) => r.name.toLowerCase() === req.params.name.toLowerCase()
  );
  if (!room) {
    return res.status(404).json({ error: `Room "${req.params.name}" not found` });
  }
  res.json(room);
});

// POST /api/rooms/update
// Called by the ESP32 firmware (see sketch.ino / BACKEND_URL) with a payload like:
// {
//   "room": "WorkRoom1",
//   "devices": [{ "name": "Fan1", "type": "fan", "state": true }, ...],
//   "theoretical_watts": 70,
//   "sensor_amps": 0.32,
//   "sensor_watts": 70.4
// }
router.post("/update", async (req, res) => {
  const { room: roomName, devices } = req.body;

  if (!roomName || !Array.isArray(devices)) {
    return res.status(400).json({ error: "Expected { room, devices: [...] }" });
  }

  const room = await prisma.room.findUnique({ where: { name: roomName } });
  if (!room) {
    return res.status(404).json({ error: `Unknown room "${roomName}"` });
  }

  for (const incoming of devices) {
    const device = await prisma.device.findUnique({
      where: { roomId_name: { roomId: room.id, name: incoming.name } },
    });
    if (!device) continue; // silently skip unknown device names

    if (device.isOn !== incoming.state) {
      await prisma.device.update({
        where: { id: device.id },
        data: { isOn: incoming.state, lastChanged: new Date() },
      });

      if (incoming.state) {
        await prisma.reading.create({
          data: {
            deviceId: device.id,
            watts: device.ratedWatts,
            amps: Number((device.ratedWatts / 220).toFixed(2)),
          },
        });
      }
    }
  }

  // Mark this room as "live hardware" so the simulator doesn't fight with it
  markRoomAsReal(roomName);

  const snapshot = await getFullSnapshot();
  emitDevicesUpdate(snapshot);
  await runAlertEngine(snapshot);

  res.json({ ok: true, room: roomName, updatedAt: new Date().toISOString() });
});

// POST /api/devices/:id/toggle -> manual toggle from the dashboard UI
router.post("/devices/:id/toggle", async (req, res) => {
  const device = await prisma.device.findUnique({ where: { id: req.params.id } });
  if (!device) return res.status(404).json({ error: "Device not found" });

  const updated = await prisma.device.update({
    where: { id: device.id },
    data: { isOn: !device.isOn, lastChanged: new Date() },
  });

  if (updated.isOn) {
    await prisma.reading.create({
      data: {
        deviceId: updated.id,
        watts: updated.ratedWatts,
        amps: Number((updated.ratedWatts / 220).toFixed(2)),
      },
    });
  }

  const snapshot = await getFullSnapshot();
  emitDevicesUpdate(snapshot);
  await runAlertEngine(snapshot);

  res.json(updated);
});

export default router;
