import mongoose from "mongoose";

const recipientSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      ref: "User",
      required: true,
      index: true,
    },
    recipientListId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecipientList",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    unsubscribed: {
      type: Boolean,
      default: false,
      index: true,
    },
    unsubscribedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Compound unique index to prevent duplicate emails in the same list
// This allows: Same email in different lists (even for same user)
// Example: test@email.com can be in List 1 AND List 2
recipientSchema.index({ recipientListId: 1, email: 1 }, { unique: true });

export const Recipient =
  mongoose.models.Recipient || mongoose.model("Recipient", recipientSchema);
