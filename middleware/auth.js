import { User } from "../model/user.model.js";
import { TryCatch, errorMiddleware } from "./error.js";
import jwt from "jsonwebtoken";

const VerifyUser = TryCatch(async (req, res, next) => {
  if (
    req.headers.authorization === undefined ||
    req.headers.Authorization === undefined ||
    req.header.Authorization === null
  ) {
    const token = req.headers.authorization || req.header.Authorization;
    if (!token) {
      const error = new Error("Token not provided");
      error.statusCode = 401;
      return next(error);
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        const error = new Error(" Invalid Token not provided");
        error.statusCode = 401;
        return next(error);
      }
      const data = await User.find({ _id: decoded._id }).select('_id');
      req.user = data[0];
      next();
    });
  } else {
    next();
  }
});

const VerifySocketUser = TryCatch(async (err, socket, next) => {
  try {
    if (err) return next(err);
    const token = socket.handshake.headers.authorization;
    if (!token) {
      const error = new Error("Token not provided");
      error.statusCode = 401;
      return next(error);
    }
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        const error = new Error(" Invalid Token not provided");
        error.statusCode = 401;
        return next(error);
      }
      socket.user = await User.find({ _id: decoded._id }).select('-password');
      next();
    });
  } catch (error) {
    console.error("Error in socket authentication:", error);
    next(error);
  }
});


export { VerifyUser, VerifySocketUser };
