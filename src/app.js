const express = require('express');
const app = express();
const { connectDB } = require('./config/database');
const User = require('./model/user');


app.post("/signup", async (req, res) => {
  try {
    const userobj = {
      name: "arpon",
      age: "20",
      gender: "male",
      email: "arpon@gmail.com",
      password: "arpon123",
    };

    const user = new User(userobj);
    await user.save();

    res.status(201).send("User created successfully");
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
