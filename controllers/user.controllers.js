import { compare } from "bcrypt";
import { User } from "../model/user.model.js";
import { emitEvent, sendToken } from "../utils/features.js";
import { TryCatch } from "../middleware/error.js";
import { Chats } from "../model/chat.js";
import { Requests } from "../model/request.js";
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/Event.js";
import { Chat } from "@mui/icons-material";
import { getOtherMember } from "../lib/helper.js";



const login = TryCatch(async (req, res, next) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username }).select("password")
    if (!user) return next(new Error("Invalid username"));
    const isMatch = await compare(password, user.password)
    const user1 = await User.findOne({ username }).select("-password")

    if (!isMatch) return res.status(500).json({ message: "Invalid password" });
    sendToken(res, user1, 201, "Welcome Back");

}

)

const profile = TryCatch(async (req, res, next) => {
    let users = req.user._id
    users = await User.findById({ _id: users })
    res.status(200).json({ success: true, message: "profile updated", data: users })
});

const search = TryCatch(async (req, res, next) => {
    let { name } = req.query
    console.log(req.user._id)
    const data = await Chats.find({ groupChat: false, members: req.user._id });
    const allUserExceptMyFriend = data.flatMap((chat) => chat.members)

    const allUserExceptMeAndFriend = await User.find({
        _id: { $nin: allUserExceptMyFriend },
        name: { $regex: name, $options: 'i' }
    }).select('name')
    res.status(200).json({ message: "Search results", data: allUserExceptMeAndFriend });


})

const getOtherUsers = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const otherUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
        return res.status(200).json(otherUsers);
    } catch (error) {
        console.log(error);
    }
}


const newUser = TryCatch(async (req, res) => {
    const { name, username, password, bio } = req.body;
    const user = await User.create({
        name,
        username,
        password,
        bio
    })
    sendToken(res, user, 201, "User created successfully");
})

const sendFriendRequest = TryCatch(async (req, res) => {
    const { userId } = req.body;
    const request = await Requests.findOne({
        $or: [
            { sender: req.user._id, receiver: userId },
            { sender: userId, receiver: req.user._id }
        ]
    })
    if (request) return res.status(400).json({ message: "request already exists" })

    await Requests.create({
        sender: req.user._id,
        receiver: userId
    })

    emitEvent(req, NEW_REQUEST, [userId],[],userId);
    return res.status(200).json({ message: "Request send successfully" })

}
)
const acceptFriendRequest = TryCatch(async (req, res) => {
    const { requestId, accept } = req.body;
    const request = await Requests.findById(requestId).populate("sender", "name").populate("receiver", "name")
    if (!request) return res.status(404).json({ message: "Invalid request id" })

    if (req.user._id.toString() !== request.receiver._id.toString()) return res.status(404).json({ message: "You are not authorized" })
    if (!accept) {
        await request.deleteOne()
        // emitEvent(res,NEW_REQUEST,[userId]);
        return res.status(403).json({ message: "Request rejected" })

    }
    const members = [request.sender._id, request.receiver._id]
   const [chat] =  await Promise.all([
        Chats.create({
            members: members,
            name: `${request.sender.name} - ${request.receiver.name}`
        }),
        request.deleteOne()
    ])
    emitEvent(req, REFETCH_CHATS, members,[],chat._id)
    return res.status(200).json({ message: "Request send successfully", sender: request.sender })

})

const getAllNotification = TryCatch(async (req, res) => {
    const request = await Requests.find({ receiver: req.user._id }).populate('sender', 'name')
    console.log(request)
    const allRequest = request.map(({ _id, sender }) => ({
        _id,
        sender: {
            _id: sender._id,
            name: sender.name
        }
    }))
    res.status(200).json({
        status: true,
        data: allRequest
    })
})

const getAllFriends = TryCatch(async (req, res) => {
    const chatId = req.query.chatId;

    const chats = await Chats.find({
        members: req.user._id,
        groupChat: false
    }).populate("members", "name")

    // const friend = chats.map(async ({ members }) => {
    // //     console.log({ members }, req.user._id)
    // //     const otherUser = await  getOtherMember(members, req.user._id)
    // //     return {
    // //         _id: otherUser?._id,
    // //         name: otherUser?.name
    // //     }
    // // });
    const friendPromises = chats.map(async ({ members }) => {
        console.log({ members }, req.user._id);
        const otherUser = await getOtherMember(members, req.user._id);
        if (otherUser && otherUser._id && otherUser.name) {
            return {
                _id: otherUser._id,
                name: otherUser.name
            };
        }
        return null; // Return null for invalid data
    });
const friends = await Promise.all(friendPromises);
console.log(friends,'the friends')

    if (chatId) {
        const chats = await Chats.findById(chatId);
        const filteredFriends = friends.filter(friend => friend !== null);
        console.log(filteredFriends,'filtered friends');
        return res.status(200).json({
            status: true,
            data: filteredFriends
        })
    } else {
        return res.status(200).json({
            status: true,
            data: friends
        })
    }


})


export { login, newUser, profile, search, getOtherUsers, sendFriendRequest, acceptFriendRequest, getAllNotification, getAllFriends }