const express = require('express');
const app = express();
const { connectDB } = require('./config/database');
const profileRouters = require('./routers/profilRouter.js');
const cookieparser = require("cookie-parser");
const authRouters = require('./routers/authRouter.js'); 
const requestRouter = require('./routers/requestRouter.js');
const userRouter = require('./routers/userRouter');
const limiter = require('./middleware/rateLimiter');
const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieparser());
app.use(limiter);
app.use("/",authRouters);
app.use("/",profileRouters);
app.use("/",requestRouter);
app.use("/",userRouter);


connectDB()
  .then(() => {
    console.log("MongoDB Connected...");
    app.listen(3000, () => {
      console.log("Server Running on port 3000");
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
