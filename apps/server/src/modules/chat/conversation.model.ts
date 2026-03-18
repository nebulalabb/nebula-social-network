import mongoose, { Schema, Document } from "mongoose";

export interface IConversation extends Document {
  type: "DIRECT" | "GROUP";
  participants: {
    userId: string;
    role: "ADMIN" | "MEMBER";
    joinedAt: Date;
    lastReadAt: Date;
  }[];
  name?: string; // For group chat
  avatarUrl?: string; // For group chat
  lastMessage?: {
    senderId: string;
    content: string;
    timestamp: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema(
  {
    type: { type: String, enum: ["DIRECT", "GROUP"], required: true },
    participants: [
      {
        userId: { type: String, required: true },
        role: { type: String, enum: ["ADMIN", "MEMBER"], default: "MEMBER" },
        joinedAt: { type: Date, default: Date.now },
        lastReadAt: { type: Date, default: Date.now },
      },
    ],
    name: { type: String },
    avatarUrl: { type: String },
    lastMessage: {
      senderId: { type: String },
      content: { type: String },
      timestamp: { type: Date },
    },
  },
  { timestamps: true }
);

export const Conversation = mongoose.model<IConversation>("Conversation", ConversationSchema);
