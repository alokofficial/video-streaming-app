import Log from "../models/Log.js";

export const logActivity = async ({ userId, userName, userEmail, action, details, req }) => {
  try {
    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    await Log.create({
      userId: userId || null,
      userName: userName || "Anonymous",
      userEmail: userEmail || "N/A",
      action,
      details,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};
