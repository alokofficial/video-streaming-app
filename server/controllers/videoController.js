import Video from "../models/Video.js";

import driveService from "../config/googleDrive.js";

const metadataCache = new Map();
const METADATA_CACHE_MS = 5 * 60 * 1000;
const STREAM_CHUNK_SIZE = 8 * 1024 * 1024;

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

const normalizeQualities = (qualities) => {
  const qualityList = Array.isArray(qualities)
    ? qualities
    : String(qualities || "")
        .split("\n")
        .map((line) => {
          const [label, ...fileIdParts] =
            line.split(":");

          return {
            label,
            driveFileId:
              fileIdParts.join(":"),
          };
        });

  return qualityList
    .map((quality) => ({
      label: String(quality.label || "").trim(),
      driveFileId: String(
        quality.driveFileId || ""
      ).trim(),
    }))
    .filter(
      (quality) =>
        quality.label && quality.driveFileId
    );
};

const canViewVideo = (user, video) => {
  if (user.role === "admin") {
    return true;
  }

  const allowedEmails = video.allowedEmails || [];

  if (allowedEmails.length === 0) {
    return true;
  }

  return allowedEmails.includes(
    user.email.toLowerCase()
  );
};

const isDownloadLikeRequest = (req) => {
  const fetchDest = req.headers["sec-fetch-dest"];
  const fetchMode = req.headers["sec-fetch-mode"];

  return (
    fetchDest === "document" ||
    fetchMode === "navigate"
  );
};


// GET ALL VIDEOS
export const getVideos = async (
  req,
  res
) => {

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

    const videos = await Video.find(query).sort({
      createdAt: -1,
    });

    res.json(videos);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
};


// STREAM VIDEO
export const streamVideo = async (
  req,
  res
) => {

  try {

    const { fileId } = req.params;

    const video = await Video.findOne({
      $or: [
        {
          driveFileId: fileId,
        },
        {
          "qualities.driveFileId": fileId,
        },
      ],
    });

    if (!video) {
      return res.status(404).json({
        message: "Video not found",
      });
    }

    if (!canViewVideo(req.user, video)) {
      return res.status(403).json({
        message: "You do not have access to this video",
      });
    }

    const metadata =
      await getCachedFileMetadata(fileId);

    const fileSize = Number(
      metadata.size
    );

    const range = req.headers.range;
    const sharedVideoHeaders = {
      "Accept-Ranges": "bytes",
      "Content-Type": metadata.mimeType,
      "Content-Disposition": "inline",
      "Cache-Control":
        "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
    };

    // IMPORTANT CORS HEADERS
    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    res.setHeader(
      "Access-Control-Allow-Headers",
      "Range"
    );

    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Range, Accept-Ranges, Content-Length"
    );

    if (!range) {
      if (isDownloadLikeRequest(req)) {
        return res.status(403).json({
          message: "Download is not allowed",
        });
      }

      res.writeHead(200, {
        ...sharedVideoHeaders,
        "Content-Length": fileSize,
      });

      const response =
        await driveService.files.get(
          {
            fileId,
            alt: "media",
          },
          {
            responseType: "stream",
          }
        );

      response.data.pipe(res);
      return;
    }

    const rangeMatch = range.match(
      /bytes=(\d*)-(\d*)/
    );

    if (!rangeMatch) {
      return res.status(416).send(
        "Invalid Range header"
      );
    }

    const requestedStart = rangeMatch[1]
      ? Number(rangeMatch[1])
      : 0;
    const requestedEnd = rangeMatch[2]
      ? Number(rangeMatch[2])
      : requestedStart + STREAM_CHUNK_SIZE - 1;

    const start = Math.min(
      requestedStart,
      fileSize - 1
    );

    const end = Math.min(
      requestedEnd,
      start + STREAM_CHUNK_SIZE - 1,
      fileSize - 1
    );

    const contentLength =
      end - start + 1;


    // VIDEO HEADERS
    res.writeHead(206, {
      ...sharedVideoHeaders,

      "Content-Range":
        `bytes ${start}-${end}/${fileSize}`,

      "Content-Length":
        contentLength,
    });


    // Stream from Google Drive
    const response =
      await driveService.files.get(
        {
          fileId,
          alt: "media",
        },
        {
          responseType: "stream",

          headers: {
            Range: `bytes=${start}-${end}`,
          },
        }
      );

    response.data.pipe(res);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Streaming Failed",
    });
  }
};


// ADD VIDEO
export const addVideo = async (
  req,
  res
) => {

  try {

    const {
      title,
      description,
      category,
      subheading,
      driveFileId,
      thumbnail,
      allowedEmails,
      qualities,
    } = req.body;

    const video = await Video.create({
      title,
      description,
      category:
        String(category || "General").trim() ||
        "General",
      subheading:
        String(subheading || "Featured").trim() ||
        "Featured",
      driveFileId,
      thumbnail,
      allowedEmails:
        normalizeEmailList(allowedEmails),
      qualities: normalizeQualities(qualities),
    });

    res.status(201).json(video);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};


// UPDATE VIDEO
export const updateVideo = async (
  req,
  res
) => {

  try {

    const {
      title,
      description,
      category,
      subheading,
      driveFileId,
      thumbnail,
      allowedEmails,
      qualities,
    } = req.body;

    const video = await Video.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        category:
          String(category || "General").trim() ||
          "General",
        subheading:
          String(subheading || "Featured").trim() ||
          "Featured",
        driveFileId,
        thumbnail,
        allowedEmails:
          normalizeEmailList(allowedEmails),
        qualities: normalizeQualities(qualities),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!video) {
      return res.status(404).json({
        message: "Video not found",
      });
    }

    res.json(video);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};


// DELETE VIDEO
export const deleteVideo = async (
  req,
  res
) => {

  try {

    const video = await Video.findByIdAndDelete(
      req.params.id
    );

    if (!video) {
      return res.status(404).json({
        message: "Video not found",
      });
    }

    res.json({
      message: "Video deleted successfully",
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};
