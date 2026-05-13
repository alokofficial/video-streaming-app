import express from "express";

import {
  getVideos,
  streamVideo,
  addVideo,
  updateVideo,
  deleteVideo,
} from "../controllers/videoController.js";
import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getVideos);

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
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteVideo
);

router.get(
  "/stream/:fileId",
  streamVideo
);

export default router;
