import { FullSnapshot, RoomSnapshot, UsageResponse } from "./api";

// Turns "drawing" -> "Drawing", "work1" -> "Work 1"
export function humanizeRoomName(name: string): string {

  // First, handle lowercase strings with numbers like work1 -> work 1
  const spaced = name.replace(/([a-zA-Z])([0-9])/g, "$1 $2");

  // Capitalize the first letter of each word
  return spaced
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .trim();
}

function summarizeRoom(room: RoomSnapshot): string {
  const fansOn = room.devices.filter((d) => d.type === "fan" && d.isOn).length;
  const lightsOn = room.devices.filter((d) => d.type === "light" && d.isOn).length;

  if (fansOn === 0 && lightsOn === 0) {
    return `⚫ All devices are OFF`;
  }

  const parts: string[] = [];
  if (fansOn > 0) parts.push(`💨 ${fansOn} Fan${fansOn > 1 ? "s" : ""} ON`);
  if (lightsOn > 0) parts.push(`💡 ${lightsOn} Light${lightsOn > 1 ? "s" : ""} ON`);

  return parts.join(" | ");
}

// Gives a structured, beautifully aligned breakdown of all rooms
export function formatStatus(snapshot: FullSnapshot): string {
  let output = "\n🏢 **Office IoT System — Live Status**\n";
  output += "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n";

  const roomBlocks = snapshot.rooms.map((room) => {
    const summary = summarizeRoom(room);
    return `📍 **${humanizeRoomName(room.name)}**\n> ${summary}`;
  });

  return output + roomBlocks.join("\n\n");
}

// Formats a single room details cleanly with lists
// Formats a single room details cleanly with perfect alignment
export function formatRoom(room: RoomSnapshot): string {
  const title = `\n📍 **Room Profile: ${humanizeRoomName(room.name).toUpperCase()}**`;
  const divider = "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯";
  
  const deviceLines = room.devices
    .map((d) => {
      const indicator = d.isOn ? "🟢" : "▪️"; 
      const typeIcon = d.type === "fan" ? "💨" : "💡";
      const statusText = d.isOn ? "**ON**" : "OFF";
      
      return `${indicator} ${typeIcon} **${d.name}** — ${statusText} (${d.ratedWatts}W)`;
    })
    .join("\n");

  return `${title}\n${divider}\n${deviceLines}`;
}

// Formats energy usage with clean layout and bold stats
export function formatUsage(usage: UsageResponse): string {
  let output = "\n⚡ **Real-Time Energy Analytics**\n";
  output += "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n";
  output += `• **Total Active Load :** \`${usage.totalWattsNow.toFixed(0)} W\`\n`;
  output += `• **Accumulated Today :** \`${usage.estimatedKwhToday} kWh\`\n\n`;
  
  output += "📊 **Power Distribution Per Room:**\n";
  output += "```yaml\n";
  
  const perRoomLines = usage.perRoom
    .map((r) => {
      const roomName = humanizeRoomName(r.room).padEnd(12, " ");
      return `${roomName}: ${r.watts.toFixed(0)} W`;
    })
    .join("\n");

  output += perRoomLines + "\n```";
  return output;
}