const express = require('express');
const app = express();
const { connectDB } = require('./config/database');
const User = require('./model/user');
const {validatesignupdata}=require("./utils/validations");
const bcrypt = require('bcrypt');

app.use(express.json());
//updating
app.patch("/user", async (req, res) => {
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
//log in api
app.post("/login",async(req,res)=>
{
  try{
    const{email,password}=req.body;
    const user = await User.findOne({email:email});
    if(!user)
    {
      throw new Error("Invalid Cred");
    }
    const ispasswordvalid = await bcrypt.compare(password, user.password);

    if(ispasswordvalid)
    {
      res.send("Log in successfull");
    }
    else
    throw new Error("Password not valid");
  }
  catch(err)
  {
    res.status(404).send("Error");
  }
})


//deleteing
app.delete("/user",async(req,rep)=>
{
  try {
    const userid=req.body._id;
    const del = await User.findByIdAndDelete(userid);
    rep.send("user deleted");
  } catch (error) {
    console.log(err);
    res.status(404).send("error happed");
  }
})
//finding by filter 
app.get("/user",async(req , res)=>
{
  const useremail = req.body.email;
  try
  {
    const detail = await User.find({email : useremail});
    res.status(201).send(detail);
  }
  catch(err)
  {
    console.log(err);
    res.status(404).send("error happed");
  }
})
//finding by all
app.get("/feed",async(req,res)=>
{
  try {
    const entry = await User.find({});
    res.status(201).send(entry);
  } catch (error) {
    console.log(err);
    res.status(404).send("error happed");
  }
})
//signup
app.post("/signup", async (req, res) => {
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


connectDB()
  .then(() => {
    console.log("MongoDB Connected...");
    app.listen(3000, () => {
      console.log("Server Running on port 3000");
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
