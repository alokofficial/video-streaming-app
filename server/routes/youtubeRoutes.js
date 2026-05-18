import express from "express";

import {
  getYoutubeVideos,
  addYoutubeVideo,
  updateYoutubeVideo,
  deleteYoutubeVideo,
  embedYoutubeVideo,
} from "../controllers/youtubeController.js";
import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getYoutubeVideos);

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  addYoutubeVideo
);

router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateYoutubeVideo
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteYoutubeVideo
);

// This endpoint serves HTML with the iframe
router.get(
  "/embed/:id",
  protect,
  embedYoutubeVideo
);

export default router;
