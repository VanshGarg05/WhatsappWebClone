import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  message: string;
  messageType: 'text' | 'image' | 'file';
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema: Schema = new Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes for better performance
ChatSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
ChatSchema.index({ receiver: 1, isRead: 1 });

export default mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);
