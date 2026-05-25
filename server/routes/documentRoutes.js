import express from "express";
import {
  getDocuments,
  viewDocument,
  addDocument,
  updateDocument,
  deleteDocument,
} from "../controllers/documentController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getDocuments);

router.post("/", protect, authorizeRoles("admin"), addDocument);

router.put("/:id", protect, authorizeRoles("admin"), updateDocument);

router.delete("/:id", protect, authorizeRoles("admin"), deleteDocument);

router.get("/view/:fileId", protect, viewDocument);

export default router;
