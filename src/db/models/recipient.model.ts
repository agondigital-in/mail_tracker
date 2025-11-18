import mongoose from "mongoose";

const recipientSchema = new mongoose.Schema(
	{
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
recipientSchema.index({ email: 1, recipientListId: 1 }, { unique: true });

export const Recipient =
	mongoose.models.Recipient || mongoose.model("Recipient", recipientSchema);
