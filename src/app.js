const express = require('express');
const app = express();
const { connectDB } = require('./config/database');
const User = require('./model/user');

app.use(express.json());
//updating
app.patch("/user", async (req, res) => {
  const userid = req.body._id;
  const data = req.body;
  try {
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
app.post("/signup", async (req, res) => {
  try {

    const user = new User(req.body);
    await user.save();

    res.status(201).send("User created successfully");
    console.log("user Details : ");
    console.log(req.body);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating user");
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
