import { Message } from "discord.js";
import { backendApi } from "../lib/api";
import { formatStatus } from "../lib/formatters";

export async function handleStatus(message: Message) {
  try {
    const snapshot = await backendApi.getSnapshot();
    await message.reply(formatStatus(snapshot));
  } catch (err) {
    console.error(err);
    await message.reply("Couldn't reach the backend right now - try again in a moment.");
  }
}
