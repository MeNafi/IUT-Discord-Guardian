import { useEffect, useState } from "react";
import { api } from "./api";
import { socket } from "./socket";
import { Alert, FullSnapshot, UsageResponse } from "./types";
import DeviceStatusPanel from "./components/DeviceStatusPanel";
import PowerMeter from "./components/PowerMeter";
import AlertsPanel from "./components/AlertsPanel";
import OfficeLayout from "./components/OfficeLayout";

export default function App() {
  const [snapshot, setSnapshot] = useState<FullSnapshot | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connected, setConnected] = useState(false);

  // Initial fetch (REST) so the dashboard has data immediately, before
  // any socket event arrives.
  useEffect(() => {
    api.getSnapshot().then(setSnapshot).catch(console.error);
    api.getUsage().then(setUsage).catch(console.error);
    api.getAlerts().then(setAlerts).catch(console.error);
  }, []);

  // Live updates over Socket.io - no page refresh needed.
  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onDevicesUpdate = (data: FullSnapshot) => {
      setSnapshot(data);
      api.getUsage().then(setUsage).catch(console.error);
    };
    const onNewAlert = (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev]);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("devices:update", onDevicesUpdate);
    socket.on("alert:new", onNewAlert);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("devices:update", onDevicesUpdate);
      socket.off("alert:new", onNewAlert);
    };
  }, []);

  const handleAlertResolved = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  if (!snapshot) {
    return (
      <div className="app">
        <p>Loading office data...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Office IoT Dashboard</h1>
        <span className={`connection-status ${connected ? "connected" : "disconnected"}`}>
          {connected ? "● Live" : "○ Reconnecting..."}
        </span>
      </header>

      <OfficeLayout rooms={snapshot.rooms} />
      <PowerMeter rooms={snapshot.rooms} usage={usage} />
      <AlertsPanel alerts={alerts} onResolved={handleAlertResolved} />
      <DeviceStatusPanel rooms={snapshot.rooms} />
    </div>
  );
}
