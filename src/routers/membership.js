// src/routers/membership.js
const express = require("express");
const { adminAuth } = require("../middleware/auth");
const UserSubscription = require("../model/UserSubscription");

const router = express.Router();

/**
 * GET /me/subscription
 * Returns { isPremium, status, plan, billing, currentPeriodEnd }
 */
router.get("/me/subscription", adminAuth, async (req, res) => {
  try {
    const userId = req.loginuser?._id || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const sub = await UserSubscription.findOne({ userId }).lean();
    const isPremium = !!(sub && (sub.status === "active" || sub.status === "past_due"));
    return res.json({
      isPremium,
      subscription: sub || null,
    });
  } catch (err) {
    console.error("[/me/subscription] error:", err);
    return res.status(500).json({ message: "Failed to fetch subscription" });
  }
});

module.exports = router;
