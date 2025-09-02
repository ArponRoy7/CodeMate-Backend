const express = require('express');
const profileRouter = express.Router();
const bcrypt = require('bcrypt');
const User = require('../model/user.js');
const { adminAuth } = require('../middleware/auth.js');
const { updatevalid } = require('../utils/validations.js');

//profile view api
// profile view api (updated)
profileRouter.get("/profile/view", adminAuth, async (req, res) => {
  try {
    const u = req.loginuser; // set by adminAuth after token verification
    if (!u) return res.status(401).json({ message: "Unauthorized" });

    // Derive first/last if your model only has `name`
    const fullName = u.firstName || u.lastName
      ? `${u.firstName || ""} ${u.lastName || ""}`.trim()
      : (u.name || "");
    const [first, ...rest] = fullName.split(" ");
    const firstName = (u.firstName || first || "").trim();
    const lastName = (u.lastName || rest.join(" ") || "").trim();

    // Build a safe response object (no password, tokens, etc.)
    const payload = {
      _id: u._id,
      firstName,
      lastName,
      email: u.email,
      photoUrl: u.photoUrl || u.photourl || null,
      skills: u.skills || [],
      about: u.about || "",
      age: u.age ?? null,
      gender: u.gender || null,
    };

    // optional log as you had before
    //
    

    return res.status(200).json(payload);
  } catch (error) {
    console.error("Profile view error:", error);
    return res.status(500).json({ message: "Failed to load profile." });
  }
});

// PATCH /profile/update
profileRouter.patch("/profile/update", adminAuth, async (req, res) => {
  try {
    if (!updatevalid(req)) {
      return res.status(400).json({ message: "Edit not allowed. Invalid fields in request." });
    }

    // Ensure we have a Mongoose document (not a plain object)
    let u = req.loginuser;
    if (!u || typeof u.save !== "function") {
      u = await User.findById(req.loginuser?._id);
      if (!u) return res.status(404).json({ message: "User not found." });
    }

    // Normalize incoming body
    const body = { ...req.body };

    // Map photoUrl -> photourl (schema uses 'photourl')
    if (body.photoUrl && !body.photourl) body.photourl = String(body.photoUrl).trim();

    // Keep gender exactly as schema expects (male|female|other) — do NOT rewrite to "others"
    if (typeof body.gender === "string") {
      body.gender = body.gender.toLowerCase().trim();
    }

    // Only keep numeric age if valid
    if ("age" in body) {
      const n = Number(body.age);
      if (Number.isNaN(n)) delete body.age;
      else body.age = n;
    }

    // Drop empty strings / null / undefined so we don't set them
    for (const k of Object.keys(body)) {
      const v = body[k];
      if (v === "" || v === null || v === undefined) delete body[k];
    }

    // Apply updates (whitelist is enforced by updatevalid)
    const updates = {};
    for (const k of Object.keys(body)) {
      u[k] = body[k];
      updates[k] = body[k];
    }

    await u.save();

    return res.status(200).json({
      message: "Edit was successful",
      updatedFields: updates,
    });
  } catch (error) {
    // Build a friendly error
    let msg = "Failed to update profile";
    if (error?.code === 11000) {
      msg = "Name already taken. Please choose a different name.";
    } else if (error?.name === "ValidationError") {
      // surface the first validation error message
      const first = Object.values(error.errors || {})[0];
      msg = first?.message || msg;
    } else if (error?.message) {
      msg = error.message;
    }
    console.error("Profile update error:", error);
    return res.status(400).json({ message: msg });
  }
});


//forget password
profileRouter.patch("/profile/password",adminAuth,async(req,res)=>
{
  try {
    const loginuser = req.loginuser;
    const isPasswordValid = await loginuser.validatePassword(req.body.oldpassword);
    if(!isPasswordValid)
      throw new Error("Password Not valid");
    const newpassword = await bcrypt.hash(req.body.newpassword, 10);
    req.loginuser.password=newpassword;
    await loginuser.save();
    res.send("Password Updated Sucessfully");
  } catch (error) {
    console.log("Error :" + error);
  }
})
module.exports=profileRouter;