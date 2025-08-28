const express = require('express');
const authRouters = express.Router();
const bcrypt = require('bcrypt');
const User = require('../model/user.js');
const { validatesignupdata } = require('../utils/validations.js');

// signup
authRouters.post("/signup", async (req, res) => {
  try {
    validatesignupdata(req);
    const { name, email, password, skills, about, photourl, age, gender } = req.body;

    const passwordhash = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: passwordhash,
      skills,
      about,
      photourl,  // <- DB field appears to be 'photourl'
      age,
      gender
    });

    await user.save();

    // optional: return the created user (safe subset)
    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      photoUrl: user.photourl || user.photoUrl || null,
      message: "User created successfully"
    });
  } catch (err) {
    console.error(err.message);
    if (err.name === "ValidationError" || err.message?.includes("valid")) {
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
