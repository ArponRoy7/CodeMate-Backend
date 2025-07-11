const express = require('express');
const app = express();
const { connectDB } = require('./config/database');
const {adminAuth} = require("/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/middleware/auth.js")
const profileRouters = require("/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/routers/profilRouter.js");
const cookieparser = require("cookie-parser");
const jwt = require('jsonwebtoken');
const authRouters=require("/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/routers/authRouter.js"); 
const requestRouter=require("/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/routers/requestRouter.js");
app.use(express.json());
app.use(cookieparser());
app.use("/",authRouters);
app.use("/",profileRouters);
app.use("/",requestRouter);



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
