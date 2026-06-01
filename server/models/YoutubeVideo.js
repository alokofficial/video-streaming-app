import mongoose from "mongoose";

const countLetters = (value = "") => {
  return String(value).trim().length;
};

const maxLettersValidator = (maxLetters) => ({
  validator(value) {
    return countLetters(value) <= maxLetters;
  },
  message: `Maximum ${maxLetters} letters allowed`,
});

const youtubeVideoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    encryptedVideoId: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "YouTube",
    },

    subheading: {
      type: String,
      default: "Protected YouTube Videos",
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

youtubeVideoSchema.index({ createdAt: -1 });

const YoutubeVideo = mongoose.model(
  "YoutubeVideo",
  youtubeVideoSchema
);

export default YoutubeVideo;
