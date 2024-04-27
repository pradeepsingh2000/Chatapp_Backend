import express from "express";
import userRouter from "./routes/user.routes.js"
import chatRouter from "./routes/chat.routes.js"
import { createServer } from 'node:http';
import { connectDB } from "./utils/features.js";
import cors from 'cors'
import dotenv from "dotenv";
import { Server } from "socket.io";
import { CreateUser, createGroupChats, createMessageInChat, createSampleChats } from "./seeders/seed.js";
import { NEW_MESSAGE, NEW_MESSAGE_ALERT, START_TYPING, STOP_TYPING } from "./constants/Event.js";
import { v4 as uuid } from "uuid"
import { getSockets } from "./lib/helper.js";
import { Message } from "./model/message.js";
import { v2 as cloudinary } from "cloudinary"
import { corsOption } from "./config/config.js";
import { VerifySocketUser } from "./middleware/auth.js";
import { Chats } from "./model/chat.js";
dotenv.config({
    path: "./.env"
})
const app = express();
const server = createServer(app);
const io = new Server(server,
    {
        cors: corsOption
    })
const userSocketIDs = new Map();
app.use(express.json());
app.use(express.urlencoded());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}))

const port = process.env.port || 4000
connectDB()

cloudinary.config({
    cloud_name: process.env.YOUR_CLOUD_NAME,
    api_key: process.env.YOUR_API_KEY,
    api_secret: process.env.YOUR_API_SECRET
});

// createMessageInChat("6605806e8b8382b0b9cf033a",50)
// createSampleChats(10)
// createGroupChats(10)
// CreateUser(10)

app.use('/user', userRouter)
app.use('/chat', chatRouter)
app.use((err, req, res, next) => {
    // Your error-handling logic here
    console.error(err.stack); // Log the error stack
    res.status(err.status || 500).send({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

io.use(async (socket, next) => {
    try {
        await VerifySocketUser(null, socket, next);
        // Passing null for err, as it's not being used inside VerifySocketUser
    } catch (error) {
        console.error("Error in socket authentication:", error);
        next(error); // Pass any errors to the next middleware in the chain
    }
});

app.set("io", io)
io.on('connection', (socket) => {
    const user = socket.user[0]
    userSocketIDs.set(user._id.toString(), socket.id);


    socket.on("join chat", ({ chatId }) => {
        socket.join(chatId);
        console.log("User Joined Room: " + chatId);
    });


    socket.on("join personal",(userId) => {
        socket.join(userId);
        console.log("User Personal Room: " + userId);

    })

    socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
        const messageForRealTime = {
            content: message,
            _id: uuid(),
            sender: {
                _id: user._id,
                name: user.name
            },
            chat: chatId,
            createdAt: new Date().toISOString()

        }
        const messageForDb = {
            sender: user._id,
            chat: chatId,
            content: message
        }
        const memberSockets = getSockets(members)
        // socket.in(chatId).emit(NEW_MESSAGE, {
            //     chatId: chatId,
            //     message: messageForRealTime
            // })
            io.to(chatId).emit(NEW_MESSAGE, {
                chatId: chatId,
                message: messageForRealTime
            });
            const data = await Chats.findById(chatId, { members: { $elemMatch: { $ne: user._id.toString() } } });

        
        io.to(data.members[0].toString()).emit(NEW_MESSAGE_ALERT, { chatId })
        try {
            await Message.create(messageForDb)
        }
        catch (e) {
            console.log(e)
        }
    })

    socket.on(START_TYPING,(data) => {
        io.to(data.chatId).emit(START_TYPING, {chatId: data.chatId})
    })

    socket.on(STOP_TYPING,(data) => {
        io.to(data.chatId).emit(STOP_TYPING,{chatId: data.chatId})
    })


    socket.on('disconnect', () => {
        console.log('user disconnected');
        userSocketIDs.delete(user._id.toString())
    })
});

server.listen(port, () => {
    console.log(`server is listening on ${port} - listening on ${process.env.NODE_ENV}`);
})
export { userSocketIDs }
