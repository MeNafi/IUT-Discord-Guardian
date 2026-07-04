import { Message } from "discord.js";
import { backendApi } from "../lib/api";
import { formatUsage } from "../lib/formatters";

export async function handleUsage(message: Message) {
  try {
    const usage = await backendApi.getUsage();
    await message.reply(formatUsage(usage));
  } catch (err) {
    console.error(err);
    await message.reply("Couldn't reach the backend right now - try again in a moment.");
  }
}
