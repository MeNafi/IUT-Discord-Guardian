import { RoomSnapshot } from "../types";

interface Props {
  rooms: RoomSnapshot[];
}

// ✅ Updated to lowercase keys to match the database seed
const ROOM_ORDER = ["drawing", "work1", "work2"];
const ROOM_WIDTH = 260;
const ROOM_HEIGHT = 220;
const GAP = 12;

// Helper function to make room names readable (e.g., drawing -> Drawing, work1 -> Work 1)
function humanizeRoomName(name: string): string {
  const spaced = name.replace(/([a-zA-Z])([0-9])/g, "$1 $2");
  return spaced
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .trim();
}

function FanIcon({ isOn, cx, cy }: { isOn: boolean; cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <circle r="22" fill="#2b2f3a" stroke="#555" strokeWidth="2" />
      <g className={isOn ? "fan-spin" : ""} style={{ transformOrigin: "0px 0px" }}>
        {[0, 120, 240].map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-10"
            rx="6"
            ry="12"
            fill={isOn ? "#7dd3fc" : "#555"}
            transform={`rotate(${deg})`}
          />
        ))}
      </g>
      <circle r="3" fill="#ddd" />
    </g>
  );
}

function LightIcon({ isOn, cx, cy }: { isOn: boolean; cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <circle
        r="14"
        fill={isOn ? "#ffe066" : "#3a3a3a"}
        stroke={isOn ? "#ffd23f" : "#555"}
        strokeWidth="2"
        className={isOn ? "light-glow" : ""}
      />
    </g>
  );
}

export default function OfficeLayout({ rooms }: Props) {
  // Case-insensitive lookup to ensure robust data mapping
  const orderedRooms = ROOM_ORDER.map((name) => 
    rooms.find((r) => r.name.toLowerCase() === name.toLowerCase())
  ).filter((r): r is RoomSnapshot => Boolean(r));

  const width = orderedRooms.length * ROOM_WIDTH + (orderedRooms.length - 1) * GAP;

  return (
    <section className="panel">
      <h2>Office Layout (Top View)</h2>
      <svg viewBox={`0 0 ${width} ${ROOM_HEIGHT}`} className="office-svg" role="img">
        {orderedRooms.map((room, i) => {
          const x0 = i * (ROOM_WIDTH + GAP);
          const fans = room.devices.filter((d) => d.type === "fan");
          const lights = room.devices.filter((d) => d.type === "light");

          return (
            <g key={room.id} transform={`translate(${x0}, 0)`}>
              <rect
                width={ROOM_WIDTH}
                height={ROOM_HEIGHT}
                fill="#1b1e27"
                stroke="#3a3f4d"
                strokeWidth="2"
                rx="6"
                />
              <text x="12" y="22" fill="#e5e7eb" fontSize="14" fontWeight="600">
                {humanizeRoomName(room.name)}
              </text>

              {/* fans along the top */}
              {fans.map((fan, idx) => (
                <FanIcon
                  key={fan.id}
                  isOn={fan.isOn}
                  cx={70 + idx * 100}
                  cy={70}
                />
              ))}

              {/* lights along the bottom */}
              {lights.map((light, idx) => (
                <LightIcon
                  key={light.id}
                  isOn={light.isOn}
                  cx={45 + idx * 85}
                  cy={170}
                />
              ))}
            </g>
          );
        })}
      </svg>
    </section>
  );
}