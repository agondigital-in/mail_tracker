import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const clickEventSchema = new Schema(
	{
		emailId: {
			type: Schema.Types.ObjectId,
			ref: "Email",
			required: true,
			index: true,
		},
		trackingId: { type: String, required: true, index: true },
		destinationUrl: { type: String, required: true },
		ipAddress: { type: String, required: true },
		userAgent: { type: String, required: true },
		isUnique: { type: Boolean, default: false },
		timestamp: { type: Date, required: true },
	},
	{
		timestamps: true,
		collection: "click_events",
	},
);

const ClickEvent = models.ClickEvent || model("ClickEvent", clickEventSchema);

export { ClickEvent };
