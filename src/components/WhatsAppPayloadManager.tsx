'use client';

import React, { useState, useEffect } from 'react';
import { Play, RefreshCw, MessageSquare, CheckCircle, AlertCircle, Clock, Eye, Download } from 'lucide-react';

interface ProcessedMessage {
  _id: string;
  id: string;
  meta_msg_id: string;
  from: string;
  to: string;
  contact_name: string;
  contact_wa_id: string;
  message_type: string;
  message_body: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  message_timestamp: string;
  status_timestamp?: string;
  phone_number_id: string;
  display_phone_number: string;
  conversation_id?: string;
  processed_at: string;
}

interface ProcessingResults {
  processed: number;
  messages_inserted: number;
  statuses_updated: number;
  errors: string[];
}

const WhatsAppPayloadManager: React.FC = () => {
  const [messages, setMessages] = useState<ProcessedMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ProcessingResults | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMessages = async (page: number = 1, status: string = '') => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (status) {
        params.append('status', status);
      }
      
      const response = await fetch(`/api/whatsapp/process-payloads?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.data);
        setTotalPages(data.pagination.total_pages);
        setCurrentPage(data.pagination.current_page);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processPayloads = async () => {
    setIsProcessing(true);
    setResults(null);
    
    try {
      const response = await fetch('/api/whatsapp/process-payloads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
        // Refresh the messages list after processing
        await fetchMessages();
      } else {
        console.error('Processing failed:', data.error);
      }
    } catch (error) {
      console.error('Error processing payloads:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Clock size={16} className="text-gray-500" />;
      case 'delivered':
        return <CheckCircle size={16} className="text-blue-500" />;
      case 'read':
        return <Eye size={16} className="text-green-500" />;
      case 'failed':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <MessageSquare size={16} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-gray-100 text-gray-800';
      case 'delivered':
        return 'bg-blue-100 text-blue-800';
      case 'read':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">WhatsApp Business API Payload Manager</h1>
          <p className="text-gray-600">Process WhatsApp webhook payloads and manage message status updates</p>
        </div>

        {/* Controls */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-4">
              <button
                onClick={processPayloads}
                disabled={isProcessing}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <Play size={20} />
                )}
                <span>{isProcessing ? 'Processing...' : 'Process Payloads'}</span>
              </button>

              <button
                onClick={() => fetchMessages(1, selectedStatus)}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  fetchMessages(1, e.target.value);
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="read">Read</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Processing Results */}
          {results && (
            <div className="mt-6 p-4 bg-white rounded-lg border">
              <h3 className="font-semibold text-gray-900 mb-3">Processing Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Files Processed:</span>
                  <span className="ml-2 font-semibold text-blue-600">{results.processed}</span>
                </div>
                <div>
                  <span className="text-gray-600">Messages Inserted:</span>
                  <span className="ml-2 font-semibold text-green-600">{results.messages_inserted}</span>
                </div>
                <div>
                  <span className="text-gray-600">Statuses Updated:</span>
                  <span className="ml-2 font-semibold text-yellow-600">{results.statuses_updated}</span>
                </div>
                <div>
                  <span className="text-gray-600">Errors:</span>
                  <span className="ml-2 font-semibold text-red-600">{results.errors.length}</span>
                </div>
              </div>
              
              {results.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {results.errors.map((error, index) => (
                      <li key={index} className="break-all">• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Messages Table */}
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Processed Messages</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Numbers</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {messages.map((message) => (
                  <tr key={message._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{message.contact_name}</div>
                        <div className="text-sm text-gray-500">{message.contact_wa_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm text-gray-900 truncate">{message.message_body}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Type: {message.message_type}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(message.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(message.status)}`}>
                          {message.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{new Date(message.message_timestamp).toLocaleString()}</div>
                        {message.status_timestamp && (
                          <div className="text-xs text-gray-500 mt-1">
                            Status: {new Date(message.status_timestamp).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>From: {message.from}</div>
                        <div>To: {message.display_phone_number}</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No messages found</h3>
              <p className="mt-1 text-sm text-gray-500">Process some payloads to see messages here.</p>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchMessages(currentPage - 1, selectedStatus)}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchMessages(currentPage + 1, selectedStatus)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPayloadManager;
