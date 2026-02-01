const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const OtpRequest = require("../models/OtpRequest");
const { sendOtpEmail } = require("../utils/mailer");

const router = express.Router();

const signToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set in environment variables");
  }

  return jwt.sign({ id: userId }, secret, { expiresIn: "7d" });
};

const getOtpConfig = () => {
  const expiresInMinutes = Number(process.env.OTP_EXPIRES_MIN || 10);
  const maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS || 5);

  return {
    expiresInMinutes: Number.isNaN(expiresInMinutes) ? 10 : expiresInMinutes,
    maxAttempts: Number.isNaN(maxAttempts) ? 5 : maxAttempts,
  };
};

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

router.post("/register/request-otp", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const { expiresInMinutes } = getOtpConfig();

    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await OtpRequest.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      {
        email: email.toLowerCase().trim(),
        username: username.trim(),
        passwordHash,
        otpHash,
        attempts: 0,
        expiresAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendOtpEmail({
      to: email.toLowerCase().trim(),
      otp,
      expiresInMinutes,
    });

    return res.status(200).json({ message: "OTP sent" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to request OTP", error: error.message });
  }
});

router.post("/register/verify", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const otpRequest = await OtpRequest.findOne({ email: email.toLowerCase().trim() });

    if (!otpRequest) {
      return res.status(404).json({ message: "OTP request not found" });
    }

    if (otpRequest.expiresAt < new Date()) {
      await OtpRequest.deleteOne({ _id: otpRequest._id });
      return res.status(410).json({ message: "OTP expired" });
    }

    const { maxAttempts } = getOtpConfig();
    if (otpRequest.attempts >= maxAttempts) {
      await OtpRequest.deleteOne({ _id: otpRequest._id });
      return res.status(429).json({ message: "Too many attempts" });
    }

    const otpMatches = await bcrypt.compare(String(otp), otpRequest.otpHash);

    if (!otpMatches) {
      otpRequest.attempts += 1;
      await otpRequest.save();
      return res.status(401).json({ message: "Invalid OTP" });
    }

    const existingUser = await User.findOne({ email: otpRequest.email });

    if (existingUser) {
      await OtpRequest.deleteOne({ _id: otpRequest._id });
      return res.status(409).json({ message: "User already exists" });
    }

    const user = await User.create({
      username: otpRequest.username.trim(),
      email: otpRequest.email.toLowerCase().trim(),
      passwordHash: otpRequest.passwordHash,
    });

    await OtpRequest.deleteOne({ _id: otpRequest._id });

    const token = signToken(user._id);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "OTP verification failed", error: error.message });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const { expiresInMinutes } = getOtpConfig();

    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await OtpRequest.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      {
        email: email.toLowerCase().trim(),
        username: username.trim(),
        passwordHash,
        otpHash,
        attempts: 0,
        expiresAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`OTP for ${email}: ${otp}`);

    await sendOtpEmail({
      to: email.toLowerCase().trim(),
      otp,
      expiresInMinutes,
    }).catch((err) => console.log("Email not sent (SMTP not configured):", err.message));

    return res.status(200).json({ message: "OTP sent" });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user._id);

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
});

module.exports = router;
