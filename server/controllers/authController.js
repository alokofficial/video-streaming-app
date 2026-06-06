import User from "../models/User.js";
import Video from "../models/Video.js";
import YoutubeVideo from "../models/YoutubeVideo.js";
import Document from "../models/Document.js";
import SiteSetting from "../models/SiteSetting.js";
import Log from "../models/Log.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  ensureUserRole,
  resolveRoleForEmail,
} from "../utils/roles.js";
import { logActivity } from "../utils/logger.js";


// REGISTER
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = await resolveRoleForEmail(email);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      lastLoginAt: new Date(),
    });

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    await logActivity({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: "REGISTER",
      details: "Registered a new account",
      req,
    });

    res.status(201).json({
      token,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    await ensureUserRole(user);

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    await logActivity({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: "LOGIN",
      details: "Logged in successfully",
      req,
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
      },
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// GET USERS FOR ADMIN
export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({
        createdAt: -1,
      });

    const videos = await Video.find().select(
      "allowedEmails"
    );

    const youtubeVideos = await YoutubeVideo.find().select(
      "allowedEmails"
    );

    const documents = await Document.find().select(
      "allowedEmails"
    );

    const totalVideos = videos.length;
    const totalYoutubeVideos = youtubeVideos.length;
    const totalDocuments = documents.length;

    const usersWithAccessCount = users.map((user) => {
      const email = user.email.toLowerCase();
      const accessibleDriveVideos =
        user.role === "admin"
          ? totalVideos
          : videos.filter((video) => {
              const allowedEmails =
                video.allowedEmails || [];

              return (
                allowedEmails.length === 0 ||
                allowedEmails.includes(email)
              );
            }).length;

      const accessibleYoutubeVideos =
        user.role === "admin"
          ? totalYoutubeVideos
          : youtubeVideos.filter((video) => {
              const allowedEmails =
                video.allowedEmails || [];

              return (
                allowedEmails.length === 0 ||
                allowedEmails.includes(email)
              );
            }).length;

      const accessibleDocuments =
        user.role === "admin"
          ? totalDocuments
          : documents.filter((doc) => {
              const allowedEmails =
                doc.allowedEmails || [];

              return (
                allowedEmails.length === 0 ||
                allowedEmails.includes(email)
              );
            }).length;

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        accessibleDriveVideos,
        accessibleYoutubeVideos,
        accessibleDocuments,
      };
    });

    res.json(usersWithAccessCount);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// CREATE USER FOR ADMIN
export const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "user",
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters",
      });
    }

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const userExists = await User.findOne({
      email,
    });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        accessibleDriveVideos: 0,
        accessibleYoutubeVideos: 0,
        accessibleDocuments: 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// DELETE USER FOR ADMIN
