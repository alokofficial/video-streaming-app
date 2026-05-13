import Video from "../models/Video.js";

import driveService from "../config/googleDrive.js";


// GET ALL VIDEOS
export const getVideos = async (
  req,
  res
) => {

  try {

    const videos = await Video.find();

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

    if (!range) {

      return res.status(400).send(
        "Requires Range header"
      );
    }

    const CHUNK_SIZE = 10 ** 6;

    const start = Number(
      range.replace(/\D/g, "")
    );

    const end = Math.min(
      start + CHUNK_SIZE,
      fileSize - 1
    );

    const contentLength =
      end - start + 1;


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
    } = req.body;

    const video = await Video.create({
      title,
      description,
      driveFileId,
      thumbnail,
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
    } = req.body;

    const video = await Video.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        driveFileId,
        thumbnail,
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
