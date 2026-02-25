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

module.exports = router;
