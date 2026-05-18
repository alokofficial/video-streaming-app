import YoutubeVideo from "../models/YoutubeVideo.js";
import { encrypt, decrypt } from "../utils/encryption.js";

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

    const encryptedVideoId = encrypt(videoId);

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
      updateData.encryptedVideoId = encrypt(videoId);
    }

    const video = await YoutubeVideo.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: 'after', runValidators: true }
    );

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

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
