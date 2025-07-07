const express = require('express');
const app=express();
const {adminAuth} = require('./middleware/auth');
app.get("/admin",adminAuth)
app.get('/admin/all',(req,res)=>
{
    res.send("Welcome to Admin Dashboard");
})

app.listen(3000,()=>
{
    console.log("Server  Running");
})