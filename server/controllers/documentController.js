import Document from "../models/Document.js";
import driveService from "../config/googleDrive.js";
import { logActivity } from "../utils/logger.js";

const metadataCache = new Map();
const METADATA_CACHE_MS = 5 * 60 * 1000;

const getCachedFileMetadata = async (fileId) => {
  const cached = metadataCache.get(fileId);

  if (
    cached &&
    Date.now() - cached.cachedAt < METADATA_CACHE_MS
  ) {
    return cached.data;
  }

  const metadata = await driveService.files.get({
    fileId,
    fields: "size,mimeType,name",
  });

  metadataCache.set(fileId, {
    cachedAt: Date.now(),
    data: metadata.data,
  });

  return metadata.data;
};

const normalizeEmailList = (emails) => {
  const emailList = Array.isArray(emails)
    ? emails
    : String(emails || "").split(/[,\n]/);

  return [
    ...new Set(
      emailList
        .map((email) =>
          email.trim().toLowerCase()
        )
        .filter(Boolean)
    ),
  ];
};

const canViewDocument = (user, doc) => {
  if (user.role === "admin") {
    return true;
  }

  const allowedEmails = doc.allowedEmails || [];

  if (allowedEmails.length === 0) {
    return true;
  }

  return allowedEmails.includes(
    user.email.toLowerCase()
  );
};

const isDownloadLikeRequest = (req) => {
  const fetchDest = req.headers["sec-fetch-dest"];
  return fetchDest === "document";
};

// GET ALL DOCUMENTS
export const getDocuments = async (req, res) => {
  try {
    const query =
      req.user.role === "admin"
        ? {}
        : {
            $or: [
              {
                allowedEmails: {
                  $exists: false,
                },
              },
              {
                allowedEmails: {
                  $size: 0,
                },
              },
              {
                allowedEmails:
                  req.user.email.toLowerCase(),
              },
            ],
          };

    const documents = await Document.find(query).sort({
      createdAt: -1,
    });

    res.json(documents);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// VIEW / STREAM DOCUMENT
export const viewDocument = async (req, res) => {
  try {
    const { fileId } = req.params;

    const doc = await Document.findOne({ driveFileId: fileId });

    if (!doc) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    if (!canViewDocument(req.user, doc)) {
      return res.status(403).json({
        message: "You do not have access to this document",
      });
    }

    if (req.user.role !== "admin" && isDownloadLikeRequest(req)) {
      return res.status(403).json({
        message: "Download is not allowed",
      });
    }

    // Log PDF view activity
    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: "VIEW_DRIVE_DOCUMENT",
      details: `Started viewing document: ${doc.title} (File ID: ${fileId})`,
      req,
    });

    const response = await driveService.files.get(
      {
        fileId,
        alt: "media",
      },
      {
        responseType: "stream",
      }
    );

    // Set headers for secure inline PDF display
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");

    response.data.on("error", (error) => {
      console.error(error);
      if (!res.headersSent) {
        res.status(500).json({
          message: "Document streaming failed",
        });
      } else {
        res.destroy(error);
      }
    });

    res.on("close", () => {
      response.data.destroy();
    });

    response.data.pipe(res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Streaming Failed",
      });
    }
  }
};

// ADD DOCUMENT
export const addDocument = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subheading,
      driveFileId,
      thumbnail,
      allowedEmails,
    } = req.body;

    const doc = await Document.create({
      title,
      description,
      category: String(category || "PDFs").trim() || "PDFs",
      subheading: String(subheading || "PDF").trim() || "PDF",
      driveFileId,
      thumbnail,
      allowedEmails: normalizeEmailList(allowedEmails),
    });

    res.status(201).json(doc);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// UPDATE DOCUMENT
export const updateDocument = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subheading,
      driveFileId,
      thumbnail,
      allowedEmails,
    } = req.body;

    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        category: String(category || "PDFs").trim() || "PDFs",
        subheading: String(subheading || "PDF").trim() || "PDF",
        driveFileId,
        thumbnail,
        allowedEmails: normalizeEmailList(allowedEmails),
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!doc) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    res.json(doc);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// DELETE DOCUMENT
export const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findByIdAndDelete(req.params.id);

    if (!doc) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    res.json({
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message,
    });
  }
};
