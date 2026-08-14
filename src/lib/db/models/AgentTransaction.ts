import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAgentTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  agentName: string;
  methodName: string;
  txHash: string; // The on-chain transaction hash
  amount: number; // The amount paid in USDC/CROO
  status: 'pending' | 'settled' | 'failed';
  metadata: any; // Additional CROO CAP data
  createdAt: Date;
  updatedAt: Date;
}

const AgentTransactionSchema = new Schema<IAgentTransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    agentName: {
      type: String,
      required: true, // e.g. "CompatibilityAgent", "ConversationCoach"
    },
    methodName: {
      type: String,
      required: true,
    },
    txHash: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'settled', 'failed'],
      default: 'pending',
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export const AgentTransaction: Model<IAgentTransaction> = mongoose.models.AgentTransaction || mongoose.model<IAgentTransaction>('AgentTransaction', AgentTransactionSchema);
