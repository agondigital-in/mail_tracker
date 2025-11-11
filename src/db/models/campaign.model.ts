import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const campaignSchema = new Schema(
	{
		userId: { type: String, ref: "User", required: true, index: true },
		name: { type: String, required: true },
		description: { type: String },
	},
	{
		timestamps: true,
		collection: "campaigns",
	},
);

const Campaign = models.Campaign || model("Campaign", campaignSchema);

export { Campaign };
