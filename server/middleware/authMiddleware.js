import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ensureUserRole } from "../utils/roles.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token;

    if (
      !authHeader?.startsWith("Bearer ") &&
      !queryToken
    ) {
      return res.status(401).json({
        message: "Not authorized, no token",
      });
    }

    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : queryToken;
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id).select(
      "-password"
    );

    if (!user) {
      return res.status(401).json({
        message: "Not authorized, user not found",
      });
    }

    req.user = await ensureUserRole(user);
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, token failed",
    });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden: admin access required",
      });
    }

    next();
  };
};
