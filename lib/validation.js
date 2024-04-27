import { body, check, param, validationResult } from "express-validator";

const registerValidation = () => [
  body("name", "Please enter a name").notEmpty(),
  body("username", "Please enter a username").notEmpty(),
  body("password", "Please enter a password").notEmpty(),
  body("bio", "Please enter a bio").notEmpty(),
];

const loginValidation = () => [
  body("username", "Please enter a name").notEmpty(),
  body("password", "Please enter a password").notEmpty(),
];

const newGroupValidation = () => [
  body("name", "Please enter a name").notEmpty(),
  body("members", "Please add the member")
    .notEmpty()
    .withMessage("Please enter Member")
    .isArray({ min: 2, max: 100 }),
];

const newMemberValidation = () => [
  body("chatId", "Please select the chat").notEmpty(),
  body("members", "Please add the member")
    .notEmpty()
    .withMessage("Please enter Member")
    .isArray(),
];

const removeValidation = () => [
  body("userId", "Please select the user").notEmpty(),
  body("chatId", "Please select the chat").notEmpty(),
];

const sendAttachmentsValidation = () => [
  body("chatId", "Please select the chat").notEmpty(),
];

const getMessageValidation = () => [
  param("id", "Please select chat").notEmpty(),
];

const getChatDetailValidation = () => [
  param("id", "Please select chat").notEmpty(),
];

const reNameValidation = () => [
  param("id", "Please select chat").notEmpty(),
  body("name", "Please enter chat name").notEmpty(),
];

const sendFriendRequestValidation = () => [
  body("userId", "please select user").notEmpty()
]

const acceptFriendRequestValidation = () => [
  body("requestId", "please select request").notEmpty(),
  body("accept").notEmpty().withMessage("please Add Accept").isBoolean()
]

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    return res.status(400).json({ errors: errorMessages });
  }
  next();
};

export {
  registerValidation,
  checkValidation,
  loginValidation,
  newGroupValidation,
  newMemberValidation,
  removeValidation,
  sendAttachmentsValidation,
  getMessageValidation,
  getChatDetailValidation,
  reNameValidation,
  sendFriendRequestValidation,
  acceptFriendRequestValidation
};
