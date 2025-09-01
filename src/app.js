// src/app.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieparser = require("cookie-parser");
const http = require("http");

const { connectDB } = require("./config/database.js");
const limiter = require("./middleware/rateLimiter.js");

// Routers
const profileRouters   = require("./routers/profilRouter.js");
const authRouters      = require("./routers/authRouter.js");
const requestRouter    = require("./routers/requestRouter.js");
const userRouter       = require("./routers/userRouter.js");
const premiumRouter    = require("./routers/premium.js");
const adminRouter      = require("./routers/admin.js");
const membershipRouter = require("./routers/membership.js");
const chatRouter       = require("./routers/chat.js");

const { router: paymentsRouter, webhookHandler } = require("./routers/payments.js");

// App + HTTP server (so Socket.IO can attach)
const app = express();
const server = http.createServer(app);

// ---- Socket.IO ----
const initializeSocket = require("./utils/socket.js");
// initializeSocket returns the io instance (with presence helpers)
const io = initializeSocket(server);
// expose io to routes (e.g., /presence)
app.set("io", io);

// ---- CORS ----
// If you have a specific frontend, set origin: process.env.FRONTEND_URL
app.use(
  cors({
    origin: true, // or process.env.FRONTEND_URL
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 204,
  })
);

/**
 * 🔴 Stripe webhook MUST be mounted with a RAW body parser BEFORE express.json().
 */
app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  webhookHandler
);

// ---- Core middleware (after webhook raw) ----
app.use(express.json());
app.use(cookieparser());
app.use(limiter);

// ---- Routes ----
app.use("/", authRouters);
app.use("/", profileRouters);
app.use("/", requestRouter);
app.use("/", userRouter);

app.use("/", premiumRouter);
app.use("/", paymentsRouter);
app.use("/", membershipRouter);
app.use("/", chatRouter);
app.use("/admin", adminRouter);

// Health
app.get("/healthz", (_req, res) => res.send("ok"));

// ---- DB & start ----
connectDB()
  .then(() => {
    console.log("MongoDB Connected...");
    const port = process.env.PORT || 3000;
    server.listen(port, "0.0.0.0", () => {
      console.log("Server Running on port " + port);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

module.exports = app;
