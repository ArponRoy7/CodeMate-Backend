// src/model/UserSubscription.js
const mongoose = require("mongoose");
const { PLAN_TYPES, BILLING_CYCLES } = require("../utils/constants"); // <- FIXED PATH

const UserSubscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: PLAN_TYPES, required: true },
    billing: { type: String, enum: BILLING_CYCLES, required: true },
    status: {
      type: String,
      enum: ["created", "active", "past_due", "canceled", "incomplete"],
      default: "created",
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodEnd: Date,
  },
  { timestamps: true }
);

UserSubscriptionSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model("UserSubscription", UserSubscriptionSchema);
