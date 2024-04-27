import { Chats } from "../model/chat.js";
import { Message } from "../model/message.js";
import { User } from "../model/user.model.js"
import {faker, simpleFaker} from "@faker-js/faker"
const CreateUser  = async (numUsers) => {
    try {
            const UserPromise = []
            for (let i = 0; i < numUsers; i++) {
                const tempUser = User.create( {
                    name:faker.person.fullName(),
                    bio:faker.lorem.sentence(10),
                    username:faker.internet.userName,
                    password:"password",
                });
                UserPromise.push(tempUser);
            }
            await Promise.all(UserPromise)
            process.exit(1)
    }
    catch (err) {

    }
}

const createSampleChats = async (chatCount) => {
try{
    const users = await User.find().select('_id')
    const chatPromises = [];
    for (let i = 0; i < users.length; i++) {
        for (let j = 0; j < users.length; j++) {
        chatPromises.push(
            Chats.create({
                name: faker.lorem.words(2),
                members:[users[i], users[j]],
            })
        )
        }
    }

    await Promise.all(chatPromises);
    console.log("Chat created successfully")
    process.exit(1);
}
catch (err) {
console.log(err);
}
}

const createGroupChats = async (chatCount) => {

    const users = await User.find().select('_id')
    const chatPromises = [];
    for (let i = 0; i < chatCount; i++) {
        const members = [];
        const newMember = simpleFaker.number.int({min:3, max:users.length})

        for(i = 0; i < newMember; i++) {
            const randomIndex = Math.floor(Math.random() * users.length);
            const randomUser = users[randomIndex];

            if(!members.includes(randomUser)){
                members.push(randomUser);
            }
            const chat  = Chats.create({
                groupChat:true,
                name: faker.lorem.words(2),
                members,
                creator:members[0]
            })
            chatPromises.push(chat)
        }
        await Promise.all(chatPromises)
      
    }

    console.log("groupChat created");


}

const createMessage = async () => {
    try {
        const users = await User.find().select("_id")
        const chats = await Chats.find().select("_id")
        const messagePromise = [];
        for (let i = 0; i < users.length; i++) {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const randomChat = chats[Math.floor(Math.random() * chats.length)];
            messagePromise.push(
                Message.create({
                    chat:randomUser,
                    sender:randomUser,
                    content: faker.lorem.sentence(2)
                })
            )
        }
        await Promise.all(messagePromise)
        console.log("create message");
    }
    catch (err) {}
}

const createMessageInChat = async (chatId, numMessage) => {
    try {
        const users = await User.find().select("_id")
        const messagePromise = [];

        for (let i = 0; i < numMessage; i++) {
            const randomUser = users[Math.floor(Math.random() * users.length)]
            messagePromise.push(
                Message.create({
                    chat:chatId,
                    sender : randomUser,
                    content : faker.lorem.sentence(2)
                })
            )
        }
    }
    catch (err) {

    }
}

export {CreateUser , createSampleChats , createGroupChats ,createMessage , createMessageInChat}