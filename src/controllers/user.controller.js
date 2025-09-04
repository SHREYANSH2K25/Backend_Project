
import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "./utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { upload } from "../middlewares/multer.middleware.js"
import { ApiResponse } from "../utils/ApiResponse.js"
const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entery in db
    // remove password and refresh token field from response
    // check for user creation
    // return response
    
    // taking user details
    const {fullName, email, username, password } =req.body
    console.log("email : ", email );

    //  checking validity of details
    if([fullName, email, username, password].some((field) => 
        field?.trim() === "")){
            throw new ApiError(400, "All fields are compulsory");
        }
   

    // checking existence of user 
    // for this use User from model as it can only communicate directly with DB

    const existedUser = await User.findOne({
        // user $or operator which find if any one field of given array is present return true
        $or : [{username}, {email}]
        // check if ursername OR email already exists
    })

    if(existedUser){
        throw new ApiError(409, "User Already Exists")
    }

    // Get local path of avatar and cover image file using multer
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar Image not uploaded")
    }

    // check if file uploaded on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar Image not uploaded")
    }

    // create user object
    await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    // remove password and refreshtoken before sending response
    const createdUser = await User.findById(User._id).select(
        "-password -refreshToken"
    )

    // check for creation of user object
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering User")
    }

    // send response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

 })


export { registerUser }
