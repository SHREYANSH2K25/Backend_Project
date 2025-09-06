import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema({
    username: {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true
    },
    email: {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
    },
    fullName: {
        type : String,
        required : true,
        trim : true,
        index : true
    },
    avatar: {
        type : String, //cloudnary url

        required : true
    },
    avatarPublicId: {
      type: String, // Cloudinary public_id
      default: null,
    },
    coverImage : {
        type : String
    },
    coverImagePublicId: {
      type: String, // Cloudinary public_id
      default: null,
    },
    watchHistory : [
        {
            type : Schema.Types.ObjectId,
            ref : "Video",

        }
    ],
    password : {
        type: String,
        required : [true, "Password is required"]
    },
    refreshToken:{
        type : String,
    }
}, {timestamps : true})

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")){
        return next()
    }
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}


// this token is used to authorize API calls
userSchema.methods.generateAccessToken = async function(){
    return await jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullName : this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,  //signed with this token
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY  //expires after this time
        }
    )
}

// used to request new Access Token without logging in again
userSchema.methods.generateRefreshToken = async function(){
    return await jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}



export const User = mongoose.model("User", userSchema);