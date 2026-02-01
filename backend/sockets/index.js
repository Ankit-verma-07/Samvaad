const jwt = require("jsonwebtoken");

const initializeSocket = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next();
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return next(new Error("JWT_SECRET is not set"));
      }

      const decoded = jwt.verify(token, secret);
      socket.user = { id: decoded.id };
      return next();
    } catch (error) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join_chat", (chatId) => {
      if (!chatId) return;
      socket.join(chatId);
      socket.to(chatId).emit("user_joined", { chatId, userId: socket.user?.id });
    });

    socket.on("leave_chat", (chatId) => {
      if (!chatId) return;
      socket.leave(chatId);
      socket.to(chatId).emit("user_left", { chatId, userId: socket.user?.id });
    });

    socket.on("typing", (payload) => {
      const { chatId, isTyping } = payload || {};
      if (!chatId) return;
      socket.to(chatId).emit("typing", {
        chatId,
        isTyping: Boolean(isTyping),
        userId: socket.user?.id,
      });
    });

    socket.on("send_message", (payload) => {
      const { chatId, message } = payload || {};
      if (!chatId || !message) return;
      io.to(chatId).emit("new_message", { chatId, message });
    });

    socket.on("disconnect", () => {
      // noop for now
    });
  });
};

module.exports = initializeSocket;
