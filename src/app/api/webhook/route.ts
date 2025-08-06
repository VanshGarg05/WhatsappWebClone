import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ProcessedMessage from '@/models/ProcessedMessage';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const payload = await request.json();
    console.log('Webhook payload received:', JSON.stringify(payload, null, 2));

    // Process different types of webhooks
    if (payload.entry && Array.isArray(payload.entry)) {
      for (const entry of payload.entry) {
        if (entry.changes && Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              await processMessageChange(change.value);
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processMessageChange(value: any) {
  // Process new messages
  if (value.messages && Array.isArray(value.messages)) {
    for (const message of value.messages) {
      await processIncomingMessage(message, value.contacts?.[0]);
    }
  }

  // Process status updates
  if (value.statuses && Array.isArray(value.statuses)) {
    for (const status of value.statuses) {
      await processStatusUpdate(status);
    }
  }
}

async function processIncomingMessage(message: any, contact: any) {
  try {
    const messageData: any = {
      id: message.id,
      wa_id: message.from,
      from: message.from,
      to: message.to,
      type: message.type,
      timestamp: message.timestamp,
      messaging_product: 'whatsapp',
      status: 'delivered',
      isFromUser: false,
      contact: contact ? {
        profile: {
          name: contact.profile?.name || `User ${message.from.slice(-4)}`,
        },
        wa_id: contact.wa_id,
      } : {
        profile: {
          name: `User ${message.from.slice(-4)}`,
        },
        wa_id: message.from,
      },
    };

    // Add type-specific content
    switch (message.type) {
      case 'text':
        messageData.text = message.text?.body;
        break;
      case 'image':
        messageData.image = {
          id: message.image?.id,
          mime_type: message.image?.mime_type,
          sha256: message.image?.sha256,
          caption: message.image?.caption,
        };
        break;
      case 'document':
        messageData.document = {
          id: message.document?.id,
          filename: message.document?.filename,
          mime_type: message.document?.mime_type,
          sha256: message.document?.sha256,
          caption: message.document?.caption,
        };
        break;
      case 'audio':
        messageData.audio = {
          id: message.audio?.id,
          mime_type: message.audio?.mime_type,
          sha256: message.audio?.sha256,
          voice: message.audio?.voice,
        };
        break;
      case 'video':
        messageData.video = {
          id: message.video?.id,
          mime_type: message.video?.mime_type,
          sha256: message.video?.sha256,
          caption: message.video?.caption,
        };
        break;
      case 'location':
        messageData.location = {
          latitude: message.location?.latitude,
          longitude: message.location?.longitude,
          name: message.location?.name,
          address: message.location?.address,
        };
        break;
    }

    // Insert or update message
    await ProcessedMessage.findOneAndUpdate(
      { id: message.id },
      messageData,
      { upsert: true, new: true }
    );

    console.log(`Processed message: ${message.id} from ${message.from}`);
  } catch (error) {
    console.error('Error processing incoming message:', error);
  }
}

async function processStatusUpdate(status: any) {
  try {
    const update = {
      status: status.status,
      timestamp: status.timestamp,
    };

    // Update message status using either id or meta_msg_id
    const result = await ProcessedMessage.findOneAndUpdate(
      {
        $or: [
          { id: status.id },
          { meta_msg_id: status.id }
        ]
      },
      update,
      { new: true }
    );

    if (result) {
      console.log(`Updated message status: ${status.id} -> ${status.status}`);
    } else {
      console.log(`Message not found for status update: ${status.id}`);
    }
  } catch (error) {
    console.error('Error processing status update:', error);
  }
}

// Handle GET request for webhook verification (if needed)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify webhook (optional - for production webhook setup)
  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 403 });
}
