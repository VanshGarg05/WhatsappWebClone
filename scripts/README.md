# WhatsApp Payload Processing Scripts

This directory contains scripts for processing WhatsApp Business API webhook payloads and managing message data in MongoDB.

## Scripts Overview

### 1. `process-whatsapp-sample-payloads.js`
**Main script for processing WhatsApp sample payloads**

This script processes WhatsApp Business API webhook payloads from JSON files and stores them in the MongoDB database.

#### Features:
- ✅ Reads WhatsApp webhook payloads from JSON files
- ✅ Inserts new messages into the `processed_messages` collection
- ✅ Updates message status using `id` or `meta_msg_id` field matching
- ✅ Handles different message types (text, image, document, audio, video, location)
- ✅ Supports various message statuses (sent, delivered, read, failed)
- ✅ Processes files in order (messages first, then status updates)
- ✅ Provides detailed logging and statistics

#### Usage:
```bash
# Process payloads from default directory (./payloads)
npm run process-sample-payloads

# Process payloads from custom directory
npm run process-sample-payloads -- /path/to/payloads

# Clear existing messages and process payloads
npm run process-sample-payloads -- --clear

# Get help
npm run process-sample-payloads -- --help
```

#### Database Schema
Messages are stored in the `whatsapp` database, `processed_messages` collection with the following structure:

```javascript
{
  id: String,                    // WhatsApp message ID
  meta_msg_id: String,          // Meta message ID for status updates
  wa_id: String,                // WhatsApp ID of sender
  from: String,                 // Sender phone number
  to: String,                   // Recipient phone number
  type: String,                 // Message type (text, image, etc.)
  text: String,                 // Text content (for text messages)
  status: String,               // Message status (sent, delivered, read, failed)
  timestamp: Number,            // Unix timestamp
  contact: {                    // Contact information
    profile: { name: String },
    wa_id: String
  },
  messaging_product: String,    // Always "whatsapp"
  isFromUser: Boolean,          // Whether message is from user
  // ... other type-specific fields for media messages
}
```

### 2. `view-messages.js`
**View processed messages in the database**

A utility script to view all processed messages from the database with formatted output.

#### Usage:
```bash
npm run view-messages
```

#### Output:
- Lists all messages in chronological order
- Shows message status with icons
- Displays sender information and message content
- Provides status statistics

### 3. `test-db-connection.js`
**Test MongoDB connection**

Verifies that the MongoDB connection is working properly.

#### Usage:
```bash
npm run test-db
```

### 4. Legacy Scripts

#### `process-payloads.js`
Original payload processing script (updated for new format compatibility)

#### `seed-demo-data.js`
Seeds the database with demo data

## Payload Format

The script expects WhatsApp Business API webhook payloads in the following format:

### Message Payload Example:
```json
{
  "payload_type": "whatsapp_webhook",
  "_id": "unique-payload-id",
  "metaData": {
    "entry": [{
      "changes": [{
        "field": "messages",
        "value": {
          "messages": [{
            "id": "wamid.xxx",
            "from": "919876543210",
            "timestamp": "1754400000",
            "type": "text",
            "text": { "body": "Hello!" }
          }],
          "contacts": [{
            "profile": { "name": "John Doe" },
            "wa_id": "919876543210"
          }]
        }
      }]
    }]
  }
}
```

### Status Update Payload Example:
```json
{
  "payload_type": "whatsapp_webhook",
  "_id": "unique-status-id",
  "metaData": {
    "entry": [{
      "changes": [{
        "field": "messages",
        "value": {
          "statuses": [{
            "id": "wamid.xxx",
            "meta_msg_id": "wamid.xxx",
            "status": "delivered",
            "timestamp": "1754400010",
            "recipient_id": "919876543210"
          }]
        }
      }]
    }]
  }
}
```

## Environment Variables

Make sure your `.env.local` file contains:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whatsapp
```

## Database Setup

The script automatically:
1. Connects to MongoDB using the connection string from `.env.local`
2. Creates the `processed_messages` collection if it doesn't exist
3. Sets up appropriate indexes for performance
4. Handles duplicate message prevention using unique indexes

## Error Handling

The script includes comprehensive error handling:
- ✅ Connection errors are logged and cause the script to exit
- ✅ File parsing errors are logged but don't stop processing other files
- ✅ Database operation errors are caught and logged
- ✅ Invalid payload structures are handled gracefully

## Performance Features

- **Indexed Fields**: `wa_id`, `id`, `meta_msg_id`, `status`, `timestamp`
- **Upsert Operations**: Prevents duplicate messages
- **Batch Processing**: Processes files sequentially for optimal resource usage
- **Connection Pooling**: Uses mongoose connection pooling

## Monitoring and Logging

The script provides detailed logging:
- 📝 File processing progress
- 💬 Message content preview
- ✅ Success confirmations
- ❌ Error details
- 📊 Final statistics

## Status Flow

Messages typically follow this status progression:
1. **sent** → Initial status when message is created
2. **delivered** → Message delivered to recipient's device
3. **read** → Message read by recipient
4. **failed** → Message delivery failed

## Directory Structure

```
scripts/
├── README.md                              # This file
├── process-whatsapp-sample-payloads.js   # Main processing script
├── view-messages.js                       # Database viewer
├── test-db-connection.js                  # Connection tester
├── process-payloads.js                    # Legacy processor
└── seed-demo-data.js                      # Demo data seeder

payloads/
├── conversation_1_message_1.json          # Sample message files
├── conversation_1_status_1.json           # Sample status files
└── ... (other payload files)
```

## Troubleshooting

### Common Issues:

1. **MongoDB Connection Failed**
   - Check your connection string in `.env.local`
   - Ensure your IP is whitelisted in MongoDB Atlas
   - Verify username/password credentials

2. **No Files Found**
   - Check that JSON files exist in the specified directory
   - Ensure files have `.json` extension

3. **Duplicate Key Errors**
   - This is normal for messages that already exist
   - The script handles duplicates gracefully with upserts

4. **Status Updates Not Working**
   - Ensure message payloads are processed before status payloads
   - Check that `id` and `meta_msg_id` fields match between messages and statuses

### Debug Mode:
To see more detailed error information, run with debug output:
```bash
node scripts/process-whatsapp-sample-payloads.js --clear 2>&1 | tee debug.log
```

## Development

To modify the script:
1. The main processing logic is in `processIncomingMessage()` and `processStatusUpdate()`
2. The schema is defined in `ProcessedMessageSchema`
3. File processing order is controlled in the `main()` function
4. Add new message types by updating the schema enum and switch statement

---

**Note**: This script is designed specifically for the WhatsApp Business API webhook payload format. Make sure your JSON files match the expected structure before processing.
