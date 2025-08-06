import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Chat from '@/models/Chat';
import jwt from 'jsonwebtoken';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const resolvedParams = await params;
    const { userId } = resolvedParams;

    // Mark all unread messages from this user as read
    const result = await Chat.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        isRead: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      message: `Marked ${result.modifiedCount} messages as read`
    }, { status: 200 });

  } catch (error: any) {
    console.error('Mark messages as read error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
