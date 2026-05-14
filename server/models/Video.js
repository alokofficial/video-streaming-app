import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    driveFileId: {
      type: String,
      required: true,
    },

    thumbnail: {
      type: String,
    },

    allowedEmails: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Video = mongoose.model(
  "Video",
  videoSchema
);

export default Video;
