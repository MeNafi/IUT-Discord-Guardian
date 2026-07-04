import { Message } from "discord.js";
import { backendApi } from "../lib/api";
import { formatRoom } from "../lib/formatters";

// Accepts loose room names: "work1", "workroom1", "drawing", "drawingroom"
const ROOM_ALIASES: Record<string, string> = {
  drawing: "DrawingRoom",
  drawingroom: "DrawingRoom",
  work1: "WorkRoom1",
  workroom1: "WorkRoom1",
  work2: "WorkRoom2",
  workroom2: "WorkRoom2",
};

function resolveRoomName(input: string): string | null {
  const key = input.toLowerCase().replace(/\s+/g, "");
  return ROOM_ALIASES[key] ?? null;
}

export async function handleRoom(message: Message, args: string[]) {
  if (args.length === 0) {
    await message.reply(
      "Usage: `!room <name>` — try `!room drawing`, `!room work1`, or `!room work2`."
    );
    return;
  }

  const roomName = resolveRoomName(args.join(""));
  if (!roomName) {
    await message.reply(
      `I don't recognize that room. Try: \`drawing\`, \`work1\`, or \`work2\`.`
    );
    return;
  }

  try {
    const room = await backendApi.getRoom(roomName);
    await message.reply(formatRoom(room));
  } catch (err) {
    console.error(err);
    await message.reply("Couldn't reach the backend right now - try again in a moment.");
  }
}
