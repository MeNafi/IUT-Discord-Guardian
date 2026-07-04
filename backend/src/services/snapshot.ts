import { prisma } from "../lib/prisma";

export interface DeviceSnapshot {
  id: string;
  name: string;
  type: "fan" | "light";
  isOn: boolean;
  ratedWatts: number;
  lastChanged: string;
}

export interface RoomSnapshot {
  id: string;
  name: string;
  devices: DeviceSnapshot[];
  totalWatts: number;
  devicesOn: number;
}

export interface FullSnapshot {
  rooms: RoomSnapshot[];
  totalWatts: number;
  timestamp: string;
}

// This is the ONE function both the REST routes and the Discord bot's
// backend calls use to read current state - single source of truth.
export async function getFullSnapshot(): Promise<FullSnapshot> {
  const rooms = await prisma.room.findMany({
    include: { devices: true },
    orderBy: { name: "asc" },
  });

  const roomSnapshots: RoomSnapshot[] = rooms.map((room) => {
    const devices: DeviceSnapshot[] = room.devices.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type as "fan" | "light",
      isOn: d.isOn,
      ratedWatts: d.ratedWatts,
      lastChanged: d.lastChanged.toISOString(),
    }));

    const totalWatts = devices
      .filter((d) => d.isOn)
      .reduce((sum, d) => sum + d.ratedWatts, 0);

    return {
      id: room.id,
      name: room.name,
      devices,
      totalWatts,
      devicesOn: devices.filter((d) => d.isOn).length,
    };
  });

  const totalWatts = roomSnapshots.reduce((sum, r) => sum + r.totalWatts, 0);

  return {
    rooms: roomSnapshots,
    totalWatts,
    timestamp: new Date().toISOString(),
  };
}
