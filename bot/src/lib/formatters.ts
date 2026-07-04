import { FullSnapshot, RoomSnapshot, UsageResponse } from "./api";

// Turns "drawing" -> "Drawing", "work1" -> "Work 1"
export function humanizeRoomName(name: string): string {
  const spaced = name.replace(/([a-zA-Z])([0-9])/g, "$1 $2");
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
    return `💤 \` All Devices Off \``;
  }

  const parts: string[] = [];
  if (fansOn > 0) parts.push(`💨 **${fansOn}** Fan${fansOn > 1 ? "s" : ""}`);
  if (lightsOn > 0) parts.push(`💡 **${lightsOn}** Light${lightsOn > 1 ? "s" : ""}`);

  return `⚡ Active: ${parts.join("  |  ")}`;
}

// Gives a structured, beautifully aligned breakdown of all rooms
export function formatStatus(snapshot: FullSnapshot): string {
  let output = "\n### 🏢 OFFICE IoT SYSTEM — LIVE STATUS\n";
  output += "‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\n";

  const roomBlocks = snapshot.rooms.map((room) => {
    const summary = summarizeRoom(room);
    return `📍 **${humanizeRoomName(room.name)}**\n> ${summary}`;
  });

  return output + roomBlocks.join("\n\n") + "\n";
}

// Formats a single room details cleanly with perfect custom alignment
export function formatRoom(room: RoomSnapshot): string {
  const title = `\n### 📍 ROOM PROFILE: ${humanizeRoomName(room.name).toUpperCase()}`;
  const divider = "‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾";
  
  // Sorting devices so that ON devices float to the top
  const sortedDevices = [...room.devices].sort((a, b) => Number(b.isOn) - Number(a.isOn));

  const deviceLines = sortedDevices
    .map((d) => {
     
      // Discarding heavy red circles for sharp custom markers
      const indicator = d.isOn ? "🔹" : "▫️"; 
      const typeIcon = d.type === "fan" ? "💨" : "💡";
      
      // Inline styling wrapper for a tabular grid feel inside regular chat
      const deviceName = `**${d.name}**`.padEnd(14, " ");
      const statusText = d.isOn ? "` ON `" : "`OFF`";
      const wattsText = `\` ${d.ratedWatts}W \``;

      return `${indicator}  ${typeIcon}  ${deviceName} ⎯⎯  ${statusText}  ${wattsText}`;
    })
    .join("\n");

  return `${title}\n${divider}\n${deviceLines}\n`;
}

// Formats energy usage with grid-like layout and clean stats
export function formatUsage(usage: UsageResponse): string {
  let output = "\n### ⚡ REAL-TIME ENERGY ANALYTICS\n";
  output += "‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\n";
  output += `• **Total Active Load :**  \` ${usage.totalWattsNow.toFixed(0)} W \`\n`;
  output += `• **Accumulated Today :**  \` ${usage.estimatedKwhToday} kWh \`\n\n`;
  
  output += "📊 **Power Distribution Profile:**\n";
  output += "```yaml\n";
  
  const perRoomLines = usage.perRoom
    .map((r) => {
      const roomName = humanizeRoomName(r.room).padEnd(14, " ");
      return `${roomName} : ${r.watts.toFixed(0)} W`;
    })
    .join("\n");

  output += perRoomLines + "\n```";
  return output;
}