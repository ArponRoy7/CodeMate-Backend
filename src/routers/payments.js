// src/routers/payments.js
const express = require("express");
const stripeLib = require("stripe");
const mongoose = require("mongoose");

const PlanConfig = require("../model/PlanConfig");
const UserSubscription = require("../model/UserSubscription");
const User = require("../model/user");

const { adminAuth } = require("../middleware/auth");

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[payments] Missing STRIPE_SECRET_KEY in .env");
}
if (!process.env.FRONTEND_URL) {
  console.warn("[payments] Missing FRONTEND_URL in .env");
}

const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

/* -----------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------------*/
async function upsertFromCheckoutSession(session) {
  const userId = session?.metadata?.userId;
  const plan   = session?.metadata?.plan;
  const billing= session?.metadata?.billing;

  if (!userId || !plan || !billing) return;

  const update = {
    userId,
    plan,
    billing,
    status: "active",
    stripeCustomerId: session.customer || undefined,
    stripeSubscriptionId: session.subscription || undefined,
  };

  // precise period end for subscriptions
  if (session.subscription) {
    const sub = await stripe.subscriptions.retrieve(session.subscription);
    update.currentPeriodEnd = new Date(sub.current_period_end * 1000);
  }

  await UserSubscription.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    update,
    { upsert: true, new: true }
  );

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
 * 1b) OPTIONAL: Confirm after return (works even if webhook is delayed)
 *     POST /stripe/confirm  { session_id }
 * ---------------------------------------------------------------------------*/
router.post("/stripe/confirm", adminAuth, async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ message: "session_id is required" });

    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ["subscription"] });
    const paid = session.payment_status === "paid" || session.status === "complete";
    if (!paid) return res.status(400).json({ message: "Session not paid/complete yet" });

    await upsertFromCheckoutSession(session);
    return res.json({ ok: true });
  } catch (err) {
    console.error("[/stripe/confirm] error:", err);
    return res.status(500).json({ message: "Failed to confirm session" });
  }
});

/* -----------------------------------------------------------------------------
 * 2) Stripe Webhook  (mounted in app.js with express.raw)
 * ---------------------------------------------------------------------------*/
async function webhookHandler(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw Buffer (express.raw in app.js)
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
        // ignore others
        break;
    }
    return res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    return res.status(500).send("Webhook handler failure");
  }
}

module.exports = { router, webhookHandler };
