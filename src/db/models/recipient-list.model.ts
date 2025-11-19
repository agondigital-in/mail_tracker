import mongoose from "mongoose";

const recipientListSchema = new mongoose.Schema(
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
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export const RecipientList =
  mongoose.models.RecipientList ||
  mongoose.model("RecipientList", recipientListSchema);
