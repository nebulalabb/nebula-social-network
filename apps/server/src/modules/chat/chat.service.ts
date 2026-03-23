import { Conversation } from "./conversation.model";
import { Message } from "./message.model";
import { prisma } from "../../config/database";
import { AppError } from "../../middlewares/error.middleware";

export class ChatService {
  // ─── Conversations ────────────────────────────────────────────────────────
  async getOrCreateDirect(userId: string, targetId: string) {
    const existing = await Conversation.findOne({
      type: "DIRECT",
      "participants.userId": { $all: [userId, targetId] },
      $expr: { $eq: [{ $size: "$participants" }, 2] },
    });
    if (existing) return existing;

    return Conversation.create({
      type: "DIRECT",
      participants: [
        { userId, role: "MEMBER" },
        { userId: targetId, role: "MEMBER" },
      ],
    });
  }

  async createGroup(userId: string, name: string, memberIds: string[]) {
    const allIds = [...new Set([userId, ...memberIds])];
    return Conversation.create({
      type: "GROUP",
      name,
      participants: allIds.map((id) => ({
        userId: id,
        role: id === userId ? "ADMIN" : "MEMBER",
      })),
    });
  }

  async getUserConversations(userId: string) {
    const convs = await Conversation.find({
      "participants.userId": userId,
    })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    // Enrich với user info
    const allUserIds = [...new Set(convs.flatMap((c) => c.participants.map((p) => p.userId)))];
    const users = await prisma.user.findMany({
      where: { id: { in: allUserIds } },
      select: { id: true, username: true, status: true, profile: { select: { displayName: true, avatarUrl: true } } },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    return convs.map((c) => ({
      ...c,
      participants: c.participants.map((p) => ({ ...p, user: userMap[p.userId] || null })),
      // Với DIRECT: lấy thông tin người kia
      otherUser: c.type === "DIRECT"
        ? userMap[c.participants.find((p) => p.userId !== userId)?.userId || ""] || null
        : null,
    }));
  }

  async getConversation(convId: string, userId: string) {
    const conv = await Conversation.findById(convId).lean();
    if (!conv) throw new AppError(404, "Cuộc trò chuyện không tồn tại");
    const isMember = conv.participants.some((p) => p.userId === userId);
    if (!isMember) throw new AppError(403, "Không có quyền truy cập");
    return conv;
  }

  // ─── Messages ─────────────────────────────────────────────────────────────
  async getMessages(convId: string, userId: string, cursor?: string, limit = 30) {
    await this.getConversation(convId, userId);

    const query: any = { conversationId: convId, isDeleted: false };
    if (cursor) query.createdAt = { $lt: new Date(cursor) };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const senderIds = [...new Set(messages.map((m) => m.senderId))];
    const senders = await prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } },
    });
    const senderMap = Object.fromEntries(senders.map((s) => [s.id, s]));

    const enriched = messages.map((m) => ({ ...m, sender: senderMap[m.senderId] || null }));
    const nextCursor = messages.length === limit ? messages[messages.length - 1].createdAt.toISOString() : null;

    return { messages: enriched.reverse(), nextCursor };
  }

  async sendMessage(convId: string, senderId: string, data: {
    type?: string; content?: string; mediaUrl?: string; replyToId?: string;
  }) {
    await this.getConversation(convId, senderId);

    const msg = await Message.create({
      conversationId: convId,
      senderId,
      type: data.type || "TEXT",
      content: data.content,
      mediaUrl: data.mediaUrl,
      replyToId: data.replyToId || null,
    });

    // Update lastMessage
    await Conversation.findByIdAndUpdate(convId, {
      lastMessage: { senderId, content: data.content || "[media]", timestamp: new Date() },
      updatedAt: new Date(),
    });

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } },
    });

    return { ...msg.toObject(), sender };
  }

  async deleteMessage(msgId: string, userId: string) {
    const msg = await Message.findById(msgId);
    if (!msg) throw new AppError(404, "Tin nhắn không tồn tại");
    if (msg.senderId !== userId) throw new AppError(403, "Không có quyền xóa");
    msg.isDeleted = true;
    msg.content = "Tin nhắn đã bị xóa";
    await msg.save();
    return msg;
  }

  async markRead(convId: string, userId: string) {
    await Conversation.updateOne(
      { _id: convId, "participants.userId": userId },
      { $set: { "participants.$.lastReadAt": new Date() } }
    );
  }

  async addMember(convId: string, adminId: string, newUserId: string) {
    const conv = await Conversation.findById(convId);
    if (!conv) throw new AppError(404, "Không tìm thấy nhóm");
    if (conv.type !== "GROUP") throw new AppError(400, "Chỉ áp dụng cho nhóm");
    const admin = conv.participants.find((p) => p.userId === adminId);
    if (admin?.role !== "ADMIN") throw new AppError(403, "Chỉ admin mới có thể thêm thành viên");
    conv.participants.push({ userId: newUserId, role: "MEMBER", joinedAt: new Date(), lastReadAt: new Date() });
    await conv.save();
    return conv;
  }

  async leaveConversation(convId: string, userId: string) {
    await Conversation.updateOne(
      { _id: convId },
      { $pull: { participants: { userId } } }
    );
  }
}
