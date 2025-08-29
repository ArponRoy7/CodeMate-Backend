// src/routers/payments.js
const express = require("express");
const stripeLib = require("stripe");

// 🔧 Make sure this path matches where your model actually is:
const PlanConfig = require("../model/PlanConfig");

// ✅ Import the middleware that actually exists:
const { adminAuth } = require("../middleware/auth"); // <-- you only export adminAuth

const router = express.Router();

// Guard: ensure env key exists
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[payments] Missing STRIPE_SECRET_KEY in .env");
}
const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);

// Optional sanity check (helpful while debugging):
// console.log("adminAuth type:", typeof adminAuth); // should be "function"

// POST /stripe/checkout  (admin-protected, per your requirement)
router.post("/stripe/checkout", adminAuth, async (req, res) => {
  try {
    const { plan, billing, mode } = req.body;
    if (!plan || !billing) {
      return res.status(400).json({ message: "plan and billing are required" });
    }

    if (!process.env.FRONTEND_URL) {
      return res.status(500).json({ message: "FRONTEND_URL not configured" });
    }

    const planDoc = await PlanConfig.findOne({ plan, billing, active: true }).lean();
    if (!planDoc || !planDoc.stripePriceId) {
      return res.status(400).json({ message: "Plan not configured. Ask admin to set it up." });
    }

    const normalizedMode = mode === "payment" ? "payment" : "subscription";

    const actor = req.loginuser || req.user || {};
    const actorEmail = actor.email || undefined;
    const actorId =
      (actor._id && actor._id.toString && actor._id.toString()) || actor._id || "";

    const session = await stripe.checkout.sessions.create({
      mode: normalizedMode,
      line_items: [{ price: planDoc.stripePriceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/premium?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/premium?status=cancel`,
      allow_promotion_codes: true,
      customer_email: actorEmail,
      client_reference_id: actorId || undefined,
      metadata: { userId: actorId, plan, billing, mode: normalizedMode },
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error("[/stripe/checkout] error:", err);
    return res.status(500).json({ message: "Failed to create checkout", error: err.message });
  }
});

module.exports = router;
