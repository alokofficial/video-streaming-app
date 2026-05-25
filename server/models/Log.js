import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    userName: {
      type: String,
      default: "Anonymous",
    },
    userEmail: {
      type: String,
      default: "N/A",
    },
    action: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      default: "unknown",
    },
    userAgent: {
      type: String,
      default: "unknown",
    },
  },
  {
    timestamps: true,
  }
);

// High-performance index for fast sorted retrieval
logSchema.index({ createdAt: -1 });

const Log = mongoose.model("Log", logSchema);

export default Log;
