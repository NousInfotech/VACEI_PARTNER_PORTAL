import { apiGet, apiPost, apiPostFormData } from '../config/base';
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
     * Prefers Supabase direct insert for realtime, falls back to REST API.
     */
    sendMessage: async (
        roomId: string,
        content: { text?: string; fileUrl?: string; type: 'text' | 'image' | 'document' | 'gif'; gifUrl?: string; fileName?: string; fileSize?: string; replyToMessageId?: string | null }
    ) => {
        const currentUserId = getDecodedUserId();
        if (!currentUserId) throw new Error('User not authenticated');

        // Attempt Supabase insert first
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
                    type: content.type.toUpperCase(), // Ensure backend enum match
                    sentAt: new Date().toISOString(),
                    ...(content.replyToMessageId && { replyToMessageId: content.replyToMessageId }),
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            return data;
        } catch (error) {
            console.warn('Supabase insert failed, falling back to REST API:', error);

            // Fallback to REST API
            try {
                const { replyToMessageId: _replyId, ...rest } = content;
                return await apiPost<Message>(endPoints.CHAT.MESSAGES(roomId), {
                    ...rest,
                    type: content.type.toUpperCase(),
                    ...(_replyId && { replyToMessageId: _replyId }),
                });
            } catch (restError) {
                console.error('Message send failed via REST:', restError);
                throw restError;
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
