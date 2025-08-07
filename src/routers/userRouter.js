const express = require("express");
const userRouter = express.Router();
const User = require('../model/user.js');

const { adminAuth } = require('../middleware/auth.js');
const ConnectionRequest = require('../model/connectionRequest.js');

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
//feed api
userRouter.get("/feed", adminAuth, async (req, res) => {
  try {
    const loggedInUser = req.loginuser;

    // Pagination logic
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    // Get all accepted connection requests of the user
    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUser._id },
        { toUserId: loggedInUser._id }
      ]
    }).select("fromUserId toUserId");

    // Build a set of user IDs to hide from the feed (connected users)
    const hideUsersFromFeed = new Set();
    connectionRequests.forEach((req) => {
      if (req.fromUserId.toString() === loggedInUser._id.toString()) {
        hideUsersFromFeed.add(req.toUserId.toString());
      } else {
        hideUsersFromFeed.add(req.fromUserId.toString());
      }
    });

    // Find users not in the connection list and not the current user
    const users = await User.find({
      $and: [
        { _id: { $nin: Array.from(hideUsersFromFeed) } },
        { _id: { $ne: loggedInUser._id } }
      ]
    })
      .select(USER_SAFE_DATA)
      .skip(skip)
      .limit(limit);

    res.send(users);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


module.exports = userRouter;
