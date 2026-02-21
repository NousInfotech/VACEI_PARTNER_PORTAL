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
  status: 'sent' | 'delivered' | 'read' | 'sending';
  replyToId?: string;
  /** ID of the message being replied to (backend: replyToMessageId) */
  replyToMessageId?: string | null;
  /** Parent message object when present (from GET /chat/rooms/:roomId/messages) */
  replyToMessage?: Message | null;
  /** Child messages (replies to this message) */
  replies?: Message[];
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
