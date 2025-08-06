import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ProcessedMessage from '@/models/ProcessedMessage';
import fs from 'fs';
import path from 'path';

const PAYLOADS_DIR = 'C:\\Users\\vansh\\Downloads\\whatsapp sample payloads';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Read all payload files
    const files = fs.readdirSync(PAYLOADS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const results = {
      processed: 0,
      messages_inserted: 0,
      statuses_updated: 0,
      errors: []
    };
    
    console.log(`Found ${jsonFiles.length} payload files to process`);
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(PAYLOADS_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const payload = JSON.parse(fileContent);
        
        console.log(`Processing file: ${file}`);
        
        // Check if this is a message or status payload
        const entry = payload.metaData?.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        
        if (!value) {
          console.log(`Skipping ${file} - no value found`);
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
        console.log(`✓ Successfully processed ${file}`);
        
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
        results.errors.push(`${file}: ${error.message}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Payloads processed successfully',
      results
    }, { status: 200 });
    
  } catch (error) {
    console.error('Process payloads error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processMessage(message: any, value: any, payload: any, filename: string) {
  const contact = value.contacts?.[0];
  const metadata = value.metadata;
  
  // Create processed message document
  const processedMessage = {
    id: message.id,
    meta_msg_id: message.id, // Use message ID as meta_msg_id for messages
    from: message.from,
    to: metadata?.display_phone_number || '',
    contact_name: contact?.profile?.name || 'Unknown',
    contact_wa_id: contact?.wa_id || message.from,
    message_type: message.type || 'text',
    message_body: message.text?.body || message.body || '',
    status: 'sent', // Default status for incoming messages
    message_timestamp: new Date(parseInt(message.timestamp) * 1000),
    phone_number_id: metadata?.phone_number_id || '',
    display_phone_number: metadata?.display_phone_number || '',
    payload_id: payload._id || filename,
    raw_payload: payload
  };
  
  // Insert or update message
  await ProcessedMessage.findOneAndUpdate(
    { id: message.id },
    processedMessage,
    { upsert: true, new: true }
  );
  
  console.log(`✓ Inserted message: ${message.id}`);
}

async function processStatus(status: any, value: any, payload: any, filename: string) {
  const metadata = value.metadata;
  
  // Find the message by ID or meta_msg_id and update its status
  const updateData = {
    status: status.status,
    status_timestamp: new Date(parseInt(status.timestamp) * 1000),
  };
  
  // If this status has conversation details, update those too
  if (status.conversation) {
    updateData.conversation_id = status.conversation.id;
    updateData.conversation_origin = status.conversation.origin?.type;
  }
  
  // If this status has pricing details, update those too
  if (status.pricing) {
    updateData.pricing = {
      billable: status.pricing.billable,
      category: status.pricing.category,
      pricing_model: status.pricing.pricing_model,
      type: status.pricing.type
    };
  }
  
  // Try to find by both id and meta_msg_id
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

// GET method to retrieve processed messages
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const page = parseInt(url.searchParams.get('page') || '1');
    const status = url.searchParams.get('status');
    
    let query = {};
    if (status) {
      query.status = status;
    }
    
    const messages = await ProcessedMessage.find(query)
      .sort({ message_timestamp: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-raw_payload'); // Exclude raw payload from response for cleaner output
    
    const total = await ProcessedMessage.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: messages,
      pagination: {
        current_page: page,
        per_page: limit,
        total: total,
        total_pages: Math.ceil(total / limit)
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Get processed messages error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
