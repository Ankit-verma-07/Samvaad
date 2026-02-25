const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, default: "" },
    username: { type: String, required: true, trim: true, unique: true },
    email: { type: String, required: true, trim: true, unique: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, trim: true, default: "" },
    connectionRequests: [
      {
        fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
