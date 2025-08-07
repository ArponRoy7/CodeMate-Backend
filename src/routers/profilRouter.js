const express = require('express');
const profileRouter = express.Router();
const bcrypt = require('bcrypt');
const User = require('../model/user.js');
const { adminAuth } = require('../middleware/auth.js');
const { updatevalid } = require('../utils/validations.js');

//profile view api
profileRouter.get("/profile/view",adminAuth,async (req,res)=>
{
  try {
    
   console.log(req.loginuser.name);
    res.send("profile view allowed");
  } catch (error) {
    res.status(404).send("Error  !!!"+error.message);
  }
}
)

///profile/edit
profileRouter.patch("/profile/update", adminAuth, async (req, res) => {
  try {
    if (!updatevalid(req)) {
      return res.status(400).json({ message: "Edit not allowed. Invalid fields in request." });
    }

    const loginuser = req.loginuser;
    const updates = {};

    Object.keys(req.body).forEach((key) => {
      loginuser[key] = req.body[key];
      updates[key] = req.body[key];
    });

    await loginuser.save();

    res.status(200).json({
      message: "Edit was successful",
      updatedFields: updates
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
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