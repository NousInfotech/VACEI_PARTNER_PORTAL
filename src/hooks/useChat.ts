import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '../api/chatService';
import { supabase } from '../lib/supabase';
import type { Message, Chat } from '../pages/messages/types';
import { getDecodedUserId } from '../utils/authUtils';

interface UseChatOptions {
    partnerId?: string;
    contextualChatId?: string;
    roomId?: string; // Add explicit room ID option
}

export function useChat(engagementId?: string, options: UseChatOptions = {}) {
    const [roomId, setRoomId] = useState<string | null>(options.roomId || null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [room, setRoom] = useState<Chat | null>(null);

    const currentUserId = getDecodedUserId();

    // keeping track of the subscription to unsubscribe on unmount
    const subscriptionRef = useRef<any>(null);

    /**
     * 1. Resolve Room
     */
    useEffect(() => {
        let isMounted = true;

        const resolveRoom = async () => {
            // If explicit roomId is provided, use it primarily
            if (options.roomId) {
                if (roomId !== options.roomId) {
                    setRoomId(options.roomId);
                }
                // We still want to fetch room details to get members/name etc.
                try {
                    const fullRoom = await chatService.getRoomById(options.roomId);
                    if (isMounted) {
                        setRoom(fullRoom.data);
                        setIsLoading(false); // We have the room, loading done (messages load in next effect)
                    }
                } catch (err) {
                    console.error('Chat: Failed to fetch explicit room details', err);
                    // Even if details fail, we have the ID to subscribe.
                    if (isMounted) setIsLoading(false);
                }
                return;
            }

            if (!engagementId) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                // Try getting the engagement room
                const roomResponse = await chatService.getRoomByEngagementId(engagementId);

                if (isMounted && roomResponse?.data?.id) {
                    console.log('Chat: Resolved Room ID:', roomResponse.data.id);
                    setRoomId(roomResponse.data.id);
                    // Also fetch full room details if needed
                    const fullRoom = await chatService.getRoomById(roomResponse.data.id);
                    console.log('Chat: Full Room Details:', fullRoom.data);
                    if (fullRoom.data?.members) {
                        const memberIds = fullRoom.data.members.map((m: any) => m.userId);
                        console.log('Chat: Room Members:', memberIds);
                        console.log('Chat: Am I a member?', memberIds.includes(currentUserId));
                    }
                    setRoom(fullRoom.data);
                }
            } catch (err: any) {
                console.warn('Failed to resolve engagement room:', err);
                if (isMounted) setError('Could not access chat room.');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        resolveRoom();

        return () => {
            isMounted = false;
        };
    }, [engagementId, options.partnerId, options.roomId]);

    /**
     * 2. Load Initial Messages & Subscribe to Realtime
     */
    useEffect(() => {
        if (!roomId) return;

        const loadMessagesAndSubscribe = async () => {
            try {
                // Fetch initial messages
                const msgs = await chatService.getMessages(roomId);
                if (msgs?.data) {
                    const mappedMessages = msgs.data.map((msg: any) => {
                        let t = msg.sentAt || msg.sent_at || msg.created_at;
                        if (t && !t.endsWith('Z') && !t.includes('+') && !t.match(/-\d{2}:\d{2}$/)) t += 'Z';

                        return {
                            id: msg.id,
                            senderId: msg.senderId || msg.sender_id,
                            text: msg.content || msg.text,
                            fileUrl: msg.fileUrl || msg.file_url,
                            fileName: msg.fileName || msg.file_name,
                            fileSize: msg.fileSize || msg.file_size,
                            type: (msg.type || 'text').toLowerCase(),
                            timestamp: t,
                            status: 'sent', // Default to sent for history
                            createdAt: new Date(t || new Date()).getTime(),
                            // Map other fields if necessary
                        };
                    });

                    // Ensure messages are sorted by timestamp
                    const sorted = (mappedMessages as Message[]).sort((a, b) =>
                        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    );
                    setMessages(sorted);
                }

                // Set the access token for Realtime RLS
                const token = localStorage.getItem('token');
                if (token) {
                    supabase.realtime.setAuth(token);
                }

                // Subscribe to Realtime
                if (subscriptionRef.current) {
                    supabase.removeChannel(subscriptionRef.current);
                }

                const channel = supabase.channel(`room:${roomId}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'ChatMessage',
                            filter: `roomId=eq.${roomId}`
                        },
                        (payload) => {
                            console.log('New message received:', payload);
                            const newMsg = payload.new as any; // Cast to avoid type issues with raw payload

                            // Map payload to Message type (handling both snake_case and camelCase)
                            let t = newMsg.sentAt || newMsg.sent_at || newMsg.created_at;
                            if (t && !t.endsWith('Z') && !t.includes('+') && !t.match(/-\d{2}:\d{2}$/)) t += 'Z';

                            const mappedMsg: Message = {
                                id: newMsg.id,
                                senderId: newMsg.senderId || newMsg.sender_id,
                                text: newMsg.content,
                                fileUrl: newMsg.fileUrl || newMsg.file_url,
                                fileName: newMsg.fileName || newMsg.file_name,
                                fileSize: newMsg.fileSize || newMsg.file_size,
                                type: (newMsg.type || 'text').toLowerCase(),
                                timestamp: t,
                                status: 'sent',
                                createdAt: new Date(t || new Date()).getTime()
                            };

                            setMessages((prev) => {
                                // Avoid duplicates
                                if (prev.find(m => m.id === mappedMsg.id)) return prev;
                                return [...prev, mappedMsg];
                            });
                        }
                    )
                    .subscribe((status) => {
                        console.log(`[Realtime] Subscription status for room ${roomId}:`, status);
                    });

                subscriptionRef.current = channel;

            } catch (err) {
                console.error('Error loading messages or subscribing:', err);
            }
        };

        loadMessagesAndSubscribe();

        return () => {
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
            }
        };
    }, [roomId]);


    /**
     * Actions
     */
    const sendMessage = useCallback(async (content: Parameters<typeof chatService.sendMessage>[1]) => {
        if (!roomId) return;

        // Optimistic UI Update
        const tempId = `temp-${Date.now()}`;
        const tempMessage: Message = {
            id: tempId,
            senderId: 'me', // Or currentUserId
            text: content.text,
            fileUrl: content.fileUrl || content.gifUrl,
            fileName: content.fileName,
            fileSize: content.fileSize,
            type: content.type,
            timestamp: new Date().toISOString(),
            status: 'sending',
            createdAt: Date.now()
        };

        // Add temp message immediately
        setMessages((prev) => [...prev, tempMessage]);

        try {
            const sentMessageData = await chatService.sendMessage(roomId, content);

            if (sentMessageData) {
                const newMsg = sentMessageData;
                let t = newMsg.sentAt || newMsg.sent_at;
                if (t && !t.endsWith('Z') && !t.includes('+') && !t.match(/-\d{2}:\d{2}$/)) t += 'Z';

                const mappedMsg: Message = {
                    id: newMsg.id,
                    senderId: newMsg.senderId || newMsg.sender_id,
                    text: newMsg.content,
                    fileUrl: newMsg.fileUrl || newMsg.file_url || newMsg.gifUrl,
                    fileName: newMsg.fileName || newMsg.file_name,
                    fileSize: newMsg.fileSize || newMsg.file_size,
                    type: (newMsg.type || 'text').toLowerCase(),
                    timestamp: t || new Date().toISOString(),
                    status: 'sent',
                    createdAt: new Date(t || new Date()).getTime()
                };

                // Replace temp message with real one
                setMessages((prev) => prev.map(m => m.id === tempId ? mappedMsg : m));
            }
        } catch (e) {
            console.error('Failed to send message', e);
            // Mark as failed or remove
            setMessages((prev) => prev.filter(m => m.id !== tempId)); // Removing for now, could show error state
            throw e;
        }
    }, [roomId]);

    const uploadFile = useCallback(async (file: File) => {
        return await chatService.uploadFile(file);
    }, []);

    const markAsRead = useCallback(async () => {
        if (!roomId) return;
        await chatService.markAsRead(roomId);
    }, [roomId]);

    return {
        roomId,
        room,
        messages,
        isLoading,
        error,
        sendMessage,
        uploadFile,
        markAsRead,
        currentUserId
    };
}
