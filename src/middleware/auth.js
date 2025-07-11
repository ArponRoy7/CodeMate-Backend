const User = require("/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/model/user.js");
const jwt = require('jsonwebtoken');

const adminAuth = async (req, res, next) => { 
    try {
    const cookie=req.cookies;
    const {token}=cookie;
    if(!token)
      {throw new Error("Invalid token try to log in  ");
      }
    //validate token 
    const decoded =await jwt.verify(token,"arpon123");
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