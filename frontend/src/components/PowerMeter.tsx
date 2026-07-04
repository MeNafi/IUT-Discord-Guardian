import { RoomSnapshot, UsageResponse } from "../types";

interface Props {
  rooms: RoomSnapshot[];
  usage: UsageResponse | null;
}

export default function PowerMeter({ rooms, usage }: Props) {
  const totalWatts = usage?.totalWattsNow ?? rooms.reduce((s, r) => s + r.totalWatts, 0);
  const maxRoomWatts = Math.max(1, ...rooms.map((r) => r.totalWatts));

  return (
    <section className="panel">
      <h2>Live Power Consumption</h2>
      <div className="power-total">
        <span className="power-total-value">{totalWatts.toFixed(0)} W</span>
        <span className="power-total-label">office-wide, right now</span>
        {usage && (
          <span className="power-kwh">≈ {usage.estimatedKwhToday} kWh estimated today</span>
        )}
      </div>
      <div className="power-bars">
        {rooms.map((room) => (
          <div key={room.id} className="power-bar-row">
            <span className="power-bar-label">{room.name}</span>
            <div className="power-bar-track">
              <div
                className="power-bar-fill"
                style={{ width: `${(room.totalWatts / maxRoomWatts) * 100}%` }}
              />
            </div>
            <span className="power-bar-value">{room.totalWatts.toFixed(0)} W</span>
          </div>
        ))}
      </div>
    </section>
  );
}
