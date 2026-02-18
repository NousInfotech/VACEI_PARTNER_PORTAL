export type UserRole = 'ORG_ADMIN' | 'ORG_EMPLOYEE';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole | string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface Message {
  id: string;
  senderId: string;
  type?: 'text' | 'gif' | 'image' | 'document';
  text?: string;
  gifUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  replyToId?: string;
  isEdited?: boolean;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  isDeleted?: boolean;
  createdAt?: number; // Timestamp in milliseconds for edit window calculation
}

export type ChatType = 'INDIVIDUAL' | 'GROUP';

export interface Chat {
  id: string;
  type: ChatType;
  name: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  category?: 'ORGANIZATION' | 'CLIENT';
  messages: Message[];
}
