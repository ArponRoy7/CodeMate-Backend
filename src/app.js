// src/app.js
require("dotenv").config();

const express = require("express");
const app = express();

const cors = require("cors");
const cookieparser = require("cookie-parser");

const { connectDB } = require("./config/database.js");
const limiter = require("./middleware/rateLimiter.js");

// Existing routers
const profileRouters = require("./routers/profilRouter.js");
const authRouters    = require("./routers/authRouter.js");
const requestRouter  = require("./routers/requestRouter.js");
const userRouter     = require("./routers/userRouter.js");

// Premium catalog & admin (you already had these)
const premiumRouter  = require("./routers/premium.js");   // GET /plans
const adminRouter    = require("./routers/admin.js");     // POST /admin/premium/plan (adminAuth inside)

// Stripe payments + webhook (UPDATED router that contains /stripe/checkout AND /webhook/stripe)
const paymentsRouter   = require("./routers/payments.js");

// NEW: membership status (GET /me/subscription)
const membershipRouter = require("./routers/membership.js");

// ---- CORS: permissive for local dev ----
app.use(
  cors({
    origin: true, // or set to process.env.FRONTEND_URL
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      // demo headers (safe to keep; ignored if unused)
      "x-demo-role",
      "x-demo-email",
      "x-demo-userid",
    ],
    optionsSuccessStatus: 204,
  })
);

/**
 * 🔴 IMPORTANT: Stripe webhook must use RAW body for signature verification.
 * We mount ONLY the webhook path with express.raw BEFORE the global express.json().
 * The paymentsRouter includes: router.post("/webhook/stripe", handler)
 * Passing the router here works because an Express router is a middleware function.
 */
app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }), // raw buffer for Stripe signature
  paymentsRouter                              // contains router.post("/webhook/stripe", ...)
);

// ---- Core middleware (after webhook raw) ----
app.use(express.json());
app.use(cookieparser());

// Rate limiter AFTER CORS/JSON (it already skips OPTIONS)
app.use(limiter);

// ---- Routes ----
app.use("/", authRouters);
app.use("/", profileRouters);
app.use("/", requestRouter);
app.use("/", userRouter);

// Premium catalog (public), payments (checkout), membership (me/subscription)
app.use("/", premiumRouter);      // e.g., GET /plans
app.use("/", paymentsRouter);     // e.g., POST /stripe/checkout (webhook already handled above)
app.use("/", membershipRouter);   // e.g., GET /me/subscription

// Admin (plan management)
app.use("/admin", adminRouter);   // e.g., POST /admin/premium/plan

// Optional: health check
app.get("/healthz", (_req, res) => res.send("ok"));

// ---- DB & start ----
connectDB()
  .then(() => {
    console.log("MongoDB Connected...");
    const port = process.env.PORT || 8080; // you said backend is 3000 locally; set PORT=3000 in .env if needed
    app.listen(port, "0.0.0.0", () => {
      console.log("Server Running on port " + port);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

module.exports = app;
