import { apiDelete, apiGet, apiPost, apiPostFormData } from '../config/base';
import { endPoints } from '../config/endPoint';
import { supabase } from '../lib/supabase';
import { getDecodedUserId } from '../utils/authUtils';
import type { Message } from '../pages/messages/types';

export const chatService = {
    /**
     * Get the chat room for a specific engagement.
     */
    getRoomByEngagementId: async (engagementId: string) => {
        try {
            return await apiGet<any>(endPoints.ENGAGEMENTS.CHAT_ROOM(engagementId));
        } catch (error) {
            console.error('Error fetching engagement room:', error);
            throw error;
        }
    },

    /**
     * Get a specific chat room by its ID.
     */
    getRoomById: async (roomId: string) => {
        try {
            return await apiGet<any>(endPoints.CHAT.ROOM_BY_ID(roomId));
        } catch (error) {
            console.error('Error fetching room:', error);
            throw error;
        }
    },

    /**
     * Create a direct chat room with a partner.
     */
    createDirectRoom: async (partnerId: string, title: string = 'Chat with partner') => {
        const currentUserId = getDecodedUserId();
        if (!currentUserId) throw new Error('User not authenticated');

        const memberIds = [currentUserId, partnerId].sort();

        try {
            return await apiPost<any>(endPoints.CHAT.ROOMS, {
                title,
                contextType: 'DIRECT',
                memberIds,
            });
        } catch (error) {
            console.error('Error creating direct room:', error);
            throw error;
        }
    },

    /**
     * Add members to a group chat.
     */
    addMembers: async (roomId: string, userIds: string[]) => {
        try {
            return await apiPost(endPoints.CHAT.MEMBERS(roomId), { userIds });
        } catch (error) {
            console.error('Error adding members:', error);
            throw error;
        }
    },

    /**
     * Send a message to a chat room.
     * Prefers REST API so backend creates notifications; falls back to Supabase direct insert.
     */
    sendMessage: async (
        roomId: string,
        content: { text?: string; fileUrl?: string; type: 'text' | 'image' | 'document' | 'gif'; gifUrl?: string; fileName?: string; fileSize?: string; replyToMessageId?: string | null }
    ) => {
        const currentUserId = getDecodedUserId();
        if (!currentUserId) throw new Error('User not authenticated');

        // Prefer REST API so backend creates notifications for other room members
        try {
            const { replyToMessageId: _replyId, ...rest } = content;
            const res = await apiPost<Message | { data?: Message }>(endPoints.CHAT.MESSAGES(roomId), {
                ...rest,
                content: content.text,
                type: content.type?.toUpperCase?.() || 'TEXT',
                ...(_replyId && { replyToMessageId: _replyId }),
            });
            return (res as any)?.data ?? res;
        } catch (error) {
            console.warn('REST send failed, falling back to Supabase:', error);

            try {
                const { data, error } = await supabase
                    .from('ChatMessage')
                    .insert({
                        roomId,
                        senderId: currentUserId,
                        content: content.text,
                        fileUrl: content.fileUrl || content.gifUrl,
                        fileName: content.fileName,
                        fileSize: content.fileSize,
                        type: content.type?.toUpperCase?.() || 'TEXT',
                        sentAt: new Date().toISOString(),
                        ...(content.replyToMessageId && { replyToMessageId: content.replyToMessageId }),
                    })
                    .select()
                    .single();

                if (error) throw error;
                chatService.notifyRoomMembers(roomId, content.text || '', data?.id).catch(() => {});
                return data;
            } catch (supabaseError) {
                console.error('Message send failed', supabaseError);
                throw supabaseError;
            }
        }
    },

    /**
     * Upload a file for chat.
     */
    uploadFile: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await apiPostFormData<{ data: { url?: string; fileUrl?: string } }>(endPoints.CHAT.UPLOAD, formData);
            return response.data?.url || response.data?.fileUrl || '';
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    },

    clearRoom: async (roomId: string) => {
        try {
            await apiDelete(endPoints.CHAT.CLEAR_MESSAGES(roomId));
        } catch (error) {
            console.error('Error clearing chat:', error);
            throw error;
        }
    },

    notifyRoomMembers: async (roomId: string, content: string, messageId?: string) => {
        try {
            await apiPost(endPoints.CHAT.NOTIFY_MEMBERS(roomId), { content, messageId });
        } catch (e) {
            console.warn('Failed to notify room members:', e);
        }
    },

    markAsRead: async (_roomId: string) => {
        // Feature disabled until backend endpoint /read is implemented
        // try {
        //     return await apiPost(endPoints.CHAT.MARK_READ(roomId));
        // } catch (error: any) {
        //     if (error.response && error.response.status === 404) {
        //         // Endpoint might not exist yet, ignore
        //         return;
        //     }
        //     console.warn('Error marking as read:', error);
        // }
    },

    /**
     * Fetch messages for a room (initial load).
     */
    getMessages: async (roomId: string) => {
        try {
            return await apiGet<any>(endPoints.CHAT.MESSAGES(roomId));
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    }
};
