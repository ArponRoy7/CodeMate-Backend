const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const schema = new mongoose.Schema({
  name: { 
    type: String,
    required: true,
    index : true,
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
  },
about: {
  type: String,
  default: "This is a default about of the user"
},
skills: {
  type: [String],
  default: []
}
}, {
  timestamps: true
});
schema.methods.getJWT= async function(req,res)
{
  const user = this ;
  const token = await  jwt.sign({_id:user._id},"arpon123",{expiresIn:"1d"});
  return token ;
};
schema.methods.validatePassword = async function (passwordInputByUser) {
  const user = this;
  const passwordHash = user.password;

  const isPasswordValid = await bcrypt.compare(
    passwordInputByUser,
    passwordHash
  );

  return isPasswordValid;
};


const User = mongoose.model('User', schema);
module.exports = User;
