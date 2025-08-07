const mongoose = require("mongoose");
const connectionRequestSchema = new mongoose.Schema({
    fromUserId:{
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref:"User",
    },
    toUserId :{
        type : mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User",
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
connectionRequestSchema.pre("save", function (next) {
    const connectionRequest = this;
    // Check if the fromUserId is same as toUserId
    if (connectionRequest.fromUserId.equals(connectionRequest.toUserId)) {
      throw new Error("Cannot send connection request to yourself!");
    }
    next();
  });
  
connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 });
const ConnectionRequest= new mongoose.model("ConnectionRequest",connectionRequestSchema);
module.exports=ConnectionRequest;