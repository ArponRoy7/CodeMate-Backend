const express = require('express');
const app = express();
const { connectDB } = require('./config/database');
const { adminAuth } = require('./middleware/auth.js');
const profileRouters = require('./routers/profilRouter.js');
const cookieparser = require("cookie-parser");
const jwt = require('jsonwebtoken');
const authRouters = require('./routers/authRouter.js'); 
const requestRouter = require('./routers/requestRouter.js');
const userRouter = require('./routers/userRouter');
const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieparser());
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