export const deleteUser = async (req, res) => {
  try {
    if (
      req.params.id === req.user._id.toString()
    ) {
      return res.status(400).json({
        message:
          "You cannot delete your own account while logged in",
      });
    }

    const user = await User.findByIdAndDelete(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// GET CURRENT USER HEADING ORDER
export const getHeadingOrder = async (req, res) => {
  try {
    res.json({
      headingOrder: req.user.headingOrder || [],
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// UPDATE CURRENT USER HEADING ORDER
export const updateHeadingOrder = async (req, res) => {
  try {
    const headingOrder = Array.isArray(
      req.body.headingOrder
    )
      ? req.body.headingOrder
          .map((heading) =>
            String(heading).trim()
          )
          .filter(Boolean)
      : [];

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        headingOrder: [
          ...new Set(headingOrder),
        ],
      },
      {
        returnDocument: "after",
      }
    ).select("headingOrder");

    res.json({
      headingOrder: user.headingOrder || [],
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// CHANGE PASSWORD
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message:
          "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message:
          "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(
      newPassword,
      10
    );

    await user.save();

    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: "CHANGE_PASSWORD",
      details: "Changed account password",
      req,
    });

    res.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (name !== undefined) {
      user.name = name;
    }
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();

    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: "UPDATE_PROFILE",
      details: `Updated profile (name: ${name || user.name}, avatar: ${avatar !== undefined ? 'updated' : 'unchanged'})`,
      req,
    });

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ───────────────────────────────────────────
// SITE GATE
// ───────────────────────────────────────────

// Helper: get or create singleton settings doc
const getSettings = () =>
  SiteSetting.findOneAndUpdate(
    { _id: "site_settings" },
    { $setOnInsert: { _id: "site_settings" } },
    { upsert: true, returnDocument: 'after' }
  );

// PUBLIC — returns only whether gate is on (never exposes hash)
export const getSiteGateStatus = async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      gateEnabled: settings.gateEnabled && !!settings.gatePasswordHash,
      threeJsBackgroundEnabled: settings.threeJsBackgroundEnabled !== false,
      fontFamily: settings.fontFamily || "Inter",
      youtubeDirectEnabled: settings.youtubeDirectEnabled !== false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUBLIC — verify access code submitted by visitor
export const verifySiteGate = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Access code is required" });
    }

    const settings = await getSettings();

    if (!settings.gateEnabled || !settings.gatePasswordHash) {
      return res.json({ success: true }); // gate is off — always pass
    }

    const match = await bcrypt.compare(password, settings.gatePasswordHash);
    if (!match) {
      return res.status(401).json({ message: "Incorrect access code" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN — get full settings (for admin dashboard)
export const getSiteGateSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      gateEnabled: settings.gateEnabled,
      hasPassword: !!settings.gatePasswordHash,
      threeJsBackgroundEnabled: settings.threeJsBackgroundEnabled !== false,
      fontFamily: settings.fontFamily || "Inter",
      youtubeDirectEnabled: settings.youtubeDirectEnabled !== false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const ALLOWED_FONTS = [
  "Inter",
  "Outfit",
  "Poppins",
  "Roboto",
  "Montserrat",
  "Playfair Display",
  "Lora",
  "Fira Code",
  "Plus Jakarta Sans",
  "Space Grotesk",
  "Syne",
  "Cinzel",
  "Lexend",
];

// ADMIN — set/update gate (toggle, change password)
export const setSiteGate = async (req, res) => {
  try {
    const { enabled, password, threeJsBackgroundEnabled, fontFamily, youtubeDirectEnabled } = req.body;

    const update = {};

    if (typeof enabled === "boolean") {
      update.gateEnabled = enabled;
    }

    if (typeof threeJsBackgroundEnabled === "boolean") {
      update.threeJsBackgroundEnabled = threeJsBackgroundEnabled;
    }

    if (typeof youtubeDirectEnabled === "boolean") {
      update.youtubeDirectEnabled = youtubeDirectEnabled;
    }

    if (fontFamily !== undefined) {
      if (!ALLOWED_FONTS.includes(fontFamily)) {
        return res.status(400).json({ message: "Invalid font family selected" });
      }
      update.fontFamily = fontFamily;
    }

    if (password && password.trim().length > 0) {
      if (password.length < 4) {
        return res.status(400).json({ message: "Access code must be at least 4 characters" });
      }
      update.gatePasswordHash = await bcrypt.hash(password, 12);
    }

    const settings = await SiteSetting.findOneAndUpdate(
      { _id: "site_settings" },
      { $set: update },
      { upsert: true, returnDocument: 'after' }
    );

    let logDetails = "Updated site settings";
    const detailParts = [];
    if (typeof enabled === "boolean") {
      detailParts.push(`gateEnabled: ${enabled}`);
    }
    if (typeof threeJsBackgroundEnabled === "boolean") {
      detailParts.push(`threeJsBackgroundEnabled: ${threeJsBackgroundEnabled}`);
    }
    if (typeof youtubeDirectEnabled === "boolean") {
      detailParts.push(`youtubeDirectEnabled: ${youtubeDirectEnabled}`);
    }
    if (fontFamily !== undefined) {
      detailParts.push(`fontFamily: ${fontFamily}`);
    }
    if (password && password.trim().length > 0) {
      detailParts.push("accessPassword: updated");
    }
    if (detailParts.length > 0) {
      logDetails += ` (${detailParts.join(", ")})`;
    }

    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: "UPDATE_SITE_SETTINGS",
      details: logDetails,
      req,
    });

    res.json({
      message: "Site settings updated",
      gateEnabled: settings.gateEnabled,
      hasPassword: !!settings.gatePasswordHash,
      threeJsBackgroundEnabled: settings.threeJsBackgroundEnabled !== false,
      fontFamily: settings.fontFamily || "Inter",
      youtubeDirectEnabled: settings.youtubeDirectEnabled !== false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN — get activity logs
export const getActivityLogs = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 50, 1);
    const skip = (page - 1) * limit;

    const { search, actionType } = req.query;
    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { userName: searchRegex },
        { userEmail: searchRegex },
        { details: searchRegex },
        { action: searchRegex }
      ];
    }

    if (actionType && actionType !== "ALL") {
      if (actionType === "AUTH") {
        query.action = { $in: ["LOGIN", "REGISTER", "CHANGE_PASSWORD", "UPDATE_PROFILE"] };
      } else if (actionType === "CONTENT") {
        query.action = {
          $in: [
            "CREATE_VIDEO", "UPDATE_VIDEO", "DELETE_VIDEO",
            "CREATE_YOUTUBE", "UPDATE_YOUTUBE", "DELETE_YOUTUBE",
            "CREATE_DOCUMENT", "UPDATE_DOCUMENT", "DELETE_DOCUMENT",
            "BULK_IMPORT_VIDEOS", "BULK_IMPORT_YOUTUBE_VIDEOS", "BULK_IMPORT_DOCUMENTS",
            "DELETE_ALL_VIDEOS", "DELETE_ALL_YOUTUBE_VIDEOS", "DELETE_ALL_DOCUMENTS"
          ]
        };
      } else if (actionType === "SYSTEM") {
        query.action = { $in: ["UPDATE_SITE_SETTINGS", "CHANGE_GATE_SETTINGS", "CLEAR_LOGS"] };
      } else if (actionType === "CONSUMPTION") {
        query.action = { $in: ["WATCH_DRIVE_VIDEO", "WATCH_YOUTUBE_VIDEO", "VIEW_DRIVE_DOCUMENT"] };
      }
    }

    const logs = await Log.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Log.countDocuments(query);

    res.json({
      logs,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN — clear activity logs (all or older than X days)
export const clearActivityLogs = async (req, res) => {
  try {
    const { clearAll, olderThanDays } = req.body;

    let query = {};
    let message = "Activity logs cleared";

    if (clearAll) {
      query = {};
      message = "All activity logs cleared successfully";
    } else if (Number.isFinite(olderThanDays) && olderThanDays > 0) {
      const cutOffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      query = { createdAt: { $lt: cutOffDate } };
      message = `Activity logs older than ${olderThanDays} days cleared successfully`;
    } else {
      return res.status(400).json({ message: "Invalid clear options" });
    }

    const result = await Log.deleteMany(query);

    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: "CLEAR_LOGS",
      details: `${message} (Deleted ${result.deletedCount} entries)`,
      req,
    });

    res.json({
      message,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
