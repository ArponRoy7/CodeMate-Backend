// routers/chat.js
const express = require("express");
const { adminAuth } = require("../middleware/auth");   // ← your middleware (req.loginuser)
const { Chat } = require("../model/chat");             // ← your model path (singular)

const chatRouter = express.Router();

/**
 * GET /chat/:targetUserId
 * Loads (or creates) a 1:1 chat between the logged-in user and targetUserId.
 * Populates sender name on messages.
 */
chatRouter.get("/chat/:targetUserId", adminAuth, async (req, res) => {
  const { targetUserId } = req.params;
  const userId = req?.loginuser?._id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    let chat = await Chat.findOne({
      participants: { $all: [userId, targetUserId] },
    }).populate({
      path: "messages.senderId",
      select: "name",
    });

    if (!chat) {
      chat = new Chat({
        participants: [userId, targetUserId],
        messages: [],
      });
      await chat.save();

      // re-fetch with populate for a consistent response shape
      chat = await Chat.findById(chat._id).populate({
        path: "messages.senderId",
        select: "name",
      });
    }

    return res.json(chat);
  } catch (err) {
    console.error("GET /chat error:", err);
    return res.status(500).json({ error: "Failed to load chat" });
  }
});

/**
 * GET /presence/:userId
 * Returns online + lastSeen for a given userId from the in-memory socket presence.
 * (initializeSocket(server) must set app.set("io", io) in app.js)
 */
chatRouter.get("/presence/:userId", adminAuth, async (req, res) => {
  try {
    const io = req.app.get("io");
    if (!io || !io.getPresence) {
      return res.json({ online: false, lastSeen: null });
    }
    const { userId } = req.params;
    const { online, lastSeen } = io.getPresence(String(userId));
    return res.json({ online, lastSeen });
  } catch (e) {
    console.error("GET /presence error:", e);
    return res.json({ online: false, lastSeen: null });
  }
});

module.exports = chatRouter;
