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
    // Join user's personal room for direct messages
    if (socket.user?.id) {
      socket.join(`user_${socket.user.id}`);
    }

    // Join a group chat
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

    // Join direct message room with another user
    socket.on("join_direct", (userId) => {
      if (!userId || !socket.user?.id) return;
      const roomId = [socket.user.id, userId].sort().join("_");
      socket.join(roomId);
    });

    socket.on("leave_direct", (userId) => {
      if (!userId || !socket.user?.id) return;
      const roomId = [socket.user.id, userId].sort().join("_");
      socket.leave(roomId);
    });

    socket.on("typing", (payload) => {
      const { chatId, isTyping, receiverId } = payload || {};
      
      if (receiverId) {
        // Direct message typing
        const roomId = [socket.user?.id, receiverId].sort().join("_");
        socket.to(roomId).emit("typing", {
          isTyping: Boolean(isTyping),
          userId: socket.user?.id,
        });
      } else if (chatId) {
        // Group chat typing
        socket.to(chatId).emit("typing", {
          chatId,
          isTyping: Boolean(isTyping),
          userId: socket.user?.id,
        });
      }
    });

    socket.on("send_message", (payload) => {
      const { chatId, message } = payload || {};
      if (!chatId || !message) return;
      io.to(chatId).emit("new_message", { chatId, message });
    });

    // Send direct message
    socket.on("send_direct_message", (payload) => {
      const { receiverId, message } = payload || {};
      if (!receiverId || !message || !socket.user?.id) return;
      
      const roomId = [socket.user.id, receiverId].sort().join("_");
      io.to(roomId).emit("new_direct_message", {
        sender: socket.user.id,
        receiver: receiverId,
        message,
        timestamp: new Date()
      });
    });

    socket.on("disconnect", () => {
      // noop for now
    });
  });
};

module.exports = initializeSocket;
