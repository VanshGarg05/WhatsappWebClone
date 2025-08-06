import mongoose, { Schema, Document } from 'mongoose';

export interface IProcessedMessage extends Document {
  // WhatsApp fields
  id?: string; // WhatsApp message ID
  meta_msg_id?: string; // Meta message ID
  wa_id: string; // WhatsApp user ID
  from: string; // Sender number
  to?: string; // Recipient number
  
  // Message content
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contacts' | 'status';
  text?: string;
  image?: {
    id?: string;
    mime_type?: string;
    sha256?: string;
    caption?: string;
  };
  document?: {
    id?: string;
    filename?: string;
    mime_type?: string;
    sha256?: string;
    caption?: string;
  };
  audio?: {
    id?: string;
    mime_type?: string;
    sha256?: string;
    voice?: boolean;
  };
  video?: {
    id?: string;
    mime_type?: string;
    sha256?: string;
    caption?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  
  // Status fields
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: number; // Unix timestamp
  
  // Contact info
  contact?: {
    profile?: {
      name: string;
    };
    wa_id: string;
  };
  
  // Metadata
  messaging_product: string;
  recipient_type?: string;
  
  // Additional fields for UI
  isFromUser?: boolean; // true if sent by user, false if received
  createdAt: Date;
  updatedAt: Date;
}

const ProcessedMessageSchema: Schema = new Schema({
  // WhatsApp fields
  id: { type: String, sparse: true },
  meta_msg_id: { type: String, sparse: true },
  wa_id: { type: String, required: true, index: true },
  from: { type: String, required: true },
  to: { type: String },
  
  // Message content
  type: {
    type: String,
    required: true,
    enum: ['text', 'image', 'document', 'audio', 'video', 'location', 'contacts', 'status']
  },
  text: { type: String },
  image: {
    id: String,
    mime_type: String,
    sha256: String,
    caption: String,
  },
  document: {
    id: String,
    filename: String,
    mime_type: String,
    sha256: String,
    caption: String,
  },
  audio: {
    id: String,
    mime_type: String,
    sha256: String,
    voice: Boolean,
  },
  video: {
    id: String,
    mime_type: String,
    sha256: String,
    caption: String,
  },
  location: {
    latitude: Number,
    longitude: Number,
    name: String,
    address: String,
  },
  
  // Status fields
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  timestamp: { type: Number, required: true },
  
  // Contact info
  contact: {
    profile: {
      name: String,
    },
    wa_id: String,
  },
  
  // Metadata
  messaging_product: { type: String, default: 'whatsapp' },
  recipient_type: { type: String },
  
  // Additional fields for UI
  isFromUser: { type: Boolean, default: false },
}, {
  timestamps: true,
});

// Create indexes for better performance
ProcessedMessageSchema.index({ wa_id: 1, timestamp: -1 });
ProcessedMessageSchema.index({ id: 1 });
ProcessedMessageSchema.index({ meta_msg_id: 1 });
ProcessedMessageSchema.index({ status: 1 });

export default mongoose.models.ProcessedMessage || 
  mongoose.model<IProcessedMessage>('ProcessedMessage', ProcessedMessageSchema);
