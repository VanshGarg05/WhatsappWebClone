import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Chat from '@/models/Chat';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get token from cookie or Authorization header
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify token
    let currentUserId;
    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
      currentUserId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Convert currentUserId to ObjectId if it's a string
    const receiverObjectId = typeof currentUserId === 'string' ? new mongoose.Types.ObjectId(currentUserId) : currentUserId;
    
    // Get unread message counts for each user that has messages with current user
    const unreadCounts = await Chat.aggregate([
      {
        $match: {
          receiver: receiverObjectId,
          isRead: false
        }
      },
      {
        $group: {
          _id: '$sender',
          unreadCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'sender',
          pipeline: [
            {
              $project: { name: 1, email: 1 }
            }
          ]
        }
      },
      {
        $unwind: '$sender'
      },
      {
        $project: {
          userId: { $toString: '$_id' },
          unreadCount: 1,
          senderName: '$sender.name'
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      unreadCounts
    }, { status: 200 });

  } catch (error: any) {
    console.error('Get unread counts error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
