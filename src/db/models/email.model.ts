import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const emailSchema = new Schema(
  {
    userId: { type: String, ref: "User", required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", index: true },
    trackingId: { type: String, required: true, unique: true, index: true },
    to: { type: String, required: true },
    from: { type: String, required: true },
    subject: { type: String, required: true },
    htmlContent: { type: String, required: true },
    sentAt: { type: Date, required: true },
    firstOpenAt: { type: Date },
    firstClickAt: { type: Date },
    bounced: { type: Boolean, default: false },
    bounceReason: { type: String },
    bounceType: { type: String, enum: ["hard", "soft"] },
    uniqueOpens: { type: Number, default: 0 },
    uniqueClicks: { type: Number, default: 0 },
    totalOpens: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: "emails",
  },
);

const Email = models.Email || model("Email", emailSchema);

export { Email };
