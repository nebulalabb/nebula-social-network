import mongoose, { Schema, Document } from "mongoose";

// MongoDB model cho Events
export interface IEvent extends Document {
  title: string;
  description: string;
  type: "QUIZ" | "FANART_CONTEST" | "WATCH_PARTY" | "DISCUSSION" | "OTHER";
  organizerId: string;
  clubId?: string;
  startDate: Date;
  endDate: Date;
  imageUrl?: string;
  maxParticipants?: number;
  participants: string[];
  isPublic: boolean;
  status: "UPCOMING" | "ONGOING" | "ENDED";
  createdAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ["QUIZ", "FANART_CONTEST", "WATCH_PARTY", "DISCUSSION", "OTHER"], default: "OTHER" },
    organizerId: { type: String, required: true, index: true },
    clubId: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    imageUrl: { type: String },
    maxParticipants: { type: Number },
    participants: [{ type: String }],
    isPublic: { type: Boolean, default: true },
    status: { type: String, enum: ["UPCOMING", "ONGOING", "ENDED"], default: "UPCOMING" },
  },
  { timestamps: true }
);

export const Event = mongoose.model<IEvent>("Event", EventSchema);

export class EventsService {
  async createEvent(organizerId: string, data: {
    title: string; description: string; type?: string;
    startDate: string; endDate: string; imageUrl?: string;
    maxParticipants?: number; isPublic?: boolean; clubId?: string;
  }) {
    const event = await Event.create({ ...data, organizerId, participants: [organizerId] });
    return event.toObject();
  }

  async getEvents(params: { type?: string; status?: string; page?: number; limit?: number }) {
    const { type, status, page = 1, limit = 20 } = params;
    const query: any = { isPublic: true };
    if (type) query.type = type;
    if (status) query.status = status;
    else query.status = { $in: ["UPCOMING", "ONGOING"] };

    const [events, total] = await Promise.all([
      Event.find(query).sort({ startDate: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Event.countDocuments(query),
    ]);
    return { events, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getEventById(id: string) {
    return Event.findById(id).lean();
  }

  async joinEvent(eventId: string, userId: string) {
    const event = await Event.findById(eventId);
    if (!event) throw new Error("Sự kiện không tồn tại");
    if (event.participants.includes(userId)) throw new Error("Bạn đã tham gia sự kiện này");
    if (event.maxParticipants && event.participants.length >= event.maxParticipants) {
      throw new Error("Sự kiện đã đầy");
    }
    await Event.findByIdAndUpdate(eventId, { $addToSet: { participants: userId } });
  }

  async leaveEvent(eventId: string, userId: string) {
    await Event.findByIdAndUpdate(eventId, { $pull: { participants: userId } });
  }

  async updateEventStatuses() {
    const now = new Date();
    await Event.updateMany({ startDate: { $lte: now }, endDate: { $gte: now }, status: "UPCOMING" }, { status: "ONGOING" });
    await Event.updateMany({ endDate: { $lt: now }, status: { $ne: "ENDED" } }, { status: "ENDED" });
  }
}
