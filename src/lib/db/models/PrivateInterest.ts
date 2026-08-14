import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPrivateInterest extends Document {
  requesterUserId: mongoose.Types.ObjectId;
  targetUserId: mongoose.Types.ObjectId;
  status: 'pending' | 'compatible' | 'declined' | 'accepted';
  isPremiumCompliment: boolean; // True if they sent a "Rose" or premium priority note
  complimentText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PrivateInterestSchema = new Schema<IPrivateInterest>(
  {
    requesterUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'compatible', 'declined', 'accepted'],
      default: 'pending',
    },
    isPremiumCompliment: {
      type: Boolean,
      default: false,
    },
    complimentText: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate interests between the same users
PrivateInterestSchema.index({ requesterUserId: 1, targetUserId: 1 }, { unique: true });

export const PrivateInterest: Model<IPrivateInterest> = mongoose.models.PrivateInterest || mongoose.model<IPrivateInterest>('PrivateInterest', PrivateInterestSchema);
