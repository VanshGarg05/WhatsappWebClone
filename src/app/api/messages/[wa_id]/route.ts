import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ProcessedMessage from '@/models/ProcessedMessage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wa_id: string }> }
) {
  try {
    await connectToDatabase();

    const resolvedParams = await params;
    const wa_id = resolvedParams.wa_id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Get messages for the specific wa_id
    const messages = await ProcessedMessage.find({ wa_id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Reverse to show oldest first in UI
    messages.reverse();

    // Mark messages as read (optional - for read receipts)
    await ProcessedMessage.updateMany(
      { wa_id, isFromUser: false, status: { $ne: 'read' } },
      { status: 'read' }
    );

    return NextResponse.json({
      messages,
      page,
      limit,
      hasMore: messages.length === limit
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mark messages as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ wa_id: string }> }
) {
  try {
    await connectToDatabase();

    const resolvedParams = await params;
    const wa_id = resolvedParams.wa_id;
    
    await ProcessedMessage.updateMany(
      { wa_id, isFromUser: false, status: { $ne: 'read' } },
      { status: 'read' }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
