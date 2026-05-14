import Video from "../models/Video.js";

import driveService from "../config/googleDrive.js";

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
      driveFileId: fileId,
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

    // Get file metadata
    const metadata =
      await driveService.files.get({
        fileId,
        fields: "size,mimeType,name",
      });

    const fileSize = Number(
      metadata.data.size
    );

    const range = req.headers.range;

    const CHUNK_SIZE = 10 ** 6;

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
      res.writeHead(200, {
        "Accept-Ranges": "bytes",
        "Content-Length": fileSize,
        "Content-Type": metadata.data.mimeType,
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
      : requestedStart + CHUNK_SIZE;

    const start = Math.min(
      requestedStart,
      fileSize - 1
    );

    const end = Math.min(
      requestedEnd,
      start + CHUNK_SIZE,
      fileSize - 1
    );

    const contentLength =
      end - start + 1;


    // VIDEO HEADERS
    res.writeHead(206, {

      "Content-Range":
        `bytes ${start}-${end}/${fileSize}`,

      "Accept-Ranges":
        "bytes",

      "Content-Length":
        contentLength,

      "Content-Type":
        metadata.data.mimeType,
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
      driveFileId,
      thumbnail,
      allowedEmails,
    } = req.body;

    const video = await Video.create({
      title,
      description,
      driveFileId,
      thumbnail,
      allowedEmails:
        normalizeEmailList(allowedEmails),
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
      driveFileId,
      thumbnail,
      allowedEmails,
    } = req.body;

    const video = await Video.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        driveFileId,
        thumbnail,
        allowedEmails:
          normalizeEmailList(allowedEmails),
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
