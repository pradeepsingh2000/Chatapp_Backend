import { hash } from 'bcrypt';
import {Schema, model} from 'mongoose'

const schema = new Schema({
    name : {
        type : String,
        required : true
    },
   bio :{
        type : String
   },
    username :{
        type : String,
        required : true
    },
    password :{
        type : String,
        required : true
    },

},{timestamps: true})

schema.pre("save",async function (next) {
    if(!this.isModified("password")) return next();
    this.password = await hash(this.password , 10)
})


export const User = model("User",schema)