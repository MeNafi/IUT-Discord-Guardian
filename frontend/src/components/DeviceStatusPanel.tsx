import { RoomSnapshot } from "../types";
import { api } from "../api";

interface Props {
  rooms: RoomSnapshot[];
}

export default function DeviceStatusPanel({ rooms }: Props) {
  const handleToggle = async (deviceId: string) => {
    try {
      await api.toggleDevice(deviceId);
      // No local state mutation needed - the backend broadcasts
      // "devices:update" over Socket.io and App.tsx updates state from that.
    } catch (err) {
      console.error("Toggle failed", err);
    }
  };

  return (
    <section className="panel">
      <h2>Live Device Status</h2>
      <div className="room-grid">
        {rooms.map((room) => (
          <div key={room.id} className="room-card">
            <h3>{room.name}</h3>
            <ul className="device-list">
              {room.devices.map((d) => (
                <li key={d.id} className={`device-row ${d.isOn ? "on" : "off"}`}>
                  <span className={`dot ${d.isOn ? "dot-on" : "dot-off"}`} />
                  <span className="device-name">{d.name}</span>
                  <span className="device-type">{d.type}</span>
                  <button className="toggle-btn" onClick={() => handleToggle(d.id)}>
                    {d.isOn ? "Turn OFF" : "Turn ON"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
