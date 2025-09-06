
import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { upload } from "../middlewares/multer.middleware.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt, { decode } from "jsonwebtoken"

const generateAccessandRefreshTokens = async(userId)=>{
    try {
        // firstly find user by id
        const user = await User.findById(userId);
        // now we have user get tokens from user

        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();


        // add refresh token to our user object
        user.refreshToken = refreshToken
        // now save this refresh token in DB
        await user.save({validateBeforeSave : false});

        return {accessToken, refreshToken};

    }
    catch (error){
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens");
    }
}

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
    const {fullName, email, username, password } = req.body;
    //console.log(fullName, email, username, password);

    //console.log(req.body)
    //  checking validity of details
    if([fullName, email, username, password].some((field) => 
        field?.trim() === "")){
            throw new ApiError(400, "All fields are compulsory");
        }
   

    // checking existence of user 
    // for this use User from model as it can only communicate directly with DB

    const existedUser = await User.findOne({
        // user $or operator which find if any one field of given array is present return true
         $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
        // check if ursername OR email already exists
    })

    if(existedUser){
        throw new ApiError(409, "User Already Exists")
    }

    //console.log(req.files)
    // Get local path of avatar and cover image file using multer
    const avatarLocalPath = req.files?.avatar[0]?.path
   //const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files?.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar Image not uploaded")
    }

    // check if file uploaded on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar Image not uploaded on cloudinary")
    }

    // create user object
    const user  = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    // remove password and refreshtoken before sending response
    const createdUser = await User.findById(user._id).select(
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


const loginUser = asyncHandler(async(req, res) => {
    // Steps to folow
    // req body -> user data
    // username or email
    // check user exist or not
    // check password validity
    // generate access and refresh token
    // send cookie
    // send response

    const {username , email, password} = req.body

    if(!username && !email){
        throw new ApiError(400, "Username or Email is Required");
    }

    const user = await User.findOne({
        $or : [{username}, {email}]
    })
    // user have empty refresh token here because method not yet called to generate it
    if(!user){
        throw new ApiError(404, "User not found. Register first")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Incorrect Password")
    }

    const {accessToken, refreshToken} = await generateAccessandRefreshTokens(user._id)
    //  now user have that refresh token but we dont want user to have that on his side so create a new instance and remove password and refreshtoken
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // Sending cookies
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
            user : loggedInUser, accessToken, refreshToken
            },
            "User logged in Successfully"
        )
    )

})  

const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
    req.user._id,
    {
        $set: {
            refreshToken: undefined
        },
    },
    {
        new: true
    }
)
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));

})

const refreshAccessToken = asyncHandler( async(req, res) =>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(401, "Invalid refresh token")
    }

    try {
        if(decodedToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessandRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken, 
                    refreshToken: newRefreshToken, 
                },
                "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Ivalid refresh token")
    }
})

export { registerUser, loginUser, logOutUser, refreshAccessToken }