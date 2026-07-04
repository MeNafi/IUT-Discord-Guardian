import { io, Socket } from "socket.io-client";
import { API_URL } from "./api";

export const socket: Socket = io(API_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});
