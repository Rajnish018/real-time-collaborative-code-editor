import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
    firstName:{
        type:String,
        required:true,
    },
    lastName:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    provider:{
        type:String,
        default:"local",
    },
    providerId:{
        type:String,
    },
    agreeToTerms:{
        type:Boolean,
        required:true,
    },
    refreshToken:{
        type:String,
    },
})
export default mongoose.models.User || mongoose.model("User", userSchema);