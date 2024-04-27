import express from 'express';
import { VerifyUser } from '../middleware/auth.js';
import { addMember, deleteChat, getChatDetails, getMessages, getMyGroupChat, leaveGroup, myChats, newGroupChat, removeMember , renameGroup, sendAttachments } from '../controllers/chat.controller.js';
import { attachmentsMulter, singleAvatar } from '../middleware/multer.js';
import { checkValidation, getChatDetailValidation, getMessageValidation, newGroupValidation, newMemberValidation, reNameValidation, removeValidation, sendAttachmentsValidation } from '../lib/validation.js';
const app = express.Router();


app.use(VerifyUser)

// version 2

// app.post("/send/:id",sendMessage);
// app.get("/:id", getMessage);


app.post('/addGroupChat',  newGroupValidation(), checkValidation,newGroupChat)
app.get('/myChat',myChats)
app.get('/myGroup',getMyGroupChat)
app.put('/addMember',newMemberValidation(),checkValidation,addMember)
app.put('/removeMember',removeValidation(),checkValidation,removeMember)
app.put('/leaveGroup/:id',leaveGroup)
app.post('/message',attachmentsMulter,sendAttachmentsValidation(),checkValidation,sendAttachments)
app.route('/:id').get( getChatDetailValidation(),checkValidation,getChatDetails).put( reNameValidation(),checkValidation, renameGroup).delete(getChatDetailValidation(),checkValidation ,deleteChat);
app.get('/getMessages/:id', getMessageValidation(),checkValidation,getMessages)


export default app;