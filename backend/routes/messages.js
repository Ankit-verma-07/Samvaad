const express = require("express");
const mongoose = require("mongoose");

const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// Get messages for a group chat
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

// Get direct messages between two users
router.get("/direct/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (String(currentUserId) === String(userId)) {
      return res.status(400).json({ message: "Cannot message yourself" });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ],
      isDeleted: false
    })
      .populate("sender", "id username email avatarUrl fullName")
      .populate("receiver", "id username email avatarUrl fullName")
      .sort({ createdAt: 1 });

    return res.status(200).json({ messages });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch messages", error: error.message });
  }
});

// Send a direct message
router.post("/direct/send", auth, async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !message) {
      return res.status(400).json({ message: "Receiver ID and message are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver id" });
    }

    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({ message: "Cannot message yourself" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      body: message
    });

    await newMessage.save();
    await newMessage.populate("sender", "id username email avatarUrl fullName");
    await newMessage.populate("receiver", "id username email avatarUrl fullName");

    return res.status(201).json({ message: newMessage });
  } catch (error) {
    return res.status(500).json({ message: "Failed to send message", error: error.message });
  }
});

module.exports = router;
