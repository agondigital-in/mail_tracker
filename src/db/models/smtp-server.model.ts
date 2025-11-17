import mongoose from "mongoose";

const smtpServerSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    host: {
      type: String,
      required: true,
    },
    port: {
      type: Number,
      required: true,
    },
    secure: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    fromEmail: {
      type: String,
      required: true,
    },
    fromName: {
      type: String,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Ensure only one default SMTP per user
smtpServerSchema.index({ userId: 1, isDefault: 1 });

export const SmtpServer =
  mongoose.models.SmtpServer || mongoose.model("SmtpServer", smtpServerSchema);
