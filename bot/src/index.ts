import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
import { Client, GatewayIntentBits, Partials, TextChannel } from "discord.js";
import { io } from "socket.io-client";
import { handleStatus } from "./commands/status";
import { handleRoom } from "./commands/room";
import { handleUsage } from "./commands/usage";
import { humanizeRoomName } from "./lib/formatters";

const TOKEN = process.env.DISCORD_TOKEN;
const PREFIX = process.env.COMMAND_PREFIX ?? "!";
const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5000";
const ALERT_CHANNEL_ID = process.env.ALERT_CHANNEL_ID;

if (!TOKEN) {
  console.error("DISCORD_TOKEN is missing - set it in bot/.env");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.once("ready", () => {
  console.log(`[bot] logged in as ${client.user?.tag}`);
  connectAlertSocket();
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const [rawCommand, ...args] = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = rawCommand.toLowerCase();

  switch (command) {
    case "status":
      await handleStatus(message);
      break;
    case "room":
      await handleRoom(message, args);
      break;
    case "usage":
      await handleUsage(message);
      break;
    case "help":
      await message.reply(
        "Commands:\n" +
          "`!status` — quick summary of every room\n" +
          "`!room <drawing|work1|work2>` — details for one room\n" +
          "`!usage` — live power draw + today's estimated kWh"
      );
      break;
    default:
      // Unknown command - stay quiet rather than spamming the channel.
      break;
  }
});

// --- Bonus: proactively post to a channel when the backend raises an alert ---
// The bot connects to the SAME backend Socket.io server the dashboard uses,
// so it reacts to "alert:new" events in real time (no polling needed).
function connectAlertSocket() {
  if (!ALERT_CHANNEL_ID) {
    console.warn("[bot] ALERT_CHANNEL_ID not set - proactive alerts disabled.");
    return;
  }

  const socket = io(BACKEND_API_URL, { transports: ["websocket", "polling"] });

  socket.on("connect", () => console.log("[bot] connected to backend socket for alerts"));

  socket.on("alert:new", async (alert: { type: string; message: string; room?: { name: string } }) => {
    try {
      const channel = await client.channels.fetch(ALERT_CHANNEL_ID);
      if (!channel || !(channel instanceof TextChannel)) return;

      const emoji = alert.type === "AFTER_HOURS" ? "⚠️" : "🔥";
      const roomLabel = alert.room ? humanizeRoomName(alert.room.name) : "Office";
      await channel.send(`${emoji} **${roomLabel}** — ${alert.message}`);
    } catch (err) {
      console.error("[bot] failed to post alert:", err);
    }
  });
}

client.login(TOKEN);
