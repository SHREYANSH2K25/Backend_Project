import {v2 as cloudinary} from "cloudinary";
import fs from "fs"

cloudinary.config({
    keyName : process.env.CLOUDINARY_KEY_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;

        // upload file on cloudinary
        const response  = await cloudinary.uploader.upload(localFilePath, {
            resource_type : "auto"
        })

        // file has been uploaded so pass a console message
        console.log("File has been uploaded",  response.url);

        return response
    }
    catch (error){
        // if file has not been uploaded from localStorage to cloudinary then remove that locally saved file as the upload operation got failed
        fs.unlinkSync(localFilePath)
        return null;
    }
}

export {uploadOnCloudinary}
