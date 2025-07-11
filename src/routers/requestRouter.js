const express = require("express");
const profileRouter = require("./profilRouter");
const requestRouter=express.Router();
const {adminAuth} = require("/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/middleware/auth.js")
//profile view
profileRouter.get("/request",adminAuth,async(req,res)=>
    {
      try {
        
         res.send("profile view allowed");
       } catch (error) {
         res.status(404).send("Error  !!!"+error.message);
       }
    })
//deleteing
profileRouter.delete("/user/del",async(req,rep)=>
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
module.exports=profileRouter;