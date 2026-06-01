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

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      validate: maxLettersValidator(150),
    },

    category: {
      type: String,
      default: "General",
    },

    subheading: {
      type: String,
      default: "Featured",
    },

    driveFileId: {
      type: String,
      required: true,
      validate: maxLettersValidator(100),
    },

    thumbnail: {
      type: String,
    },

    allowedEmails: {
      type: [String],
      default: [],
    },

    qualities: {
      type: [
        {
          label: {
            type: String,
            required: true,
          },
          driveFileId: {
            type: String,
            required: true,
            validate: maxLettersValidator(100),
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.index({ driveFileId: 1 });
videoSchema.index({ createdAt: -1 });

const Video = mongoose.model(
  "Video",
  videoSchema
);

export default Video;
