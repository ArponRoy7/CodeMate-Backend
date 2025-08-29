// app.js
require("dotenv").config();

const express = require("express");
const app = express();

const { connectDB } = require("./config/database.js");
const cookieparser = require("cookie-parser");
const cors = require("cors");
const limiter = require("./middleware/rateLimiter.js");

// Existing routers
const profileRouters = require("./routers/profilRouter.js");
const authRouters = require("./routers/authRouter.js");
const requestRouter = require("./routers/requestRouter.js");
const userRouter = require("./routers/userRouter.js");

// NEW: premium & payments & admin routers
const premiumRouter = require("./routers/premium.js"); // GET /plans
const paymentRouter = require("./routers/payments.js"); // POST /stripe/checkout
const adminRouter   = require("./routers/admin.js");   // POST /admin/premium/plan

// ---- CORS: permissive for local dev ----
app.use(
  cors({
    origin: true, // mirror the request origin (or set to process.env.FRONTEND_URL)
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

// NOTE: When you add Stripe webhooks later, you'll need a raw body parser
// BEFORE express.json() for just that route, like:
// app.post("/stripe/webhook", express.raw({ type: "application/json" }), webhookHandler);

// ---- Core middleware ----
app.use(express.json());
app.use(cookieparser());

// Put limiter AFTER cors/json; it already skips OPTIONS
app.use(limiter);

// ---- Routes ----
// Existing app routes
app.use("/", authRouters);
app.use("/", profileRouters);
app.use("/", requestRouter);
app.use("/", userRouter);

// NEW: Premium catalog (public) and payments (user), and admin plan management
app.use("/", premiumRouter);     // e.g., GET /plans
app.use("/", paymentRouter);     // e.g., POST /stripe/checkout
app.use("/admin", adminRouter);  // e.g., POST /admin/premium/plan (adminAuth inside)

// Optional: health check
app.get("/healthz", (_req, res) => res.send("ok"));

// ---- DB & start ----
connectDB()
  .then(() => {
    console.log("MongoDB Connected...");
    const port = process.env.PORT || 8080;
    app.listen(port, () => {
      console.log("Server Running on port " + port);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

module.exports = app;
