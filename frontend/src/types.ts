export type DeviceType = "fan" | "light";

export interface DeviceSnapshot {
  id: string;
  name: string;
  type: DeviceType;
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

export interface UsageResponse {
  totalWattsNow: number;
  estimatedKwhToday: number;
  perRoom: { room: string; watts: number }[];
  timestamp: string;
}

export interface Alert {
  id: string;
  type: "AFTER_HOURS" | "CONTINUOUS_ON";
  message: string;
  timestamp: string;
  resolved: boolean;
  room?: { id: string; name: string } | null;
  device?: { id: string; name: string } | null;
}
