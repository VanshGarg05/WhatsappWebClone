import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMessageTime(timestamp: number | string | Date): string {
  const date = new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp);
  
  if (isToday(date)) {
    return format(date, 'HH:mm');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'dd/MM/yyyy');
  }
}

export function formatFullMessageTime(timestamp: number | string | Date): string {
  const date = new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp);
  return format(date, 'dd/MM/yyyy HH:mm');
}

export function formatConversationTime(timestamp: number | string | Date): string {
  const date = new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp);
  
  if (isToday(date)) {
    return format(date, 'HH:mm');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 7) {
      return format(date, 'EEEE'); // Day of week
    } else {
      return format(date, 'dd/MM/yyyy');
    }
  }
}

export function getMessagePreview(message: any): string {
  switch (message.type) {
    case 'text':
      return message.text || '';
    case 'image':
      return '📷 Image' + (message.image?.caption ? `: ${message.image.caption}` : '');
    case 'document':
      return '📄 Document' + (message.document?.filename ? `: ${message.document.filename}` : '');
    case 'audio':
      return '🎵 Audio';
    case 'video':
      return '🎥 Video' + (message.video?.caption ? `: ${message.video.caption}` : '');
    case 'location':
      return '📍 Location' + (message.location?.name ? `: ${message.location.name}` : '');
    default:
      return 'Message';
  }
}

export function getStatusIcon(status: string): string {
  switch (status) {
    case 'sent':
      return '✓';
    case 'delivered':
      return '✓✓';
    case 'read':
      return '✓✓';
    case 'failed':
      return '❌';
    default:
      return '';
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateAvatarColor(seed: string): string {
  const colors = [
    '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
    '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50',
    '#f1c40f', '#e67e22', '#e74c3c', '#95a5a6', '#f39c12',
    '#d35400', '#c0392b', '#bdc3c7', '#7f8c8d'
  ];
  
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}
