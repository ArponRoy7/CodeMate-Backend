// app.js
const express = require("express");
const app = express();
const { connectDB } = require("./config/database.js");
const profileRouters = require("./routers/profilRouter.js");
const cookieparser = require("cookie-parser");
const authRouters = require("./routers/authRouter.js");
const requestRouter = require("./routers/requestRouter.js");
const userRouter = require("./routers/userRouter.js");
const limiter = require("./middleware/rateLimiter.js");
const cors = require("cors");
require('dotenv').config();
// ---- CORS: permissive for local dev ----
app.use(cors({
  origin: true,                         // mirror the request origin
  credentials: true,                    // allow cookies
  methods: ["GET","POST","PATCH","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Requested-With"],
  optionsSuccessStatus: 204,            // for legacy browsers
}));

// Preflights are auto-handled by cors() above; no app.options("*") needed.

// ---- Core middleware ----
app.use(express.json());
app.use(cookieparser());

// Put limiter AFTER cors/json; it already skips OPTIONS
app.use(limiter);

// ---- Routes ----
app.use("/", authRouters);
app.use("/", profileRouters);
app.use("/", requestRouter);
app.use("/", userRouter);

// Optional: health check
app.get("/healthz", (req, res) => res.send("ok"));

connectDB()
  .then(() => {
    console.log("MongoDB Connected...");
    app.listen(process.env.PORT, () => {
      console.log("Server Running on port "+process.env.PORT);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
