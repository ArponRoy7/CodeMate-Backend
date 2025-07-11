const express = require('express');
const app = express();
const { connectDB } = require('./config/database');
const {adminAuth} = require("/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/middleware/auth.js")
const profileRouters = require("/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/routers/profilRouter.js");
const cookieparser = require("cookie-parser");
const jwt = require('jsonwebtoken');
const authRouters=require("/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/routers/authRouter.js"); 
const requestRouter=require("/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/routers/profilRouter.js");
app.use(express.json());
app.use(cookieparser());
app.use("/",authRouters);
app.use("/",profileRouters);
app.use("/",requestRouter);
//deleteing
app.delete("/user",async(req,rep)=>
{
  try {
    const userid=req.body._id;
    const del = await User.findByIdAndDelete(userid);
    rep.send("user deleted");
  } catch (error) {
    console.log(err);
    res.status(404).send("error happed");
  }
})
//finding by filter 
app.get("/user",async(req , res)=>
{
  const useremail = req.body.email;
  try
  {
    const detail = await User.find({email : useremail});
    res.status(201).send(detail);
  }
  catch(err)
  {
    console.log(err);
    res.status(404).send("error happed");
  }
})
//finding by all
app.get("/feed",async(req,res)=>
{
  try {
    const entry = await User.find({});
    res.status(201).send(entry);
  } catch (error) {
    console.log(err);
    res.status(404).send("error happed");
  }
})


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
