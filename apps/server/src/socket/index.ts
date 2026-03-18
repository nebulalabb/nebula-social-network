import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { logger } from "../utils/logger";

export const initSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Cấu hình lại cho production
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    logger.info(`🔌 [socket]: Một người dùng đã kết nối (${socket.id})`);

    socket.on("disconnect", () => {
      logger.info(`🔌 [socket]: Người dùng đã ngắt kết nối (${socket.id})`);
    });

    // Thêm các sự kiện khác ở đây (chat, notification, etc.)
  });

  return io;
};
