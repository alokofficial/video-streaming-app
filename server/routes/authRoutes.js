import express from "express";

import {
  registerUser,
  loginUser,
  changePassword,
  getUsers,
  createUser,
  deleteUser,
  getHeadingOrder,
  updateHeadingOrder,
  updateProfile,
  getSiteGateStatus,
  verifySiteGate,
  getSiteGateSettings,
  setSiteGate,
  getActivityLogs,
  clearActivityLogs,
  adminChangePassword,
} from "../controllers/authController.js";
import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.get(
  "/preferences/heading-order",
  protect,
  getHeadingOrder
);
router.put(
  "/preferences/heading-order",
  protect,
  updateHeadingOrder
);
router.get(
  "/users",
  protect,
  authorizeRoles("admin"),
  getUsers
);
router.post(
  "/users",
  protect,
  authorizeRoles("admin"),
  createUser
);
router.delete(
  "/users/:id",
  protect,
  authorizeRoles("admin"),
  deleteUser
);
router.put(
  "/users/:id/password",
  protect,
  authorizeRoles("admin"),
  adminChangePassword
);

// Site Gate — public
router.get("/site-gate", getSiteGateStatus);
router.post("/site-gate/verify", verifySiteGate);

// Site Gate — admin only
router.get(
  "/site-gate/settings",
  protect,
  authorizeRoles("admin"),
  getSiteGateSettings
);
router.put(
  "/site-gate",
  protect,
  authorizeRoles("admin"),
  setSiteGate
);

router.get(
  "/logs",
  protect,
  authorizeRoles("admin"),
  getActivityLogs
);

router.delete(
  "/logs",
  protect,
  authorizeRoles("admin"),
  clearActivityLogs
);

export default router;
