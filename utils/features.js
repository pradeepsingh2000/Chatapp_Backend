import mongoose from "mongoose"
import Jwt from "jsonwebtoken";

const connectDB = () => {
    console.log(process.env.MONGO_URI,'process.env.MONGO_URI')
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then((data) => {
            console.log(`Connect to DB  connections host`)
        }).catch((err) => {
            console.log(err)
        });
};

const cookieOptions = {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    sameSite: "none",
    httpOnly: true,
    secure: true
}

const sendToken = (res, user, code, message) => {
    const token = Jwt.sign({
        _id: user._id
    }, process.env.JWT_SECRET);
    return res.status(code).json({
        success: true,
        token: token,
        message,
        user
    })
}

const emitEvent = (req, event, user, data,roomId) => {
    let io = req.app.get("io")
    console.log(roomId,'the room ID')
 io.to(roomId.toString()).emit(event, data)

    console.log("Emmiting event", event);
}


const deleteFromCloudnary = async (ids) => {

}
export { connectDB, sendToken, emitEvent, deleteFromCloudnary };