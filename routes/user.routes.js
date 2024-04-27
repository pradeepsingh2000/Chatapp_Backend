import express from 'express';
import { acceptFriendRequest, getAllFriends, getAllNotification, getOtherUsers, login, newUser, profile, search, sendFriendRequest } from '../controllers/user.controllers.js';
import { VerifyUser } from '../middleware/auth.js';
import { acceptFriendRequestValidation, checkValidation, loginValidation, registerValidation, sendFriendRequestValidation } from '../lib/validation.js';
const app = express.Router();

app.post('/new', registerValidation(), checkValidation, newUser)
// app.post('/new',newUser)
app.post('/login', loginValidation(), checkValidation, login)

app.use(VerifyUser)

// version 2
app.get('/getOtherUsers', getOtherUsers)
app.get('/profile', profile)
app.get('/search', search)
app.put('/sendRequest', sendFriendRequestValidation(), checkValidation, sendFriendRequest)
app.put('/acceptRequest', acceptFriendRequestValidation(), checkValidation, acceptFriendRequest)
app.get('/notification', getAllNotification)
app.get('/friends', getAllFriends)


export default app;