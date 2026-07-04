import { FullSnapshot, RoomSnapshot, UsageResponse } from "./api";

// Turns "WorkRoom1" -> "Work Room 1", "DrawingRoom" -> "Drawing Room"
export function humanizeRoomName(name: string): string {
  return name.replace(/([a-z])([A-Z0-9])/g, "$1 $2").replace(/\s+/g, " ").trim();
}

function summarizeRoom(room: RoomSnapshot): string {
  const fansOn = room.devices.filter((d) => d.type === "fan" && d.isOn).length;
  const lightsOn = room.devices.filter((d) => d.type === "light" && d.isOn).length;

  if (fansOn === 0 && lightsOn === 0) {
    return `${humanizeRoomName(room.name)}: all off`;
  }

  const parts: string[] = [];
  if (fansOn > 0) parts.push(`${fansOn} fan${fansOn > 1 ? "s" : ""} ON`);
  if (lightsOn > 0) parts.push(`${lightsOn} light${lightsOn > 1 ? "s" : ""} ON`);

  return `${humanizeRoomName(room.name)}: ${parts.join(", ")}`;
}

// Matches the spec's example: "Drawing Room: 1 fan ON, 2 lights ON. Work Room 1: all off. ..."
export function formatStatus(snapshot: FullSnapshot): string {
  const lines = snapshot.rooms.map(summarizeRoom);
  return lines.join(". ") + ".";
}

export function formatRoom(room: RoomSnapshot): string {
  const summary = summarizeRoom(room);
  const deviceLines = room.devices
    .map((d) => `  • ${d.name} (${d.type}) — ${d.isOn ? "ON" : "OFF"}`)
    .join("\n");
  return `**${humanizeRoomName(room.name)}**\n${summary}.\n${deviceLines}`;
}

// Matches: "Total power right now: 740W. Today's estimated usage: 4.2 kWh."
export function formatUsage(usage: UsageResponse): string {
  const perRoom = usage.perRoom
    .map((r) => `${humanizeRoomName(r.room)}: ${r.watts.toFixed(0)}W`)
    .join(", ");
  return (
    `Total power right now: ${usage.totalWattsNow.toFixed(0)}W. ` +
    `Today's estimated usage: ${usage.estimatedKwhToday} kWh.\n` +
    `Per room — ${perRoom}.`
  );
}
