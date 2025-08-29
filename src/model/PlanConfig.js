const mongoose = require("mongoose");
const { PLAN_TYPES, BILLING_CYCLES } = require("../utils/constants");

const PlanConfigSchema = new mongoose.Schema(
  {
    plan: { type: String, enum: PLAN_TYPES, required: true },
    billing: { type: String, enum: BILLING_CYCLES, required: true },
    amountInINR: { type: Number, required: true, min: 1 }, // for display
    currency: { type: String, default: "INR" },
    stripePriceId: { type: String, required: true },       // used to create checkout sessions
    features: [{ type: String }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PlanConfigSchema.index({ plan: 1, billing: 1 }, { unique: true });

module.exports = mongoose.model("PlanConfig", PlanConfigSchema);
