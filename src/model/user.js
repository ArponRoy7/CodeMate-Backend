const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: { type: String },
  age: { type: Number },
  gender: { type: String },
  email: { type: String },
  password: { type: String }
});

const User = mongoose.model('User', schema);
module.exports = User;
