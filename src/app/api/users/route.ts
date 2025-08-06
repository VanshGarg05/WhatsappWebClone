import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

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

    // Find current user to exclude from results
    const currentUser = await User.findById(currentUserId).select('-password');
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Get all users except current user
    const users = await User.find(
      { _id: { $ne: currentUserId } },
      { password: 0 } // Exclude password field
    ).sort({ name: 1 });

    return NextResponse.json({
      success: true,
      users,
      currentUser: {
        id: currentUser._id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        isOnline: currentUser.isOnline,
        lastSeen: currentUser.lastSeen,
        createdAt: currentUser.createdAt
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
