'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatApp from '@/components/ChatApp';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle } from 'lucide-react';

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-600 p-6 rounded-full">
              <MessageCircle size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">WhatsApp Web</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Show chat app if user is authenticated
  if (isAuthenticated && user) {
    return <ChatApp />;
  }

  // Don't render anything if redirecting
  return null;
}
