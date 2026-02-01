const express = require("express");
const mongoose = require("mongoose");

const Chat = require("../models/Chat");
const Message = require("../models/Message");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({ members: userId })
      .populate("members", "username email avatarUrl")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username email avatarUrl" },
      })
      .sort({ updatedAt: -1 });

    return res.status(200).json({ chats });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch chats", error: error.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { memberIds = [], isGroup = false, name = "" } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "memberIds must include at least one user" });
    }

    const uniqueMembers = [...new Set([userId, ...memberIds])];

    const chat = await Chat.create({
      isGroup: Boolean(isGroup),
      name: name.trim(),
      members: uniqueMembers,
    });

    const populatedChat = await Chat.findById(chat._id).populate(
      "members",
      "username email avatarUrl"
    );

    return res.status(201).json({ chat: populatedChat });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create chat", error: error.message });
  }
});

router.post("/:chatId/messages", auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { body } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chat id" });
    }

    if (!body || !body.trim()) {
      return res.status(400).json({ message: "Message body is required" });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.members.some((memberId) => memberId.toString() === userId)) {
      return res.status(403).json({ message: "Not a member of this chat" });
    }

    const message = await Message.create({
      chat: chatId,
      sender: userId,
      body: body.trim(),
    });

    chat.lastMessage = message._id;
    await chat.save();

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "username email avatarUrl"
    );

    return res.status(201).json({ message: populatedMessage });
  } catch (error) {
    return res.status(500).json({ message: "Failed to send message", error: error.message });
  }
});

module.exports = router;
