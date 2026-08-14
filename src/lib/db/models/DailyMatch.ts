import mongoose, { Document, Model, Schema } from 'mongoose';

export type DailyMatchVote = 'reveal' | 'leave' | 'pending';

export interface IChatMessage {
  senderId: mongoose.Types.ObjectId;
  message: string;
  timestamp: Date;
}

export interface IDailyMatch extends Document {
  userAId: mongoose.Types.ObjectId;
  userBId: mongoose.Types.ObjectId;
  status: 'active' | 'revealed' | 'expired';
  chatTranscript: IChatMessage[];
  userAVote: DailyMatchVote;
  userBVote: DailyMatchVote;
  discussionTopic: string;
  createdAt: Date;
  updatedAt: Date;
}

const DailyMatchSchema = new Schema<IDailyMatch>(
  {
    userAId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userBId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'revealed', 'expired'],
      default: 'active',
    },
    chatTranscript: [
      {
        senderId: { type: Schema.Types.ObjectId, required: true },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    userAVote: {
      type: String,
      enum: ['reveal', 'leave', 'pending'],
      default: 'pending',
    },
    userBVote: {
      type: String,
      enum: ['reveal', 'leave', 'pending'],
      default: 'pending',
    },
    discussionTopic: {
      type: String,
      required: true, // E.g., 'Life & Love', 'What are your core values?'
    },
  },
  {
    timestamps: true,
  }
);

export const DailyMatch: Model<IDailyMatch> = mongoose.models.DailyMatch || mongoose.model<IDailyMatch>('DailyMatch', DailyMatchSchema);
