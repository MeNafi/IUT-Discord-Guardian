const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5000";

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

export interface UsageResponse {
  totalWattsNow: number;
  estimatedKwhToday: number;
  perRoom: { room: string; watts: number }[];
  timestamp: string;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_API_URL}${path}`);
  if (!res.ok) throw new Error(`Backend request failed: GET ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

export const backendApi = {
  getSnapshot: () => get<FullSnapshot>("/api/rooms"),
  getRoom: (name: string) => get<RoomSnapshot>(`/api/rooms/${encodeURIComponent(name)}`),
  getUsage: () => get<UsageResponse>("/api/usage"),
};
