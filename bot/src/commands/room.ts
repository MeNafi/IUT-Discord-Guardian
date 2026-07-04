import { Message } from "discord.js";
import { backendApi } from "../lib/api";
import { formatRoom } from "../lib/formatters";

// Updated to match the lowercase names in our database seed
const ROOM_ALIASES: Record<string, string> = {
  drawing: "drawing",
  drawingroom: "drawing",
  work1: "work1",
  workroom1: "work1",
  work2: "work2",
  workroom2: "work2",
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