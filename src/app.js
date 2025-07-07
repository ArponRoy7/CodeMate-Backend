const express = require('express');
const app=express();
app.use("/user",(req,rep)=>
{
    throw new Error("User Not Found");//express know about error
    rep.send("Hello User");
})
app.use("/",(err,req,rep,next)=>
{
    if(err)
    rep.status(500).send("not found");
})

app.listen(3000,()=>
{
    console.log("Server  Running");
})