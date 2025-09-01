// src/routers/payments.js
const express = require("express");
const stripeLib = require("stripe");
const mongoose = require("mongoose");

// Models
const PlanConfig = require("../model/PlanConfig");
const UserSubscription = require("../model/UserSubscription");
const User = require("../model/user"); // <- your existing user model

// Auth (you only showed adminAuth, we’ll use it for auth-protected endpoints)
const { adminAuth } = require("../middleware/auth");

const router = express.Router();

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[payments] Missing STRIPE_SECRET_KEY in .env");
}
if (!process.env.FRONTEND_URL) {
  console.warn("[payments] Missing FRONTEND_URL in .env");
}

const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);

/* -----------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------------*/
async function upsertFromCheckoutSession(session) {
  // Metadata we attached at checkout creation
  const userId = session?.metadata?.userId;
  const plan = session?.metadata?.plan;
  const billing = session?.metadata?.billing;

  if (!userId || !plan || !billing) return;

  const update = {
    userId,
    plan,
    billing,
    status: "active",
    stripeCustomerId: session.customer || undefined,
    stripeSubscriptionId: session.subscription || undefined,
  };

  // For subs, you can fetch the sub to get period end precisely
  if (session.subscription) {
    const sub = await stripe.subscriptions.retrieve(session.subscription);
    update.currentPeriodEnd = new Date(sub.current_period_end * 1000);
  }

  await UserSubscription.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    update,
    { upsert: true, new: true }
  );

  // also mark user as premium (adds fields if not in schema yet)
  await User.updateOne(
    { _id: userId },
    { $set: { isPremium: true, premium: { plan, billing, status: "active" } } }
  );
}

async function syncFromInvoice(invoice, succeeded) {
  const subId = invoice.subscription;
  if (!subId) return;

  const sub = await stripe.subscriptions.retrieve(subId);
  const status = succeeded ? "active" : "past_due";

  await UserSubscription.findOneAndUpdate(
    { stripeSubscriptionId: subId },
    {
      status,
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
    }
  );

  // link back to user via subscription.customer
  // retrieve the session or map customer->userId yourself if you stored it
  const customerId = sub.customer;

  const existing = await UserSubscription.findOne({ stripeSubscriptionId: subId }).lean();
  if (existing?.userId) {
    await User.updateOne(
      { _id: existing.userId },
      { $set: { isPremium: succeeded, "premium.status": status } }
    );
  }
}

/* -----------------------------------------------------------------------------
 * 1) Create Checkout Session  (auth-protected)
 *    POST /stripe/checkout  { plan, billing, mode? }
 * ---------------------------------------------------------------------------*/
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

/* -----------------------------------------------------------------------------
 * 2) Stripe Webhook  (MUST be mounted with express.raw in app.js)
 *    POST /webhook/stripe
 * ---------------------------------------------------------------------------*/
router.post("/webhook/stripe", async (req, res) => {
  // NOTE: req.body is a Buffer here — app.js must use express.raw for this route.
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await upsertFromCheckoutSession(session);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        await syncFromInvoice(invoice, true);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        await syncFromInvoice(invoice, false);
        break;
      }
      default:
        // ignore other events
        break;
    }

    // Always ack 2xx fast so Stripe stops retrying
    return res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    // non-2xx -> Stripe will retry
    return res.status(500).send("Webhook handler failure");
  }
});

module.exports = router;
