const express = require('express');
const authRouters=express.Router();
const bcrypt = require('bcrypt');
const User = require('/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/model/user.js');
const {validatesignupdata}=require("/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/utils/validations.js");
//signup
authRouters.post("/signup", async (req, res) => {
    try {
      //validator
      validatesignupdata(req); // custom validator
      //encrypt the password
      const { name, email, password } = req.body;
  const passwordhash = await bcrypt.hash(password, 10);
  console.log(passwordhash); // Print hashed password
  
  const user = new User({
    name,
    email,
    password: passwordhash, // Store hashed password
  });
  
  
      console.log("User Details:");
      console.log(req.body);
      await user.save(); // <- this actually saves the user to DB
  
      res.status(201).send("User created successfully");
      
    } catch (err) {
      console.error(err.message); 
      if (err.name === "ValidationError" || err.message?.includes("valid")) {
        res.status(400).send(err.message);
      } else {
        res.status(500).send("Error creating user");
      }
    }
    
  });
//log in api
authRouters.post("/login",async(req,res)=>
    {
      try{
        const{email,password}=req.body;
        const user = await User.findOne({email:email});
        if(!user)
        {
          throw new Error("Invalid Cred");
        }
        const isPasswordValid = await user.validatePassword(password);

    
        if(isPasswordValid)
        {
    //create token
    const token  = await user.getJWT();
    res.cookie("token",token);
    //console.log(token);
          res.send("Log in successfull");
        }
        else
        throw new Error("Password not valid");
      }
      catch(err)
      {
        res.status(404).send("Error"+err.message);
      }
    })
// log out api
authRouters.get("/logout",async (req,res)=>
{
  res.cookie("token",null,{
    expires: new Date(Date.now())
  });
  res.send("Log out Sucessfull");
})

module.exports = authRouters;