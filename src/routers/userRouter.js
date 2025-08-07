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

    // Pagination
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    // Filters (search by name or skill)
    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "name"; // can be name, age
    const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;

    // Step 1: Get all connected users to exclude from feed
    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUser._id },
        { toUserId: loggedInUser._id },
      ]
    }).select("fromUserId toUserId");

    const hideUsersFromFeed = new Set();
    connectionRequests.forEach((req) => {
      if (req.fromUserId.toString() === loggedInUser._id.toString()) {
        hideUsersFromFeed.add(req.toUserId.toString());
      } else {
        hideUsersFromFeed.add(req.fromUserId.toString());
      }
    });

    // Step 2: Build the query
    const query = {
      _id: { 
        $nin: Array.from(hideUsersFromFeed),
        $ne: loggedInUser._id 
      },
      $or: [
        { name: { $regex: search, $options: "i" } },
        { skills: { $elemMatch: { $regex: search, $options: "i" } } }
      ]
    };

    // Step 3: Execute paginated, sorted query
    const users = await User.find(query)
      .select(USER_SAFE_DATA)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    // Step 4: Total count for frontend
    const totalCount = await User.countDocuments(query);

    res.status(200).json({
      currentPage: page,
      totalUsers: totalCount,
      pageSize: users.length,
      users,
    });

  } catch (err) {
    res.status(500).json({ message: "Feed fetch failed", error: err.message });
  }
});



module.exports = userRouter;
