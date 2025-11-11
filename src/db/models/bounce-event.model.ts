import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const bounceEventSchema = new Schema(
  {
    emailId: {
      type: Schema.Types.ObjectId,
      ref: "Email",
      required: true,
      index: true,
    },
    trackingId: { type: String, required: true, index: true },
    recipientEmail: { type: String, required: true },
    bounceType: { type: String, enum: ["hard", "soft"], required: true },
    reason: { type: String, required: true },
    timestamp: { type: Date, required: true },
  },
  {
    timestamps: true,
    collection: "bounce_events",
  },
);

const BounceEvent =
  models.BounceEvent || model("BounceEvent", bounceEventSchema);

export { BounceEvent };
