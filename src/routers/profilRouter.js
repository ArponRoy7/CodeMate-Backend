const express = require('express');
const profileRouter= express.Router();
const User = require('/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/model/user.js');
const {adminAuth} = require("/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/middleware/auth.js")

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

//updating
profileRouter.patch("/profile/update", async (req, res) => {
  const userid = req.body._id;
  const data = req.body;
  try {
    const ALLOWED_UPDATES=[
      "age","email"
    ];
    const is_allow=Object.keys(data).every((k)=>
      ALLOWED_UPDATES.includes(k)
  );
  if(!is_allow)
  {
    throw new Error("Update Not allow");
  }
    const updatedUser = await User.findByIdAndUpdate(userid, data, {
      new: true,
      runValidators: true,
    });
    if (!updatedUser) {
      return res.status(404).send("User not found");
    }
    res.send("User Updated Successfully");
  } catch (error) {
    console.error(error);
    res.status(400).send("Something Went Wrong");
  }
});

module.exports=profileRouter;