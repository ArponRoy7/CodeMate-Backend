const express = require("express");
const router = express.Router();
const PlanConfig = require("../model/PlanConfig");
const stripeLib = require("stripe");
const { adminAuth } = require("../middleware/auth");
const { CURRENCY, BILLING_CYCLES, PLAN_TYPES } = require("../utils/constants");

const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);

// Upsert a plan config; optionally create Stripe product/price
router.post("/premium/plan", adminAuth, async (req, res) => {
  try {
    const { plan, billing, amountInINR, features = [], createInStripe = true } = req.body;

    if (!PLAN_TYPES.includes(plan)) return res.status(400).json({ message: "Invalid plan" });
    if (!BILLING_CYCLES.includes(billing)) return res.status(400).json({ message: "Invalid billing" });
    if (!amountInINR || amountInINR <= 0) return res.status(400).json({ message: "Invalid amount" });

    let stripePriceId = req.body.stripePriceId;

    if (createInStripe) {
      const product = await stripe.products.create({
        name: `CodeMate ${plan[0].toUpperCase() + plan.slice(1)} (${billing})`,
        metadata: { plan, billing },
      });

      const price = await stripe.prices.create({
        currency: CURRENCY.toLowerCase(),
        unit_amount: Math.round(amountInINR * 100), // paise
        recurring: { interval: billing === "monthly" ? "month" : "year" },
        product: product.id,
        metadata: { plan, billing },
      });

      stripePriceId = price.id;
    }

    if (!stripePriceId) {
      return res.status(400).json({ message: "stripePriceId required if createInStripe=false" });
    }

    const doc = await PlanConfig.findOneAndUpdate(
      { plan, billing },
      { plan, billing, amountInINR, currency: CURRENCY, stripePriceId, features, active: true },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ ok: true, plan: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upsert plan", error: err.message });
  }
});

module.exports = router;
