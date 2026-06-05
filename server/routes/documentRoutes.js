import express from "express";
import {
  getDocuments,
  viewDocument,
  addDocument,
  bulkAddDocuments,
  updateDocument,
  deleteDocument,
  deleteAllDocuments,
} from "../controllers/documentController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getDocuments);

router.post("/bulk", protect, authorizeRoles("admin"), bulkAddDocuments);

router.post("/", protect, authorizeRoles("admin"), addDocument);

router.put("/:id", protect, authorizeRoles("admin"), updateDocument);

router.delete("/all", protect, authorizeRoles("admin"), deleteAllDocuments);

router.delete("/:id", protect, authorizeRoles("admin"), deleteDocument);

router.get("/view/:fileId", protect, viewDocument);

export default router;
