import express from "express";
import {
  getNotePages,
  createNotePage,
  updateNotePage,
  deleteNotePage,
  addNoteEntry,
  updateNoteEntry,
  deleteNoteEntry,
} from "../controllers/noteController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Note pages
router.get("/", protect, getNotePages);
router.post("/", protect, createNotePage);
router.put("/:id", protect, updateNotePage);
router.delete("/:id", protect, deleteNotePage);

// Note entries (subheadings within a page)
router.post("/:id/entries", protect, addNoteEntry);
router.put("/:id/entries/:entryId", protect, updateNoteEntry);
router.delete("/:id/entries/:entryId", protect, deleteNoteEntry);

export default router;
