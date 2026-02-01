const express = require("express");
const mongoose = require("mongoose");

const Chat = require("../models/Chat");
const Message = require("../models/Message");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/:chatId", auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chat id" });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.members.some((memberId) => memberId.toString() === userId)) {
      return res.status(403).json({ message: "Not a member of this chat" });
    }

    const messages = await Message.find({ chat: chatId, isDeleted: false })
      .populate("sender", "username email avatarUrl")
      .sort({ createdAt: 1 });

    return res.status(200).json({ messages });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch messages", error: error.message });
  }
});

module.exports = router;
