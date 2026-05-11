import express from "express";

import {
  getVideos,
  streamVideo,
  addVideo,
} from "../controllers/videoController.js";

const router = express.Router();

router.get("/", getVideos);

router.post("/", addVideo);

router.get(
  "/stream/:fileId",
  streamVideo
);

export default router;