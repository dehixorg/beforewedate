import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  walletAddress: string;
  name?: string;
  email?: string;
  trustScore: number;
  isVerified: boolean;
  discoveryEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    trustScore: {
      type: Number,
      default: 50, // Starting trust score
    },
    isVerified: {
      type: Boolean,
      default: false, // Will become true after mock selfie check
    },
    discoveryEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent mongoose from recompiling the model in development (Next.js hot reload)
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
