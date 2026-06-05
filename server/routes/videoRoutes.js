import express from "express";

import {
  getVideos,
  streamVideo,
  addVideo,
  bulkAddVideos,
  updateVideo,
  deleteVideo,
  deleteAllVideos,
} from "../controllers/videoController.js";
import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getVideos);

router.post(
  "/bulk",
  protect,
  authorizeRoles("admin"),
  bulkAddVideos
);

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  addVideo
);

router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateVideo
);

router.delete(
  "/all",
  protect,
  authorizeRoles("admin"),
  deleteAllVideos
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteVideo
);

router.get(
  "/stream/:fileId",
  protect,
  streamVideo
);

export default router;
