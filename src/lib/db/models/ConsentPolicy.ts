import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IConsentPolicy extends Document {
  userId: mongoose.Types.ObjectId;
  purpose: string;
  allowedFields: string[]; // Fields the agent can use to compute compatibility
  revealAfterMatchFields: string[]; // Fields revealed only after both users accept
  privateFields: string[]; // Fields that are never shared
  identityReveal: boolean; // Whether the user allows full identity reveal upon match acceptance
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ConsentPolicySchema = new Schema<IConsentPolicy>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    purpose: {
      type: String,
      default: 'dating_compatibility',
      required: true,
    },
    allowedFields: [{ type: String }],
    revealAfterMatchFields: [{ type: String }],
    privateFields: [{ type: String }],
    identityReveal: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const ConsentPolicy: Model<IConsentPolicy> = mongoose.models.ConsentPolicy || mongoose.model<IConsentPolicy>('ConsentPolicy', ConsentPolicySchema);
