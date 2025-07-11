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
const updatevalid=(req)=>
{
  const allowed = ["name","email"];
  const isallow=Object.keys(req.body).every((field)=>allowed.includes(field));
  return isallow;
}
module.exports={
    validatesignupdata,
    updatevalid
}