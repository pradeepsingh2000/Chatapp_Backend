import { TryCatch } from "../middleware/error.js";
import { Chats } from "../model/chat.js";
import {
  ALERT,
  NEW_ATTACHMENT,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
} from "../constants/Event.js";
import { deleteFromCloudnary, emitEvent } from "../utils/features.js";
import { getOtherMember } from "../lib/helper.js";
import { User } from "../model/user.model.js";
import { Message } from "../model/message.js";

const newGroupChat = TryCatch(async (req, res, next) => {
  const { name, members } = req.body;
  if (members.length < 2)
    return res.status(400).json({ message: "More members than 2" });
  const allMembers = [...members, req.user._id];
  const data = await Chats.create({
    name,
    members: allMembers,
    creator: req.user._id,
    groupChat: true,
  });

  data.members.forEach((e) =>
    emitEvent(req, REFETCH_CHATS, allMembers, `Welcome to ${name} group`, e)
  );
  emitEvent(req, REFETCH_CHATS, members, [], data._id);

  return res.status(200).json({
    success: true,
    message: "Group Created",
  });
});

const myChats = TryCatch(async (req, res) => {
  const myChat = await Chats.find({ members: req.user._id }).populate(
    "members",
    "name "
  );
  const transFormChat = myChat.map(
    ({ _id, name, members, groupChat, creator }) => {
      const otherMember = getOtherMember(myChat, req.user._id);
      return {
        _id,
        name: groupChat ? name : otherMember.name,
        members: members.reduce((prev, curr) => {
          if (curr._id.toString() !== req.user._id.toString()) prev.push(curr);
          return prev;
        }, []),
        groupChat,
      };
    }
  );
  return res.status(200).json({
    success: true,
    myChat: transFormChat,
  });
});

const getMyGroupChat = TryCatch(async (req, res) => {
  const chat = await Chats.find({
    members: req.user,
    groupChat: true,
    creator: req.user,
  }).populate("members", "name");

  const group = chat.map(({ members, _id, groupChat, name }) => {
    return {
      _id,
      groupChat,
      name,
    };
  });

  return res.status(200).json({
    success: true,
    myChat: group,
  });
});

const addMember = TryCatch(async (req, res) => {
  const { chatId, members } = req.body;
  const chat = await Chats.findById(chatId);
  if (!chat) return res.status(404).json({ message: "Chat not found" });
  if (!chat.groupChat)
    return res.status(404).json({ message: "this is not a chat" });

  if (chat.creator.toString() !== req.user.id.toString())
    return res.status(404).json({ message: "not allow to delete chat" });

  const allNewMembersPromise = members.map((i) => User.findById(i));
  const allNewMembers = await Promise.all(allNewMembersPromise);

  const uniqueMembers = allNewMembers
    .filter((i) => !chat.members.includes(i._id.toString()))
    .map((i) => i._id);

  chat.members.push(...uniqueMembers);
  await chat.save();
  const allUserName = allNewMembers.map((i) => i.name).join(",");
  emitEvent(
    req,
    ALERT,
    chat.members,
    `You been added in ${chat.name} by ${allUserName}`,
    chat._id
  );
  chat.members.forEach((e) => {
    emitEvent(req, REFETCH_CHATS, members, [], e);
  });

  return res.status(200).json({
    success: true,
    message: "members  Added  successfully",
  });
});

const removeMember = TryCatch(async (req, res) => {
  const { userId, chatId } = req.body;

  let [chat, userThatWillBeRemoved] = await Promise.all([
    Chats.findById(chatId),
    User.findById(userId, "name"),
  ]);

  if (chat.members.length < 3) {
    return res.status(400).json({ message: "Group have atlest 3 members " });
  }
  if (!chat) return res.status(400).json({ message: "Chat does not exist" });
  if (!chat.groupChat)
    return res.status(404).json({ message: "This is not a group chat" });

  // Ensure chat.members is an array before filtering
  if (!Array.isArray(chat.members)) {
    return res.status(500).json({ message: "chat.members is not an array" });
  }

  chat.members = chat.members.filter((i) => i.toString() !== userId.toString());

  await chat.save();

  emitEvent(req, REFETCH_CHATS, chat.members, [], userId);

  return res.status(200).json({
    success: true,
    message: "Member removed successfully",
  });
});

const leaveGroup = TryCatch(async (req, res) => {
  const chatId = req.params.id;
  const chat = await Chats.findById(chatId);

  if (!chat) return res.status(404).json({ message: "Chat not found" });
  if (!chat.groupChat)
    return res.status(404).json({ message: "This is not a group chat" });
  const remaining = chat.members.filter(
    (member) => member.toString() !== req.user._id.toString()
  );

  if (chat.creator.toString() === req.user._id.toString()) {
    const randomElement = Math.floor(Math.random() * remaining.length);
    const newCreator = remaining[randomElement];
    chat.creator = newCreator;
  }

  chat.members = remaining;
  const [user] = await Promise.all([
    User.findById(req.user._id, "name"),
    chat.save(),
  ]);

  emitEvent(
    req,
    ALERT,
    chat.members,
    `${user.name} has left the group`,
    [],
    chatId
  );

  emitEvent(req, REFETCH_CHATS, chat.members, [], chatId);

  return res.status(200).json({
    success: true,
    message: "Member removed successfully",
  });
});

