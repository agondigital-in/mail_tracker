import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const openEventSchema = new Schema(
  {
    emailId: {
      type: Schema.Types.ObjectId,
      ref: "Email",
      required: true,
      index: true,
    },
    trackingId: { type: String, required: true, index: true },
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
    isGmailProxy: { type: Boolean, default: false },
    isUnique: { type: Boolean, default: false },
    timestamp: { type: Date, required: true },
  },
  {
    timestamps: true,
    collection: "open_events",
  },
);

const OpenEvent = models.OpenEvent || model("OpenEvent", openEventSchema);

export { OpenEvent };
