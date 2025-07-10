const mongoose = require('mongoose');
const validator = require('validator');

const schema = new mongoose.Schema({
  name: { 
    type: String,
    required: true,
    unique: true
  },
  age: { 
    type: Number 
  },
  gender: { 
    type: String,
    validate(value) {
      if (!["male", "female", "others"].includes(value)) {
        throw new Error("Gender is wrong");
      }
    }
  },
  email: { 
    type: String,
    required: true,
    unique: true, // good practice
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid email ID");
      }
    }
  },
  password: { 
    type: String,
    required: true
  },
  photourl: {
    type: String,
    default: "default value"
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', schema);
module.exports = User;
