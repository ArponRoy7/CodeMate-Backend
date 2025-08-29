const express = require("express");
const router = express.Router();
const PlanConfig = require("../model/PlanConfig");


// Return active plans for UI (no secret IDs)
router.get("/plans", async (_req, res) => {
  try {
    const plans = await PlanConfig.find({ active: true })
      .select("plan billing amountInINR currency features")
      .sort({ plan: 1, billing: 1 })
      .lean();

    res.json({ plans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch plans" });
  }
});

module.exports = router;
