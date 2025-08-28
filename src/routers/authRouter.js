const express = require('express');
const authRouters = express.Router();
const bcrypt = require('bcrypt');
const User = require('../model/user.js');
const { validatesignupdata } = require('../utils/validations.js');

// signup
// authRouter.js

// SIGNUP (creates user, sets session cookie, returns safe snapshot)
authRouters.post("/signup", async (req, res) => {
  try {
    // Basic validation (name/email/password required; others optional)
    validatesignupdata(req);

    let {
      name,
      email,
      password,
      skills = [],
      about = "",
      photourl = "",
      age,
      gender, // "male" | "female" | "other"
    } = req.body || {};

    // Normalize
    if (typeof skills === "string") {
      // accept comma-separated
      skills = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (age !== undefined && age !== null && age !== "") {
      const n = Number(age);
      if (!Number.isNaN(n)) age = n;
      else delete req.body.age; // ignore bad age
    }
    if (typeof gender === "string") gender = gender.toLowerCase().trim();

    // Hash password & create
    const passwordhash = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: passwordhash,
      skills,
      about,
      photourl, // schema field
      age,
      gender,
    });

    await user.save();

    // Issue session cookie
    const token = await user.getJWT();
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // set true if serving over HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Return a safe snapshot the frontend can put in Redux
    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      photoUrl: user.photourl || null,
      age: user.age ?? null,
      gender: user.gender ?? null,
      about: user.about ?? "",
      skills: user.skills ?? [],
      message: "User created successfully",
    });
  } catch (err) {
    console.error("Signup error:", err);
    if (err?.code === 11000) {
      return res.status(400).send("Email or name already exists.");
    }
    if (err.name === "ValidationError" || (err.message && /valid/i.test(err.message))) {
      return res.status(400).send(err.message);
    }
    return res.status(500).send("Error creating user");
  }
});




// login
authRouters.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Invalid Cred");
    }

    // verify password (your model has validatePassword)
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new Error("Password not valid");
    }

    // create token
    const token = await user.getJWT();

    // set auth cookie
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "Lax",
      secure: false, // set true in HTTPS/prod
      path: "/",
      // maxAge: 7 * 24 * 60 * 60 * 1000, // optional: 7 days
    });

    // return safe user object for frontend Redux
    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      photoUrl: user.photourl || user.photoUrl || null
    });
  } catch (err) {
    return res.status(401).send("Error " + err.message);
  }
});

// logout
authRouters.get("/logout", async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "Lax",
    secure: false,
    path: "/"
  });
  return res.status(200).send("Logout successful");
});

module.exports = authRouters;
