import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const emailSchema = new Schema(
  {
    userId: { type: String, ref: "User", required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign" },
    recipientId: { type: Schema.Types.ObjectId, ref: "Recipient", index: true },
    trackingId: { type: String, required: true, unique: true, index: true },
    to: { type: String, required: true },
    from: { type: String, required: true },
    subject: { type: String, required: true },
    htmlContent: { type: String, required: true },
    status: {
      type: String,
      enum: ["sent", "failed", "bounced"],
      default: "sent",
      index: true,
    },
    error: { type: String },
    smtpServerId: { type: Schema.Types.ObjectId, ref: "SmtpServer" },
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

// Compound index to prevent duplicate sends and fast lookups
emailSchema.index({ campaignId: 1, recipientId: 1 }, { unique: true, sparse: true });
emailSchema.index({ campaignId: 1, status: 1 });
emailSchema.index({ userId: 1, sentAt: -1 });

const Email = models.Email || model("Email", emailSchema);

export { Email };
