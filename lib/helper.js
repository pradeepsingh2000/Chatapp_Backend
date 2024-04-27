import { userSocketIDs } from "../app.js";


export const getOtherMember = (members, userId) => {
  return members.find((member) => member._id.toString() !== userId.toString());
}

export const getSockets = (users) => {
  const sockets = users.map((user) => userSocketIDs.get(user.toString()))
  return sockets
}


























export const validator = (schema, property) => async (req, res, next) => {
  const { error } = schema.validate(req[property || 'body']);
  const valid = error == null;
  if (valid) {
    next();
  } else {
    const { details } = error;
    console.log(details[0]);
    fail(res, 400, details[0], [])
  }
};

export const getBase64 = (file) =>
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;