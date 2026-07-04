import { Alert } from "../types";
import { api } from "../api";

interface Props {
  alerts: Alert[];
  onResolved: (alertId: string) => void;
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString();
}

export default function AlertsPanel({ alerts, onResolved }: Props) {
  const handleResolve = async (id: string) => {
    try {
      await api.resolveAlert(id);
      onResolved(id);
    } catch (err) {
      console.error("Resolve failed", err);
    }
  };

  return (
    <section className="panel">
      <h2>Active Alerts</h2>
      {alerts.length === 0 && <p className="no-alerts">No active alerts. Everything looks good.</p>}
      <ul className="alert-list">
        {alerts.map((a) => (
          <li key={a.id} className={`alert-row alert-${a.type.toLowerCase()}`}>
            <div>
              <strong>{a.type === "AFTER_HOURS" ? "After Hours" : "Continuous ON"}</strong>
              <p>{a.message}</p>
              <span className="alert-time">{formatTime(a.timestamp)}</span>
            </div>
            <button onClick={() => handleResolve(a.id)}>Dismiss</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
