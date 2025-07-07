const mongoose = require('mongoose');

// Connect to MongoDB
async function connectDB() {
  await mongoose.connect("mongodb+srv://Arpon:Chobi.Poka07032002@arponcluster.ui1rsuz.mongodb.net/Devtinder", {
  });
}

module.exports = { connectDB };

