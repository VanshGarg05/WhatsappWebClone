import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get token from cookie
    const token = request.cookies.get('token')?.value;

    if (token) {
      try {
        // Decode token to get user ID
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
        
        // Update user's online status
        await User.findByIdAndUpdate(decoded.userId, {
          isOnline: false,
          lastSeen: new Date()
        });
      } catch (error) {
        console.error('Error updating user status during logout:', error);
      }
    }

    // Create response
    const response = NextResponse.json({ 
      message: 'Logout successful' 
    }, { status: 200 });

    // Clear the cookie
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    
    // Clear cookie even if there's an error
    const response = NextResponse.json({ 
      message: 'Logout successful' 
    }, { status: 200 });

    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    return response;
  }
}
