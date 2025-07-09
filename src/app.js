const express = require('express');
const app = express();
const { connectDB } = require('./config/database');
const User = require('./model/user');

app.use(express.json());//converting json to javascript object
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
