const User = require("../model/user.js");
const jwt = require("jsonwebtoken");


const adminAuth = async (req, res, next) => { 
    try {
    const cookie=req.cookies;
    const {token}=cookie;
    if(!token)
      {return res.status(401).send("Please Log in");
      }
    //validate token 
    const decoded =await jwt.verify(token,process.env.TOKEN);
    const {_id}=decoded;
    const loginuser = await User.findById(_id);
    req.loginuser=loginuser;
    if(!loginuser)
      throw new Error("No user found");
    next();
    } catch (error) {
        console.log("Error : "+error.message);
        if(error.message==="Invalid token try to log in  ")
          res.send("Invalid token try to log in " );
        else
        res.send("Error occurs");
    }
};

module.exports = {adminAuth};