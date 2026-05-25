import User from "../models/User.js";
import Video from "../models/Video.js";
import SiteSetting from "../models/SiteSetting.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  ensureUserRole,
  resolveRoleForEmail,
} from "../utils/roles.js";


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

    const totalVideos = videos.length;

    const usersWithAccessCount = users.map((user) => {
      const email = user.email.toLowerCase();
      const accessibleVideos =
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

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        accessibleVideos,
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
        accessibleVideos: 0,
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
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN — set/update gate (toggle, change password)
export const setSiteGate = async (req, res) => {
  try {
    const { enabled, password, threeJsBackgroundEnabled } = req.body;

    const update = {};

    if (typeof enabled === "boolean") {
      update.gateEnabled = enabled;
    }

    if (typeof threeJsBackgroundEnabled === "boolean") {
      update.threeJsBackgroundEnabled = threeJsBackgroundEnabled;
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

    res.json({
      message: "Site settings updated",
      gateEnabled: settings.gateEnabled,
      hasPassword: !!settings.gatePasswordHash,
      threeJsBackgroundEnabled: settings.threeJsBackgroundEnabled !== false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
