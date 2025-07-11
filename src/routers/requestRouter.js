const express = require("express");
const profileRouter = require("./profilRouter");
const requestRouter=express.Router();
const {adminAuth} = require("/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/middleware/auth.js")
profileRouter.get("/request",adminAuth,async(req,res)=>
    {
      try {
        
         res.send("profile view allowed");
       } catch (error) {
         res.status(404).send("Error  !!!"+error.message);
       }
    })

module.exports=profileRouter;