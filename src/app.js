const express = require('express');
const app=express();
app.use("/hello",(req,reply)=>
{
reply.send("Hello")
});
app.use("/bye",(req,reply)=>
    {
    reply.send("bye")
    });
app.listen(3000,()=>
{
    console.log("Server  hi Rssunning");
})