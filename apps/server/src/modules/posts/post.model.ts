import mongoose, { Schema, Document } from "mongoose";

export interface IPost extends Document {
  userId: string;
  content: string; // TipTap JSON string
  media: {
    type: "IMAGE" | "VIDEO";
    url: string;
    thumbnailUrl?: string;
  }[];
  tags: {
    animeIds: string[];
    mangaIds: string[];
    mentionedUserIds: string[];
  };
  hashtags: string[];
  visibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
  hasSpoiler: boolean;
  type: "POST" | "POLL";
  poll?: {
    question: string;
    options: {
      id: string;
      text: string;
      votes: number;
    }[];
    expiresAt: Date;
  };
  engagement: {
    reactionCount: number;
    commentCount: number;
    repostCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    media: [
      {
        type: { type: String, enum: ["IMAGE", "VIDEO"] },
        url: { type: String },
        thumbnailUrl: { type: String },
      },
    ],
    tags: {
      animeIds: [{ type: String }],
      mangaIds: [{ type: String }],
      mentionedUserIds: [{ type: String }],
    },
    hashtags: [{ type: String, index: true }],
    visibility: { type: String, enum: ["PUBLIC", "FRIENDS", "PRIVATE"], default: "PUBLIC" },
    hasSpoiler: { type: Boolean, default: false },
    type: { type: String, enum: ["POST", "POLL"], default: "POST" },
    poll: {
      question: { type: String },
      options: [
        {
          id: { type: String },
          text: { type: String },
          votes: { type: Number, default: 0 },
        },
      ],
      expiresAt: { type: Date },
    },
    engagement: {
      reactionCount: { type: Number, default: 0 },
      commentCount: { type: Number, default: 0 },
      repostCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const Post = mongoose.model<IPost>("Post", PostSchema);
