import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ProcessedMessage from '@/models/ProcessedMessage';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get the latest message for each conversation (grouped by wa_id)
    const conversations = await ProcessedMessage.aggregate([
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$wa_id',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isFromUser', false] },
                    { $ne: ['$status', 'read'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          wa_id: '$_id',
          name: '$lastMessage.contact.profile.name',
          lastMessage: {
            _id: '$lastMessage._id',
            text: '$lastMessage.text',
            type: '$lastMessage.type',
            timestamp: '$lastMessage.timestamp',
            status: '$lastMessage.status',
            isFromUser: '$lastMessage.isFromUser',
            createdAt: '$lastMessage.createdAt'
          },
          unreadCount: 1,
          _id: 0
        }
      },
      {
        $sort: { 'lastMessage.timestamp': -1 }
      }
    ]);

    return NextResponse.json(conversations, { status: 200 });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
