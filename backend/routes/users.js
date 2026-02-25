const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/search", auth, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(200).json({ users: [] });
    }

    const searchRegex = new RegExp(query.trim(), "i");

    const users = await User.find({
      $or: [
        { username: searchRegex },
        { fullName: searchRegex },
      ],
      _id: { $ne: req.user.id } // Exclude current user
    })
    .select("fullName username email avatarUrl")
    .limit(20);

    return res.status(200).json({
      users: users.map(user => ({
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      }))
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to search users", error: error.message });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("fullName username email avatarUrl bio");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
});

router.put("/me", auth, async (req, res) => {
  try {
    const {
      name,
      fullName,
      username,
      email,
      bio,
      avatarUrl,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername && String(existingUsername._id) !== String(user._id)) {
        return res.status(409).json({ message: "Username already in use" });
      }
      user.username = username.trim();
    }

    if (email && email.toLowerCase() !== user.email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail && String(existingEmail._id) !== String(user._id)) {
        return res.status(409).json({ message: "Email already in use" });
      }
      user.email = email.toLowerCase().trim();
    }

    if (typeof bio === "string") {
      user.bio = bio.trim();
    }

    if (typeof avatarUrl === "string") {
      user.avatarUrl = avatarUrl;
    }

    const resolvedName = typeof fullName === "string" ? fullName : name;
    if (typeof resolvedName === "string") {
      user.fullName = resolvedName.trim();
    }

    await user.save();

    return res.status(200).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
});

// Send connection request
router.post("/requests/send", auth, async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.id;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({ message: "Cannot send request to yourself" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if request already exists
    const requestExists = receiver.connectionRequests.some(
      req => String(req.fromUserId) === String(senderId)
    );

    if (requestExists) {
      return res.status(400).json({ message: "Request already sent" });
    }

    // Check if already connected
    const alreadyConnected = receiver.connections.some(
      conn => String(conn) === String(senderId)
    );

    if (alreadyConnected) {
      return res.status(400).json({ message: "Already connected" });
    }

    // Add request
    receiver.connectionRequests.push({ fromUserId: senderId });
    await receiver.save();

    return res.status(200).json({ message: "Request sent successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to send request", error: error.message });
  }
});

// Get received connection requests
router.get("/requests/received", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "connectionRequests.fromUserId",
      "fullName username email avatarUrl"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const requests = user.connectionRequests.map(req => ({
      id: req.fromUserId._id,
      fullName: req.fromUserId.fullName,
      username: req.fromUserId.username,
      email: req.fromUserId.email,
      avatarUrl: req.fromUserId.avatarUrl,
      requestedAt: req.createdAt
    }));

    return res.status(200).json({ requests });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch requests", error: error.message });
  }
});

// Accept connection request
router.post("/requests/accept", auth, async (req, res) => {
  try {
    const { senderId } = req.body;
    const userId = req.user.id;

    if (!senderId) {
      return res.status(400).json({ message: "Sender ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove request and add connection
    user.connectionRequests = user.connectionRequests.filter(
      req => String(req.fromUserId) !== String(senderId)
    );

    if (!user.connections.includes(senderId)) {
      user.connections.push(senderId);
    }

    await user.save();

    // Add user to sender's connections as well
    const sender = await User.findById(senderId);
    if (sender && !sender.connections.includes(userId)) {
      sender.connections.push(userId);
      await sender.save();
    }

    return res.status(200).json({ message: "Request accepted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to accept request", error: error.message });
  }
});

// Reject connection request
router.post("/requests/reject", auth, async (req, res) => {
  try {
    const { senderId } = req.body;
    const userId = req.user.id;

    if (!senderId) {
      return res.status(400).json({ message: "Sender ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.connectionRequests = user.connectionRequests.filter(
      req => String(req.fromUserId) !== String(senderId)
    );

    await user.save();

    return res.status(200).json({ message: "Request rejected" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to reject request", error: error.message });
  }
});

module.exports = router;
