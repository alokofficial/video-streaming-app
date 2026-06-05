import YoutubeVideo from "../models/YoutubeVideo.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import { logActivity } from "../utils/logger.js";

const normalizeEmailList = (emails) => {
  const emailList = Array.isArray(emails)
    ? emails
    : String(emails || "").split(/[,\n]/);

  return [
    ...new Set(
      emailList
        .map((email) => email.trim().toLowerCase())
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

  return allowedEmails.includes(user.email.toLowerCase());
};

export const getYoutubeVideos = async (req, res) => {
  try {
    const query =
      req.user.role === "admin"
        ? {}
        : {
            $or: [
              { allowedEmails: { $exists: false } },
              { allowedEmails: { $size: 0 } },
              { allowedEmails: req.user.email.toLowerCase() },
            ],
          };

    // Do NOT return the encryptedVideoId in the standard list response
    const videos = await YoutubeVideo.find(query).select('-encryptedVideoId').sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addYoutubeVideo = async (req, res) => {
  try {
    const {
      title,
      videoId,
      category,
      subheading,
      thumbnail,
      allowedEmails,
    } = req.body;

    if (!videoId) {
      return res.status(400).json({ message: "YouTube Video ID is required" });
    }

    const cleanVideoId = String(videoId).trim();
    const existingVideos = await YoutubeVideo.find({});
    const isDuplicate = existingVideos.some((v) => {
      try {
        return decrypt(v.encryptedVideoId) === cleanVideoId;
      } catch {
        return false;
      }
    });

    if (isDuplicate) {
      return res.status(400).json({
        message: `A YouTube video with ID '${cleanVideoId}' already exists.`,
      });
    }

    const encryptedVideoId = encrypt(cleanVideoId);

    const video = await YoutubeVideo.create({
      title,
      encryptedVideoId,
      category:
        String(category || "YouTube").trim() ||
        "YouTube",
      subheading:
        String(
          subheading || "Protected YouTube Videos"
        ).trim() || "Protected YouTube Videos",
      thumbnail,
      allowedEmails: normalizeEmailList(allowedEmails),
    });

    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: "CREATE_YOUTUBE",
      details: `Added new YouTube video: "${video.title}"`,
      req,
    });

    res.status(201).json({ _id: video._id, title: video.title });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const updateYoutubeVideo = async (req, res) => {
  try {
    const {
      title,
      videoId,
      category,
      subheading,
      thumbnail,
      allowedEmails,
    } = req.body;
    
    const updateData = {
      title,
      category:
        String(category || "YouTube").trim() ||
        "YouTube",
      subheading:
        String(
          subheading || "Protected YouTube Videos"
        ).trim() || "Protected YouTube Videos",
      thumbnail,
      allowedEmails: normalizeEmailList(allowedEmails),
    };

    if (videoId) {
      const cleanVideoId = String(videoId).trim();
      const existingVideos = await YoutubeVideo.find({ _id: { $ne: req.params.id } });
      const isDuplicate = existingVideos.some((v) => {
        try {
          return decrypt(v.encryptedVideoId) === cleanVideoId;
        } catch {
          return false;
        }
      });

      if (isDuplicate) {
        return res.status(400).json({
          message: `A YouTube video with ID '${cleanVideoId}' already exists.`,
        });
      }
      updateData.encryptedVideoId = encrypt(cleanVideoId);
    }

    const video = await YoutubeVideo.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: 'after', runValidators: true }
    );

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: "UPDATE_YOUTUBE",
      details: `Updated YouTube video: "${video.title}"`,
      req,
    });

    res.json({ _id: video._id, title: video.title });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteYoutubeVideo = async (req, res) => {
  try {
    const video = await YoutubeVideo.findByIdAndDelete(req.params.id);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: "DELETE_YOUTUBE",
      details: `Deleted YouTube video: "${video.title}"`,
      req,
    });

    res.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const embedYoutubeVideo = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Auth is already handled by protect middleware which works with query tokens
    const video = await YoutubeVideo.findById(id);

    if (!video) {
      return res.status(404).send("Video not found");
    }

    if (!canViewVideo(req.user, video)) {
      return res.status(403).send("You do not have access to this video");
    }

    const videoId = decrypt(video.encryptedVideoId);
    
    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: "WATCH_YOUTUBE_VIDEO",
      details: `Requested embed for YouTube video: ${video.title} (Video ID: ${videoId})`,
      req,
    });

    // We send an HTML document containing the iframe directly.
    // This hides the actual YouTube URL from the React frontend API responses.
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${video.title}</title>
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
          iframe { width: 100%; height: 100%; border: none; }
        </style>
      </head>
      <body>
        <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>
      </body>
      </html>
    `;
    res.send(html);

  } catch (error) {
    console.log(error);
    res.status(500).send("Error embedding video");
  }
};


// BULK ADD YOUTUBE VIDEOS
export const bulkAddYoutubeVideos = async (req, res) => {
  try {
    const { videos } = req.body;

    if (!Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({
        message: "Payload 'videos' must be a non-empty array",
      });
    }

    const existingVideos = await YoutubeVideo.find({});
    const existingVideoIds = new Set(
      existingVideos.map((v) => {
        try {
          return decrypt(v.encryptedVideoId);
        } catch {
          return null;
        }
      }).filter(Boolean)
    );
    const processedVideoIds = new Set();

    const processedVideos = [];

    for (const item of videos) {
      const {
        title,
        videoId,
        category,
        subheading,
        thumbnail,
        allowedEmails,
      } = item;

      // Validate required fields
      if (!title || !String(title).trim()) {
        return res.status(400).json({
          message: "All videos must have a title",
        });
      }

      if (!videoId || !String(videoId).trim()) {
        return res.status(400).json({
          message: `Video '${title}' must have a YouTube Video ID`,
        });
      }

      const cleanVideoId = String(videoId).trim();

      if (existingVideoIds.has(cleanVideoId)) {
        return res.status(400).json({
          message: `YouTube video '${title}' cannot be imported because Video ID '${cleanVideoId}' already exists in the library.`,
        });
      }

      if (processedVideoIds.has(cleanVideoId)) {
        return res.status(400).json({
          message: `Duplicate YouTube Video ID '${cleanVideoId}' found in import spreadsheet for video '${title}'.`,
        });
      }

      processedVideoIds.add(cleanVideoId);



      const encryptedVideoId = encrypt(String(videoId).trim());

      processedVideos.push({
        title: String(title).trim(),
        encryptedVideoId,
        category: String(category || "YouTube").trim() || "YouTube",
        subheading: String(subheading || "Protected YouTube Videos").trim() || "Protected YouTube Videos",
        thumbnail: thumbnail ? String(thumbnail).trim() : undefined,
        allowedEmails: normalizeEmailList(allowedEmails),
      });
    }

    const createdVideos = await YoutubeVideo.insertMany(processedVideos);

    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: "BULK_IMPORT_YOUTUBE_VIDEOS",
      details: `Bulk imported ${createdVideos.length} YouTube videos`,
      req,
    });

    res.status(201).json({
      message: `Successfully imported ${createdVideos.length} YouTube videos`,
      videos: createdVideos.map((v) => ({ _id: v._id, title: v.title })),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
    });
  }
};


// EXPORT YOUTUBE VIDEOS (ADMIN ONLY - WITH DECRYPTION)
export const exportYoutubeVideos = async (req, res) => {
  try {
    const videos = await YoutubeVideo.find({}).sort({ createdAt: -1 });

    const decryptedVideos = videos.map((video) => {
      let videoId = "";
      try {
        videoId = decrypt(video.encryptedVideoId);
      } catch (err) {
        console.error("Decryption failed for video: ", video._id, err);
      }

      return {
        _id: video._id,
        title: video.title,
        videoId,
        category: video.category,
        subheading: video.subheading,
        thumbnail: video.thumbnail,
        allowedEmails: video.allowedEmails,
        createdAt: video.createdAt,
      };
    });

    res.json(decryptedVideos);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// DELETE ALL YOUTUBE VIDEOS (ADMIN ONLY)
export const deleteAllYoutubeVideos = async (req, res) => {
  try {
    const result = await YoutubeVideo.deleteMany({});

    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: "DELETE_ALL_YOUTUBE_VIDEOS",
      details: `Deleted all YouTube videos (${result.deletedCount} items)`,
      req,
    });

    res.json({
      message: `Successfully deleted all YouTube videos (${result.deletedCount} items)`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
    });
  }
};
