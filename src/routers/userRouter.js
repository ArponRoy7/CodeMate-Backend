const express = require("express");
const userRouter = express.Router();

const {adminAuth} = require("/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/middleware/auth.js")
const ConnectionRequest = require("/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/model/connectionRequest.js");

// Get all the pending connection requests for the logged-in user
userRouter.get("/user/requests/received", adminAuth, async (req, res) => {
  try {
    const loggedInUser = req.loginuser;

    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId","name email skills photourl about gender age");

    res.json({
      message: "Data fetched successfully",
      data: connectionRequests,
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});
const USER_SAFE_DATA="name email skills photourl about gender age";
//shwoing connection of users
userRouter.get("/user/connections", adminAuth, async (req, res) => {
  try {
    const loggedInUser = req.loginuser;

    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", USER_SAFE_DATA)
      .populate("toUserId", USER_SAFE_DATA);

    const data = connectionRequests.map((row) => {
      if (row.fromUserId._id.toString() == loggedInUser._id.toString()) {
        return row.toUserId;
      }
      return row.fromUserId;
    });

    res.json(data);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = userRouter;
