import mongoose from 'mongoose';

const processedMessageSchema = new mongoose.Schema({
  // WhatsApp message ID (primary identifier)
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Meta message ID for status updates
  meta_msg_id: {
    type: String,
    required: true,
    index: true
  },
  
  // Message content
  from: {
    type: String,
    required: true
  },
  
  to: {
    type: String,
    required: true
  },
  
  // Contact information
  contact_name: {
    type: String,
    required: true
  },
  
  contact_wa_id: {
    type: String,
    required: true
  },
  
  // Message details
  message_type: {
    type: String,
    required: true,
    enum: ['text', 'image', 'document', 'audio', 'video', 'location', 'contacts']
  },
  
  message_body: {
    type: String,
    required: function() { return this.message_type === 'text'; }
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // Timestamps
  message_timestamp: {
    type: Date,
    required: true
  },
  
  status_timestamp: {
    type: Date
  },
  
  // WhatsApp Business API metadata
  phone_number_id: {
    type: String,
    required: true
  },
  
  display_phone_number: {
    type: String,
    required: true
  },
  
  // Conversation details
  conversation_id: {
    type: String
  },
  
  conversation_origin: {
    type: String,
    enum: ['user_initiated', 'business_initiated']
  },
  
  // Pricing information (for business API)
  pricing: {
    billable: Boolean,
    category: String,
    pricing_model: String,
    type: String
  },
  
  // Processing metadata
  payload_id: {
    type: String,
    required: true
  },
  
  processed_at: {
    type: Date,
    default: Date.now
  },
  
  // Raw payload for debugging
  raw_payload: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
processedMessageSchema.index({ from: 1, message_timestamp: -1 });
processedMessageSchema.index({ to: 1, message_timestamp: -1 });
processedMessageSchema.index({ contact_wa_id: 1, message_timestamp: -1 });
processedMessageSchema.index({ status: 1, status_timestamp: -1 });

export default mongoose.models.ProcessedMessage || mongoose.model('ProcessedMessage', processedMessageSchema);
