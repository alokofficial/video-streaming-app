import mongoose from "mongoose";

const countLetters = (value = "") => {
  return String(value).trim().length;
};

const maxLettersValidator = (maxLetters) => ({
  validator(value) {
    return countLetters(value) <= maxLetters;
  },
  message: `Maximum ${maxLetters} characters allowed`,
});

const noteEntrySchema = new mongoose.Schema(
  {
    subheading: {
      type: String,
      required: [true, "Subheading is required"],
      validate: maxLettersValidator(150),
    },
    content: {
      type: String,
      default: "",
      validate: maxLettersValidator(1000),
    },
  },
  {
    timestamps: true,
  }
);

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Page title is required"],
      validate: maxLettersValidator(100),
    },
    notes: {
      type: [noteEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

noteSchema.index({ user: 1, createdAt: -1 });

const Note = mongoose.model("Note", noteSchema);

export default Note;
