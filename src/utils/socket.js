// src/utils/socket.js
const socketio = require("socket.io");
const crypto = require("crypto");
const { Chat } = require("../model/chat"); // <-- use "../models/chat" if your folder is plural

// ----- CORS that works locally and in prod -----
const DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];
const PROD_ORIGIN = process.env.FRONTEND_URL || ""; // e.g. "https://app.yourdomain.com"
const ALLOWED_ORIGINS = [...DEV_ORIGINS, PROD_ORIGIN].filter(Boolean);

// simple debug toggle
const DBG = process.env.SOCKET_DEBUG === "true";

// In-memory presence: userId -> { sockets:Set<string>, lastSeen:Date|null }
const presence = new Map();

const getSecretRoomId = (userId, targetUserId) =>
  crypto
    .createHash("sha256")
    .update([String(userId), String(targetUserId)].sort().join("$"))
    .digest("hex");

function markOnline(userId, socketId) {
  if (!presence.has(userId)) presence.set(userId, { sockets: new Set(), lastSeen: null });
  presence.get(userId).sockets.add(socketId);
}

function markOfflineIfNoSockets(userId, socketId) {
  const rec = presence.get(userId);
  if (!rec) return;
  rec.sockets.delete(socketId);
  if (rec.sockets.size === 0) rec.lastSeen = new Date();
}

const isOnline = (userId) => !!(presence.get(userId)?.sockets.size);
const getLastSeen = (userId) => presence.get(userId)?.lastSeen || null;

function initializeSocket(server) {
  const io = socketio(server, {
    // Keep default path "/socket.io" (client should also use this)
    path: "/socket.io",
    cors: {
      origin(origin, cb) {
        // Allow same-origin requests (no Origin header) and our allowlist
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
          return cb(null, true);
        }
        if (DBG) console.warn("[socket] blocked origin:", origin);
        return cb(null, false);
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    if (DBG) console.log(`[socket] connected ${socket.id} from ${socket.handshake.headers.origin || "same-origin"}`);

    // identify for presence
    socket.on("identify", ({ userId }) => {
      if (!userId) return;
      socket.data.userId = String(userId);
      socket.join(`user:${userId}`);
      markOnline(socket.data.userId, socket.id);
      if (DBG) console.log(`[socket] identify user=${userId} sid=${socket.id}`);
    });

    // join 1:1 room
    socket.on("joinChat", ({ name, userId, targetUserId }) => {
      if (!userId || !targetUserId) return;
      const roomId = getSecretRoomId(userId, targetUserId);
      socket.join(roomId);

      if (!socket.data.userId) {
        socket.data.userId = String(userId);
        socket.join(`user:${userId}`);
        markOnline(userId, socket.id);
      }

      if (DBG) console.log(`[socket] joinChat room=${roomId} user=${userId} target=${targetUserId} name="${name}"`);

      // presence for both sides
      io.to(roomId).emit("presenceUpdate", {
        userId: targetUserId,
        online: isOnline(targetUserId),
        lastSeen: getLastSeen(targetUserId),
      });
      io.to(roomId).emit("presenceUpdate", {
        userId,
        online: isOnline(userId),
        lastSeen: getLastSeen(userId),
      });
    });

    // typing
    socket.on("typing", ({ userId, targetUserId }) => {
      if (!userId || !targetUserId) return;
      const roomId = getSecretRoomId(userId, targetUserId);
      socket.to(roomId).emit("typing", { userId });
    });

    socket.on("stopTyping", ({ userId, targetUserId }) => {
      if (!userId || !targetUserId) return;
      const roomId = getSecretRoomId(userId, targetUserId);
      socket.to(roomId).emit("stopTyping", { userId });
    });

    // send message (atomic write + ack)
    socket.on("sendMessage", async ({ name, userId, targetUserId, text }, ack) => {
      if (!userId || !targetUserId || !text?.trim()) {
        if (typeof ack === "function") ack({ ok: false, error: "Missing fields" });
        return;
      }
      try {
        const roomId = getSecretRoomId(userId, targetUserId);

        const chat = await Chat.findOneAndUpdate(
          { participants: { $all: [userId, targetUserId] } },
          {
            $setOnInsert: { participants: [userId, targetUserId] },
            $push: { messages: { senderId: userId, text: text.trim() } },
          },
          { new: true, upsert: true }
        );

        const lastMsg = chat.messages[chat.messages.length - 1];

        if (DBG) {
          console.log(
            `[socket] msg room=${roomId} from=${userId} to=${targetUserId} len=${text.length}`
          );
        }

        io.to(roomId).emit("messageReceived", {
          senderId: userId,
          name,
          text: lastMsg.text,
          createdAt: lastMsg.createdAt,
        });

        if (typeof ack === "function") ack({ ok: true, id: lastMsg._id });
      } catch (err) {
        console.error("sendMessage error:", err);
        if (typeof ack === "function") ack({ ok: false, error: "DB write failed" });
      }
    });

    socket.on("disconnect", () => {
      const uid = socket.data.userId;
      if (uid) markOfflineIfNoSockets(uid, socket.id);
      if (DBG) console.log(`[socket] disconnected ${socket.id} user=${uid || "-"}`);
    });
  });

  // presence helper available to routes
  io.getPresence = (userId) => ({
    online: isOnline(String(userId)),
    lastSeen: getLastSeen(String(userId)),
  });

  return io;
}

module.exports = initializeSocket;
