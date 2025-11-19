import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["simple", "bulk"],
      default: "simple",
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },

    // Existing fields for simple campaigns
    to: {
      type: String,
    },
    from: {
      type: String,
    },
    subject: {
      type: String,
    },
    htmlContent: {
      type: String,
    },
    trackingId: {
      type: String,
    },

    // New fields for bulk campaigns
    recipientListIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RecipientList",
      },
    ],
    mailServers: [
      {
        serverId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SmtpServer",
          required: true,
        },
        limit: {
          type: Number,
          required: true,
        },
        sent: {
          type: Number,
          default: 0,
        },
      },
    ],
    schedule: {
      type: {
        type: String,
        enum: ["immediate", "scheduled", "recurring"],
      },
      startDate: {
        type: Date,
      },
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
      },
      batchSize: {
        type: Number,
      },
      endDate: {
        type: Date,
      },
      lastExecutedAt: {
        type: Date,
      },
      sortOrder: {
        type: String,
        enum: ["newest", "oldest"],
        default: "newest",
      },
    },
    delay: {
      type: Number,
      default: 0,
    }, // seconds

    // Progress tracking
    status: {
      type: String,
      enum: [
        "draft",
        "scheduled",
        "processing",
        "paused",
        "completed",
        "failed",
        "cancelled",
      ],
      default: "draft",
      index: true,
    },
    totalRecipients: {
      type: Number,
      default: 0,
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    remainingCount: {
      type: Number,
      default: 0,
    },
    failedRecipients: [
      {
        email: {
          type: String,
        },
        error: {
          type: String,
        },
        timestamp: {
          type: Date,
        },
      },
    ],

    // Job reference
    agendaJobId: {
      type: String,
      index: true,
    },

    // Timestamps
    sentAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for user's campaigns by type
campaignSchema.index({ userId: 1, type: 1 });

export const Campaign =
  mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);
