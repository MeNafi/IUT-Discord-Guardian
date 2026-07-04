import { Alert, FullSnapshot, UsageResponse } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function post<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { method: "POST" });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

export const api = {
  getSnapshot: () => get<FullSnapshot>("/api/rooms"),
  getUsage: () => get<UsageResponse>("/api/usage"),
  getAlerts: () => get<Alert[]>("/api/alerts?resolved=false"),
  toggleDevice: (deviceId: string) => post(`/api/rooms/devices/${deviceId}/toggle`),
  resolveAlert: (alertId: string) => post(`/api/alerts/${alertId}/resolve`),
};

export { API_URL };
