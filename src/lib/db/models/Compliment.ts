import mongoose, { Schema, Document } from 'mongoose';

export interface ICompliment extends Document {
  senderId: mongoose.Types.ObjectId;
  targetId: mongoose.Types.ObjectId;
  message: string;
  createdAt: Date;
}

const ComplimentSchema: Schema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export const Compliment = mongoose.models.Compliment || mongoose.model<ICompliment>('Compliment', ComplimentSchema);
