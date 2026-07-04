import { prisma } from "../lib/prisma";
import { emitNewAlert } from "../sockets";
import { FullSnapshot } from "./snapshot";

const OFFICE_HOURS_START = Number(process.env.OFFICE_HOURS_START ?? 9);
const OFFICE_HOURS_END = Number(process.env.OFFICE_HOURS_END ?? 17);
const CONTINUOUS_ON_ALERT_MS = Number(
  process.env.CONTINUOUS_ON_ALERT_MS ?? 2 * 60 * 60 * 1000 // 2 hours
);

function isOutsideOfficeHours(date = new Date()): boolean {
  const hour = date.getHours();
  return hour < OFFICE_HOURS_START || hour >= OFFICE_HOURS_END;
}

// Avoid spamming duplicate alerts: only create a new one if there isn't
// already an unresolved alert of the same type for the same device/room
// created within the last hour.
async function createAlertIfNew(params: {
  type: "AFTER_HOURS" | "CONTINUOUS_ON";
  message: string;
  roomId?: string;
  deviceId?: string;
}) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const existing = await prisma.alert.findFirst({
    where: {
      type: params.type,
      roomId: params.roomId,
      deviceId: params.deviceId,
      resolved: false,
      timestamp: { gte: oneHourAgo },
    },
  });
  if (existing) return;

  const alert = await prisma.alert.create({
    data: {
      type: params.type,
      message: params.message,
      roomId: params.roomId,
      deviceId: params.deviceId,
    },
  });

  emitNewAlert(alert);
  console.log(`[alert] ${params.type}: ${params.message}`);
}

export async function runAlertEngine(snapshot: FullSnapshot) {
  const now = new Date();
  const afterHours = isOutsideOfficeHours(now);

  for (const room of snapshot.rooms) {
    // Rule 1: devices left on after office hours (9AM-5PM)
    if (afterHours) {
      for (const device of room.devices) {
        if (device.isOn) {
          await createAlertIfNew({
            type: "AFTER_HOURS",
            message: `${device.name} in ${room.name} is still ON outside office hours.`,
            roomId: room.id,
            deviceId: device.id,
          });
        }
      }
    }

    // Rule 2: a room where ALL devices have been on continuously for >2 hours
    const allOn = room.devices.length > 0 && room.devices.every((d) => d.isOn);
    if (allOn) {
      const oldestChange = room.devices.reduce((oldest, d) => {
        const t = new Date(d.lastChanged).getTime();
        return t < oldest ? t : oldest;
      }, Date.now());

      if (Date.now() - oldestChange >= CONTINUOUS_ON_ALERT_MS) {
        await createAlertIfNew({
          type: "CONTINUOUS_ON",
          message: `${room.name} has had all ${room.devices.length} devices ON for over 2 hours straight.`,
          roomId: room.id,
        });
      }
    }
  }
}
