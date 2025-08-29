// constants/plans.js
const PLAN_TYPES = ["silver", "gold"];
const BILLING_CYCLES = ["monthly", "yearly"];
const CURRENCY = "INR"; // keep lowercase when sending to Stripe

module.exports = { PLAN_TYPES, BILLING_CYCLES, CURRENCY };
