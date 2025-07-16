const express = require("express");
const profileRouter = require("./profilRouter");
const requestRouter=express.Router();
const User = require('/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/model/user.js');
const ConnectionRequest=require("/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/model/connectionRequest.js");
const {adminAuth} = require("/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/middleware/auth.js");
//profile view
requestRouter.get("/request",adminAuth,async(req,res)=>
    {
      try {
        
         res.send("profile view allowed");
       } catch (error) {
         res.status(404).send("Error  !!!"+error.message);
       }
    })
//deleteing
requestRouter.delete("/user/del",async(req,rep)=>
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
  //request
  requestRouter.post("/request/send/:status/:userId", adminAuth, async (req, res) => {
    try {
      const fromUserId = req.loginuser._id;
      const toUserId = req.params.userId;
      const status = req.params.status;
      const allowedStatus = ["ignored", "interested"];
  
      // Validate status
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: "Invalid status type" });
      }
  
      // Check if toUser exists
      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(404).json({ message: "User not found!" });
      }
  
      // Check if fromUser exists (optional but safe)
      const fromUser = await User.findById(fromUserId);
      if (!fromUser) {
        return res.status(404).json({ message: "Sender not found!" });
      }
  
      // Check for existing connection
      const existingConnectionRequest = await ConnectionRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });
  
      if (existingConnectionRequest) {
        return res
          .status(400)
          .json({ message: "Connection Request Already Exists!!" });
      }
  
      // Save new connection
      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });
      const data = await connectionRequest.save();
  
      res.json({
        message: `${fromUser.name} is ${status} to ${toUser.name}`,
        data,
      });
    } catch (error) {
      res.status(500).send("Error: " + error.message);
    }
  });
  //changing status
  requestRouter.post(
    "/request/review/:status/:requestId",
    adminAuth,
    async (req, res) => {
      try {
        const loggedInUser = req.loginuser;
        const { status, requestId } = req.params;
  
        const allowedStatus = ["accepted", "rejected"];
        if (!allowedStatus.includes(status)) {
          return res.status(400).json({ message: "Status not allowed!" });
        }
  
        const connectionRequest = await ConnectionRequest.findOne({
          _id: requestId,
          toUserId: loggedInUser._id,
          status: "interested",
        });
  
        if (!connectionRequest) {
          return res
            .status(404)
            .json({ message: "Connection request not found" });
        }
  
        // Update and save the status
        connectionRequest.status = status;
        await connectionRequest.save();
  
        res.json({
          message: `Connection request ${status} successfully.`,
          data: connectionRequest,
        });
      } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
      }
    }
  );
  
module.exports=requestRouter;