const sendAttachments = TryCatch(async (req, res) => {
  const { chatId } = req.body;
  const files = req.file || [];
  if (files.length < 1) {
    return res.status(404).json({ status: false, message: "No attachments" });
  }
  const [chat, me] = await Promise.all([
    Chats.findById(chatId),
    User.findById(req.user._id),
  ]);

  if (!chat) return res.status(404).json({ message: "Chat not found" });

  if (files.length < 1)
    return res.status(404).json({ message: "Please select file" });

  // upload file
  const attachments = [];
  const messageForRealTime = {
    content: "",
    attachments,
    sender: {
      _id: me._id,
      name: me.name,
    },
    chat: chatId,
  };
  const messgeForDB = {
    content: "",
    attachments,
    sender: req.user._id,
    chat: chatId,
  };

  const message = await Message.create(messgeForDB);

  emitEvent(
    res,
    NEW_ATTACHMENT,
    chat.members,
    {
      message: messageForRealTime,
      chat: chatId,
    },
    [],
    chatId
  );

  emitEvent(res, NEW_MESSAGE_ALERT, chat.members, { chatId }, chatId);
  return res.status(200).json({
    success: true,
    message,
  });
});

const getChatDetails = TryCatch(async (req, res) => {
  if (req.query.populate === "true") {
    const chat = await Chats.findById(req.params.id)
      .populate("members", "name")
      .lean();
    console.log(chat);
    if (!chat)
      return res
        .status(404)
        .json({ status: false, message: " Chat not found" });

    chat.members = chat.members.map(({ _id, name }) => ({
      _id,
      name,
    }));

    return res.status(200).json({
      success: true,
      chat,
    });
  } else {
    const chat = await Chats.findById(req.params.id);

    if (!chat)
      return res
        .status(404)
        .json({ status: false, message: " Chat not found" });

    return res.status(200).json({
      success: true,
      chat,
    });
  }
});

const renameGroup = TryCatch(async (req, res) => {
  const chatId = req.params.id;
  const { name } = req.body;
  const chat = await Chats.findById(chatId);

  if (!chat) return res.status(404).json({ message: "Chat not found" });

  if (!chat.groupChat)
    return res.status(404).json({ message: "This is not a group chat" });

  if (chat.creator.toString() !== req.user._id.toString())
    return res.status(404).json({ message: "You are not allowed" });
  chat.name = name;
  await chat.save();

  chat.members.forEach((e) => {
    emitEvent(req, REFETCH_CHATS, chat.members, [], e);
  });

  return res.status(200).json({
    success: true,
    message: "Group name change",
  });
});

const deleteChat = TryCatch(async (req, res) => {
  const chatId = req.params.id;
  const chat = await Chats.findById(chatId);
  let sendNotification = chat.members;

  if (!chat) return res.status(404).json({ message: "Chat not found" });
  if (chat.groupChatId) {
    if (chat?.creator?.toString() !== req.user._id.toString())
      return res.status(404).json({ message: "You are not allowed" });
  }

  const messageWithAttachments = await Message.find({
    chat: chatId,
    attachments: { $exists: true, $ne: [] },
  });

  const public_ids = [];

  messageWithAttachments.forEach(({ attachments }) => {
    attachments.forEach(({ public_id }) => {
      public_ids.push(public_id);
    });
  });

  await Promise.all([
    deleteFromCloudnary(public_ids),
    chat.deleteOne(),
    Message.deleteMany({ chat: chatId }),
  ]);

  sendNotification.forEach((e) =>
    emitEvent(req, REFETCH_CHATS, chat.members, [], e)
  );

  return res.status(200).json({
    success: true,
    message: "Chat deleted ",
  });
});

const getMessages = TryCatch(async (req, res) => {
  const chatId = req.params.id;
  const { page = 1 } = req.query;
  const limit = 20;
  const skip = (page - 1) * limit;

  const [messages, totalMessages] = await Promise.all([
    Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "name")
      .lean(),
    Message.countDocuments({ chat: chatId }),
  ]);

  const totalPages = Math.ceil(totalMessages / limit);

  return res.status(200).json({
    success: true,
    message: messages.reverse(),
    totalPages,
  });
});

export {
  newGroupChat,
  myChats,
  getMyGroupChat,
  addMember,
  removeMember,
  leaveGroup,
  sendAttachments,
  getChatDetails,
  renameGroup,
  deleteChat,
  getMessages,
};
