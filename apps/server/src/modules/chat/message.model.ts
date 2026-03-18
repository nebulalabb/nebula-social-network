import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: string;
  type: "TEXT" | "IMAGE" | "VIDEO" | "FILE" | "STICKER" | "SYSTEM";
  content: string;
  mediaUrl?: string;
  replyToId?: mongoose.Types.ObjectId;
  reactions: {
    userId: string;
    emoji: string;
  }[];
  isDeleted: boolean;
  createdAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    type: { type: String, enum: ["TEXT", "IMAGE", "VIDEO", "FILE", "STICKER", "SYSTEM"], default: "TEXT" },
    content: { type: String },
    mediaUrl: { type: String },
    replyToId: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    reactions: [
      {
        userId: { type: String },
        emoji: { type: String },
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
