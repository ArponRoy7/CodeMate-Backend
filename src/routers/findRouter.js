const express = require('express');
const findRouter = express.Router();
const User = require('/home/arpon-roy/Desktop/WebDevCodes/Namaste Node JS/Season_2/DevTinderBackend/src/model/user.js');

//finding by filter 
findRouter.get("/user",async(req , res)=>
    {
      const useremail = req.body.email;
      try
      {
        const detail = await User.find({email : useremail});
        res.status(201).send(detail);
      }
      catch(err)
      {
        console.log(err);
        res.status(404).send("error happed");
      }
    })
    //finding by all
findRouter.get("/feed",async(req,res)=>
    {
      try {
        const entry = await User.find({});
        res.status(201).send(entry);
      } catch (error) {
        console.log(err);
        res.status(404).send("error happed");
      }
    })
    
module.exports=findRouter; 