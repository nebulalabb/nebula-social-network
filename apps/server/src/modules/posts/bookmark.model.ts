import mongoose, { Schema, Document } from "mongoose";

export interface IBookmark extends Document {
  userId: string;
  postId: string;
  createdAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>(
  {
    userId: { type: String, required: true, index: true },
    postId: { type: String, required: true },
  },
  { timestamps: true }
);

BookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });

export const Bookmark = mongoose.model<IBookmark>("Bookmark", BookmarkSchema);
