const mongoose = require('mongoose');

// Connect to MongoDB
async function connectDB() {
  await mongoose.connect(process.env.DB_STR);
}

module.exports = { connectDB };

