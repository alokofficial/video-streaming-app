import express from "express";

import {
  getYoutubeVideos,
  addYoutubeVideo,
  bulkAddYoutubeVideos,
  updateYoutubeVideo,
  deleteYoutubeVideo,
  deleteAllYoutubeVideos,
  embedYoutubeVideo,
  exportYoutubeVideos,
} from "../controllers/youtubeController.js";
import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getYoutubeVideos);

router.get(
  "/export",
  protect,
  authorizeRoles("admin"),
  exportYoutubeVideos
);

router.post(
  "/bulk",
  protect,
  authorizeRoles("admin"),
  bulkAddYoutubeVideos
);

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
  "/all",
  protect,
  authorizeRoles("admin"),
  deleteAllYoutubeVideos
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
