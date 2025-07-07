const express = require('express');
const app=express();
app.get("/user",(req,rep)=>
{
  rep.send("FirstName : Arpon , LastName : Roy");
});
app.post("/user",(req,rep)=>
{
    rep.send("User Details Saved");
});
app.use("/Test",(req,reply)=>
{
reply.send("Testing Route Handler")
});
app.use("/",(req,reply)=>
    {
    reply.send("nothing")
    });
app.listen(3000,()=>
{
    console.log("Server  Running");
})