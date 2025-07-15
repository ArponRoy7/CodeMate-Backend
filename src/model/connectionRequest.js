const mongoose = require("mongoose");
const connectionRequestSchema = new mongoose.Schema({
    fromUserId:{
        type : mongoose.Schema.Types.ObjectId,
        required : true,
    },
    toUserId :{
        type : mongoose.Schema.Types.ObjectId,
        required:true,
    },
    status : {
        type : String,
        required:true,
        enum : {
            values : [ "ignored","interested","rejected","accepted"],
            message : '{VALUE} is incorrect status type' ,

        },
    },
},
{
    timestamps:true 
}
);
connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 });
const ConnectionRequest= new mongoose.model("ConnetionRequest",connectionRequestSchema);
module.exports=ConnectionRequest;