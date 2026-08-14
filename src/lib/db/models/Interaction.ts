import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IInteraction extends Document {
  fromUserId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  action: 'like' | 'pass' | 'superlike';
  createdAt: Date;
  updatedAt: Date;
}

const InteractionSchema = new Schema<IInteraction>(
  {
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: ['like', 'pass', 'superlike'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate interactions
InteractionSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

export const Interaction: Model<IInteraction> = mongoose.models.Interaction || mongoose.model<IInteraction>('Interaction', InteractionSchema);
