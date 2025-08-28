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
// feed api
userRouter.get("/feed", adminAuth, async (req, res) => {
  try {
    const me = req.loginuser;

    // --- pagination ---
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    let limit = parseInt(req.query.limit) || 10;
    limit = Math.min(Math.max(limit, 1), 50); // 1..50
    const skip = (page - 1) * limit;

    // --- filters ---
    const search = (req.query.search || "").trim();
    const sortBy = ["name", "age", "createdAt"].includes(req.query.sortBy)
      ? req.query.sortBy
      : "name";
    const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;

    // --- Step 1: find all existing connections/requests that involve me ---
    // (includes sent, received, ignored, interested, accepted, rejected)
    const myLinks = await ConnectionRequest.find({
      $or: [{ fromUserId: me._id }, { toUserId: me._id }],
    })
      .select("fromUserId toUserId")
      .lean();

    // Build a set of userIds to hide from feed
    const hideSet = new Set();
    for (const doc of myLinks) {
      const a = String(doc.fromUserId);
      const b = String(doc.toUserId);
      // add the "other" party in each request/connection
      hideSet.add(a === String(me._id) ? b : a);
    }
    // never show self
    hideSet.add(String(me._id));

    // --- Step 2: build query for discoverable users ---
    const query = {
      _id: { $nin: Array.from(hideSet) },
      ...(search
        ? {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { skills: { $elemMatch: { $regex: search, $options: "i" } } },
            ],
          }
        : {}),
    };

    // --- Step 3: fetch users (safe fields only) ---
    // If you have a constant of safe fields, keep using it:
    //   .select(USER_SAFE_DATA)
    // Otherwise, select the typical public fields explicitly:
    const users = await User.find(query)
      .select(USER_SAFE_DATA || "name age gender email photourl about skills")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // --- Step 4: total count for pagination ---
    const totalCount = await User.countDocuments(query);

    res.status(200).json({
      currentPage: page,
      pageSize: users.length,
      totalUsers: totalCount,
      users,
    });
  } catch (err) {
    console.error("Feed fetch failed:", err);
    res.status(500).json({ message: "Feed fetch failed", error: err.message });
  }
});




module.exports = userRouter;
