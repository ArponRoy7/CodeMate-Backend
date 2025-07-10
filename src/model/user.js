const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: { type: String,
    required : true,
    unique:true,
   },
  age: { type: Number },
  gender: { type: String,
    validate(value)
{
  if(!["male","female","others"].includes(value))
  {
    throw new Error("gender is wrong ");
  }
}  },
  email: { type: String
   },
  password: { type: String },
  photourl:{type : String,default:"default value "},
},
{
  timestamps:true,
}
);

const User = mongoose.model('User', schema);
module.exports = User;
