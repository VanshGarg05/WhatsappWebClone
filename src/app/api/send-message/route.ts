import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ProcessedMessage from '@/models/ProcessedMessage';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { wa_id, text, type = 'text' } = await request.json();

    if (!wa_id || !text) {
      return NextResponse.json(
        { error: 'wa_id and text are required' },
        { status: 400 }
      );
    }

    // Create a demo message (not actually sent via WhatsApp)
    const messageData = {
      id: `demo_${uuidv4()}`,
      wa_id,
      from: 'your_business_number', // Replace with your business number
      to: wa_id,
      type,
      text,
      timestamp: Math.floor(Date.now() / 1000),
      messaging_product: 'whatsapp',
      status: 'sent',
      isFromUser: true, // This message is from the business/user
      contact: {
        profile: {
          name: 'Business', // Your business name
        },
        wa_id: 'your_business_number',
      },
    };

    // Save to database
    const newMessage = await ProcessedMessage.create(messageData);

    // Simulate status updates after a delay (demo purposes)
    setTimeout(async () => {
      try {
        await ProcessedMessage.findByIdAndUpdate(newMessage._id, {
          status: 'delivered'
        });
        
        // Simulate read status after another delay
        setTimeout(async () => {
          try {
            await ProcessedMessage.findByIdAndUpdate(newMessage._id, {
              status: 'read'
            });
          } catch (error) {
            console.error('Error updating read status:', error);
          }
        }, 2000);
      } catch (error) {
        console.error('Error updating delivered status:', error);
      }
    }, 1000);

    return NextResponse.json({
      success: true,
      message: newMessage
    }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
