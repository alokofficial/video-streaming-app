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
} from "../controllers/authController.js";
import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
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

export default router;
