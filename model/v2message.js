import {Schema, model,Types} from 'mongoose'

const schema = new Schema({
    senderId :{
        type : Types.ObjectId,
        ref : "User",
        required : true
    },
    receiverId :{
        type : Types.ObjectId,
        ref : "User",
        required : true
    },
   
    message : String,
    

},{timestamps: true})


export const Message = model("VersionToMessage",schema)