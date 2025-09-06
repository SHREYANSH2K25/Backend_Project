import {v2 as cloudinary} from "cloudinary";
import fs from "fs"

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;

        // upload file on cloudinary
        const response  = await cloudinary.uploader.upload(localFilePath, {
            resource_type : "auto",
        })

        // file has been uploaded so pass a console message
        console.log("File has been uploaded",  response.url);

        // remove temp file after upload
        fs.unlinkSync(localFilePath);
        return response
    }
    catch (error){
        // if file has not been uploaded from localStorage to cloudinary then remove that locally saved file as the upload operation got failed
        fs.unlinkSync(localFilePath)
        return null;
    }
}

const deletefromCloudinary = async (public_id) => {
    try{
        if(!public_id) return null;
        const result = await cloudinary.uploader.destroy(public_id);
        return result;
    }
    catch(error){
        console.error("Cloudinary deletion error: ", error);
        return null
    }
}
export {uploadOnCloudinary, deletefromCloudinary}