import { prisma } from "../lib/prisma";
import { emitDevicesUpdate } from "../sockets";
import { runAlertEngine } from "./alertEngine";
import { getFullSnapshot } from "./snapshot";

const SIMULATOR_INTERVAL_MS = Number(process.env.SIMULATOR_INTERVAL_MS ?? 8000);

// Rooms that recently received a REAL update from an ESP32 (POST /api/rooms/update)
// are skipped by the simulator for a short window, so real hardware data
// (e.g. Work Room 1's Wokwi circuit) isn't immediately overwritten by random noise.
const REAL_DEVICE_COOLDOWN_MS = 30_000;
const lastRealUpdateByRoom = new Map<string, number>();

export function markRoomAsReal(roomName: string) {
  lastRealUpdateByRoom.set(roomName, Date.now());
}

function isRoomLive(roomName: string): boolean {
  const last = lastRealUpdateByRoom.get(roomName);
  if (!last) return false;
  return Date.now() - last < REAL_DEVICE_COOLDOWN_MS;
}

// Roughly a 12% chance any given device flips state on a tick.
// Keeps the dashboard feeling "alive" without flickering constantly.
const FLIP_PROBABILITY = 0.12;

async function tick() {
  const rooms = await prisma.room.findMany({ include: { devices: true } });

  for (const room of rooms) {
    if (isRoomLive(room.name)) continue; // let real ESP32 data stand

    for (const device of room.devices) {
      if (Math.random() < FLIP_PROBABILITY) {
        const newState = !device.isOn;
        await prisma.device.update({
          where: { id: device.id },
          data: { isOn: newState, lastChanged: new Date() },
        });

        if (newState) {
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
  }

  const snapshot = await getFullSnapshot();
  emitDevicesUpdate(snapshot);
  await runAlertEngine(snapshot);
}

export function startSimulator() {
  console.log(`[simulator] starting, tick every ${SIMULATOR_INTERVAL_MS}ms`);
  setInterval(() => {
    tick().catch((err) => console.error("[simulator] tick failed:", err));
  }, SIMULATOR_INTERVAL_MS);
}
