const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp';
const PAYLOADS_DIR = 'C:\\Users\\vansh\\Downloads\\whatsapp sample payloads';

// ProcessedMessage Schema
const processedMessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  meta_msg_id: { type: String, required: true, index: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  contact_name: { type: String, required: true },
  contact_wa_id: { type: String, required: true },
  message_type: { 
    type: String, 
    required: true, 
    enum: ['text', 'image', 'document', 'audio', 'video', 'location', 'contacts'] 
  },
  message_body: { 
    type: String, 
    required: function() { return this.message_type === 'text'; } 
  },
  status: { 
    type: String, 
    enum: ['sent', 'delivered', 'read', 'failed'], 
    default: 'sent' 
  },
  message_timestamp: { type: Date, required: true },
  status_timestamp: { type: Date },
  phone_number_id: { type: String, required: true },
  display_phone_number: { type: String, required: true },
  conversation_id: { type: String },
  conversation_origin: { type: String, enum: ['user_initiated', 'business_initiated'] },
  pricing: {
    billable: Boolean,
    category: String,
    pricing_model: String,
    type: String
  },
  payload_id: { type: String, required: true },
  processed_at: { type: Date, default: Date.now },
  raw_payload: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

const ProcessedMessage = mongoose.model('ProcessedMessage', processedMessageSchema);

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function processMessage(message, value, payload, filename) {
  const contact = value.contacts?.[0];
  const metadata = value.metadata;
  
  const processedMessage = {
    id: message.id,
    meta_msg_id: message.id,
    from: message.from,
    to: metadata?.display_phone_number || '',
    contact_name: contact?.profile?.name || 'Unknown',
    contact_wa_id: contact?.wa_id || message.from,
    message_type: message.type || 'text',
    message_body: message.text?.body || message.body || '',
    status: 'sent',
    message_timestamp: new Date(parseInt(message.timestamp) * 1000),
    phone_number_id: metadata?.phone_number_id || '',
    display_phone_number: metadata?.display_phone_number || '',
    payload_id: payload._id || filename,
    raw_payload: payload
  };
  
  await ProcessedMessage.findOneAndUpdate(
    { id: message.id },
    processedMessage,
    { upsert: true, new: true }
  );
  
  console.log(`✓ Processed message: ${message.id}`);
}

async function processStatus(status, value, payload, filename) {
  const updateData = {
    status: status.status,
    status_timestamp: new Date(parseInt(status.timestamp) * 1000),
  };
  
  if (status.conversation) {
    updateData.conversation_id = status.conversation.id;
    updateData.conversation_origin = status.conversation.origin?.type;
  }
  
  if (status.pricing) {
    updateData.pricing = {
      billable: status.pricing.billable,
      category: status.pricing.category,
      pricing_model: status.pricing.pricing_model,
      type: status.pricing.type
    };
  }
  
  const result = await ProcessedMessage.findOneAndUpdate(
    {
      $or: [
        { id: status.id },
        { meta_msg_id: status.meta_msg_id || status.id }
      ]
    },
    updateData,
    { new: true }
  );
  
  if (result) {
    console.log(`✓ Updated status for message: ${status.id} to ${status.status}`);
  } else {
    console.log(`⚠ No message found to update status for ID: ${status.id}`);
  }
}

async function processPayloads() {
  console.log('Starting WhatsApp payload processing...\n');
  
  try {
    // Check if payloads directory exists
    if (!fs.existsSync(PAYLOADS_DIR)) {
      console.error(`❌ Payloads directory not found: ${PAYLOADS_DIR}`);
      process.exit(1);
    }
    
    const files = fs.readdirSync(PAYLOADS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      console.log('❌ No JSON payload files found');
      process.exit(1);
    }
    
    console.log(`Found ${jsonFiles.length} payload files to process\n`);
    
    const results = {
      processed: 0,
      messages_inserted: 0,
      statuses_updated: 0,
      errors: []
    };
    
    for (const file of jsonFiles) {
      try {
        console.log(`Processing: ${file}`);
        
        const filePath = path.join(PAYLOADS_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const payload = JSON.parse(fileContent);
        
        const entry = payload.metaData?.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        
        if (!value) {
          console.log(`  Skipping - no value found`);
          continue;
        }
        
        // Process messages
        if (value.messages && Array.isArray(value.messages)) {
          for (const message of value.messages) {
            await processMessage(message, value, payload, file);
            results.messages_inserted++;
          }
        }
        
        // Process status updates
        if (value.statuses && Array.isArray(value.statuses)) {
          for (const status of value.statuses) {
            await processStatus(status, value, payload, file);
            results.statuses_updated++;
          }
        }
        
        results.processed++;
        console.log(`  ✓ Successfully processed\n`);
        
      } catch (error) {
        console.error(`  ❌ Error processing ${file}:`, error.message);
        results.errors.push(`${file}: ${error.message}`);
      }
    }
    
    // Print summary
    console.log('='.repeat(50));
    console.log('PROCESSING SUMMARY');
    console.log('='.repeat(50));
    console.log(`Files Processed: ${results.processed}`);
    console.log(`Messages Inserted: ${results.messages_inserted}`);
    console.log(`Statuses Updated: ${results.statuses_updated}`);
    console.log(`Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    console.log('\n✓ Processing completed successfully!');
    
    // Show some statistics
    const totalMessages = await ProcessedMessage.countDocuments();
    const sentCount = await ProcessedMessage.countDocuments({ status: 'sent' });
    const deliveredCount = await ProcessedMessage.countDocuments({ status: 'delivered' });
    const readCount = await ProcessedMessage.countDocuments({ status: 'read' });
    
    console.log('\nDatabase Statistics:');
    console.log(`Total Messages: ${totalMessages}`);
    console.log(`Sent: ${sentCount}`);
    console.log(`Delivered: ${deliveredCount}`);
    console.log(`Read: ${readCount}`);
    
  } catch (error) {
    console.error('❌ Processing failed:', error);
    process.exit(1);
  }
}

async function main() {
  await connectToDatabase();
  await processPayloads();
  await mongoose.disconnect();
  console.log('\n✓ Disconnected from MongoDB');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { processPayloads, connectToDatabase };
