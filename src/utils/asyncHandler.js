const asyncHandler = (requestHandler) =>{
     (req, res, next =>{
        Promise.resolve(requestHandler(req, res, next)).
        catch((error) => next(error))
     })
}

export {asyncHandler}

// In Express.js, if an asynchronous function throws an error, you need to explicitly pass that error to the next function for the Express error-handling middleware to catch it. Without this, your server might crash or not handle the error properly.


// const asyncHandler = () =>{}
// const asyncHandler = (func) => {() => {}}
// const ansyncHanlder = (func) => {async () => {}}

// const ansyncHanlder = (func) => async (req, res, next) => {
//     try{
//         await func(req, res, next)
//     }
//     catch(error) {
//         res.status(err.code || 500).json({
//             success:false,
//             message: err.message
//         })
//     }
// }