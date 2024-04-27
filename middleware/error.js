const errorMiddleware  = (err, req,res, next) =>{
    err.message ||  "Internal error " ;
    err.statusCode || 500

    return res.status(err.statusCode).json({
        success : false,
        message : err.message
    });
};

const TryCatch = (passed) => async (req,res,next) =>{
try{
    await  passed(req,res,next);
}
catch(err){
    next(err);
}
}
export { errorMiddleware , TryCatch };