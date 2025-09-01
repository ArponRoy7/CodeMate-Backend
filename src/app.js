// src/app.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieparser = require("cookie-parser");

const { connectDB } = require("./config/database.js");
const limiter = require("./middleware/rateLimiter.js");

// Routers
const profileRouters  = require("./routers/profilRouter.js");
const authRouters     = require("./routers/authRouter.js");
const requestRouter   = require("./routers/requestRouter.js");
const userRouter      = require("./routers/userRouter.js");
const premiumRouter   = require("./routers/premium.js");     // GET /plans
const adminRouter     = require("./routers/admin.js");       // /admin/...
const membershipRouter= require("./routers/membership.js");  // GET /me/subscription

// Payments: router (checkout, confirm) + webhook handler fn
const { router: paymentsRouter, webhookHandler } = require("./routers/payments.js");

const app = express();

// ---- CORS ----
app.use(
  cors({
    origin: true, // or set to process.env.FRONTEND_URL
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 204,
  })
);

/**
 * 🔴 Stripe webhook MUST be mounted with a RAW body parser BEFORE express.json().
 * We mount a plain handler function here to avoid any double-path issues.
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

app.use("/", premiumRouter);      // GET /plans
app.use("/", paymentsRouter);     // POST /stripe/checkout, POST /stripe/confirm
app.use("/", membershipRouter);   // GET /me/subscription
app.use("/admin", adminRouter);   // Admin plan management

// Health
app.get("/healthz", (_req, res) => res.send("ok"));

// ---- DB & start ----
connectDB()
  .then(() => {
    console.log("MongoDB Connected...");
    const port = process.env.PORT || 3000; // set PORT in .env as you like
    app.listen(port, "0.0.0.0", () => {
      console.log("Server Running on port " + port);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

module.exports = app;
