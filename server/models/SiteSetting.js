import mongoose from "mongoose";

const siteSettingSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: "site_settings",
    },
    gateEnabled: {
      type: Boolean,
      default: false,
    },
    gatePasswordHash: {
      type: String,
      default: null,
    },
  },
  {
    _id: false,
    timestamps: true,
  }
);

const SiteSetting = mongoose.model("SiteSetting", siteSettingSchema);

export default SiteSetting;
