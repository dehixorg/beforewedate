import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  isAI: { type: Boolean, default: false }, // If the message is a system or AI coach message
}, { timestamps: true });

// Prevent model overwrite in development
export const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
