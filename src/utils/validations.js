const validator =require('validator');

const validatesignupdata=(req)=>
{
    const {name,email,password}=req.body;
    if(!name)
        throw new Error("name is not valid");
    else if (!validator.isEmail(email))
        throw new Error("Email is not valid");
    else if(!validator.isStrongPassword(password))
        throw new Error("Enter correct pass");
}
const updatevalid = (req) => {
    const allowed = ["name", "photoUrl", "photourl", "age", "gender", "about", "skills"];
    const keys = Object.keys(req.body || {});
    if (keys.length === 0) return false;
    return keys.every((k) => allowed.includes(k));
  };
  
  
module.exports={
    validatesignupdata,
    updatevalid
}