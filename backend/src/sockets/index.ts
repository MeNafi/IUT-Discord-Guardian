import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: "*" }, // tighten this to your dashboard's origin in production
  });

  io.on("connection", (socket) => {
    console.log(`[socket] client connected: ${socket.id}`);
    socket.on("disconnect", () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Events the frontend should listen for:
//   "devices:update" -> full snapshot of all rooms/devices/power
//   "alert:new"       -> a freshly created alert
export function emitDevicesUpdate(payload: unknown) {
  io?.emit("devices:update", payload);
}

export function emitNewAlert(payload: unknown) {
  io?.emit("alert:new", payload);
}
