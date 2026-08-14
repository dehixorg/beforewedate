import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMatch extends Document {
  users: mongoose.Types.ObjectId[];
  expiresAt: Date;
  initiatorId: mongoose.Types.ObjectId;
  isInitiated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    users: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    expiresAt: {
      type: Date,
      required: true,
    },
    initiatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isInitiated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure fast lookup of matches for a specific user
MatchSchema.index({ users: 1 });

export const Match: Model<IMatch> = mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema);
