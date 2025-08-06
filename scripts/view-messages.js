const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// ProcessedMessage schema
const ProcessedMessageSchema = new mongoose.Schema({
  id: { type: String, sparse: true, unique: true },
  meta_msg_id: { type: String, sparse: true, unique: true },
  wa_id: { type: String, required: true, index: true },
  from: { type: String, required: true },
  to: { type: String },
  type: {
    type: String,
    required: true,
    enum: ['text', 'image', 'document', 'audio', 'video', 'location', 'contacts', 'status']
  },
  text: { type: String },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  timestamp: { type: Number, required: true },
  contact: {
    profile: {
      name: String,
    },
    wa_id: String,
  },
  messaging_product: { type: String, default: 'whatsapp' },
  recipient_type: { type: String },
  isFromUser: { type: Boolean, default: false },
}, {
  timestamps: true,
});

const ProcessedMessage = mongoose.model('ProcessedMessage', ProcessedMessageSchema);

async function viewMessages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('📱 Connected to MongoDB\n');

    const messages = await ProcessedMessage.find({}).sort({ timestamp: 1 });
    
    console.log(`📊 Found ${messages.length} messages in database:\n`);
    
    messages.forEach((msg, index) => {
      const date = new Date(msg.timestamp * 1000).toLocaleString();
      const statusIcon = {
        'sent': '📤',
        'delivered': '✅',
        'read': '👁️',
        'failed': '❌'
      }[msg.status] || '❓';
      
      console.log(`${index + 1}. ${statusIcon} [${msg.status.toUpperCase()}] ${date}`);
      console.log(`   From: ${msg.contact.profile.name} (${msg.from})`);
      console.log(`   Message: "${msg.text}"`);
      console.log(`   ID: ${msg.id}`);
      console.log(`   Meta ID: ${msg.meta_msg_id}`);
      console.log('');
    });

    // Show statistics
    const stats = await ProcessedMessage.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('📈 Status Statistics:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} messages`);
    });

    await mongoose.disconnect();
    console.log('\n📱 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

viewMessages();
