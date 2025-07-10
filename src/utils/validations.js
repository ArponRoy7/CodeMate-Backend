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
module.exports={
    validatesignupdata,
}