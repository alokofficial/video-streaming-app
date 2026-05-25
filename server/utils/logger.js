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

    // Cap total logs to 200 entries
    const count = await Log.countDocuments();
    if (count >= 200) {
      const logsToKeep = await Log.find()
        .sort({ createdAt: -1 })
        .limit(200)
        .select("_id");
      const keepIds = logsToKeep.map((log) => log._id);
      await Log.deleteMany({ _id: { $nin: keepIds } });
    }
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};
