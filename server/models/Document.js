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

const documentSchema = new mongoose.Schema(
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
      default: "PDFs",
    },

    subheading: {
      type: String,
      default: "PDF",
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
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ driveFileId: 1 });
documentSchema.index({ createdAt: -1 });

const Document = mongoose.model("Document", documentSchema);

export default Document;
