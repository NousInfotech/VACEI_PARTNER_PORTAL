import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Message } from '../types';

// import { AttachmentMenu } from './AttachmentMenu';
// import { EmojiPicker } from './EmojiPicker';
// import { GifPicker } from './GifPicker';

interface MessageInputProps {
  onSendMessage: (content: {
    text?: string;
    gifUrl?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
    type: 'text' | 'gif' | 'image' | 'document'
  }) => void;
  replyingTo: Message | null;
  editingMessage: Message | null;
  onCancelReply: () => void;
  onCancelEdit: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  replyingTo,
  editingMessage,
  onCancelReply,
  onCancelEdit
}) => {
  const [message, setMessage] = useState('');

  // Sync message state with editingMessage
  React.useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.text || '');
    } else {
      setMessage('');
    }
  }, [editingMessage]);

  // const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  // const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // const [showGifPicker, setShowGifPicker] = useState(false);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const docInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Focus textarea when replying or editing
  React.useEffect(() => {
    if (replyingTo || editingMessage) {
      textareaRef.current?.focus();
    }
  }, [replyingTo, editingMessage]);

  /*
  const onSelectEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    // Focus after emoji selection too
    textareaRef.current?.focus();
  };

  const onSelectGif = (gifUrl: string) => {
    onSendMessage({ gifUrl, type: 'gif' });
    setShowGifPicker(false);
  };
  */

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage({ text: message, type: 'text' });
      setMessage('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real app, you'd upload this to a server. 
    // For now, we'll mock it by creating an object URL.
    const fileUrl = URL.createObjectURL(file);
    const fileName = file.name;
    const fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB';

    onSendMessage({
      type,
      fileUrl,
      fileName,
      fileSize,
    });

    // Reset input
    e.target.value = '';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-[#f0f2f5] border-t border-gray-200">
      {/* Reply/Edit Preview */}
      {(replyingTo || editingMessage) && (
        <div className="px-4 py-2 bg-white/50 backdrop-blur-sm border-b border-gray-200 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-200">
          <div className="w-1 bg-primary rounded-full self-stretch" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-primary">
                {editingMessage ? 'Edit Message' : `Replying to ${replyingTo?.senderId === 'me' ? 'you' : 'Sender'}`}
              </span>
            </div>
            <p className="text-[13px] text-gray-500 truncate italic">
              {editingMessage?.text || replyingTo?.text || replyingTo?.fileName || 'Media'}
            </p>
          </div>
          <button
            onClick={editingMessage ? onCancelEdit : onCancelReply}
            className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}

      <div className="p-2 flex items-center gap-2 shrink-0 relative">
        <div className="flex items-center gap-1">
          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={imageInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFileSelect(e, 'image')}
          />
          <input
            type="file"
            ref={docInputRef}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => handleFileSelect(e, 'document')}
          />

          {/*
        <button 
          onClick={() => {
            setShowEmojiPicker(!showEmojiPicker);
            setShowGifPicker(false);
            setShowAttachmentMenu(false);
          }}
          className={cn(
            "p-2 hover:bg-gray-200 rounded-full transition-colors",
            showEmojiPicker ? "text-primary bg-gray-200" : "text-gray-500"
          )}
        >
          <Smile className="w-6 h-6" />
        </button>

        <button 
          onClick={() => {
            setShowGifPicker(!showGifPicker);
            setShowEmojiPicker(false);
            setShowAttachmentMenu(false);
          }}
          className={cn(
            "p-1.5 px-2 hover:bg-gray-200 rounded-lg transition-colors text-[10px] font-bold border border-current",
            showGifPicker ? "text-primary bg-gray-200" : "text-gray-500"
          )}
        >
          GIF
        </button>

        <button 
          onClick={() => {
            setShowAttachmentMenu(!showAttachmentMenu);
            setShowEmojiPicker(false);
            setShowGifPicker(false);
          }}
          className={cn(
            "p-2 hover:bg-gray-200 rounded-full transition-colors",
            showAttachmentMenu ? "text-primary bg-gray-200" : "text-gray-500"
          )}
        >
          <Paperclip className="w-6 h-6" />
        </button>

        {showAttachmentMenu && (
          <AttachmentMenu 
            onSelect={(type) => {
              if (type === 'image') imageInputRef.current?.click();
              else if (type === 'document') docInputRef.current?.click();
            }}
            onClose={() => setShowAttachmentMenu(false)}
          />
        )}
        */}
        </div>

        {/*
      {showEmojiPicker && (
        <EmojiPicker 
          onSelect={onSelectEmoji} 
          onClose={() => setShowEmojiPicker(false)} 
        />
      )}

      {showGifPicker && (
        <GifPicker 
          onSelect={onSelectGif} 
          onClose={() => setShowGifPicker(false)} 
        />
      )}
      */}

        <div className="flex-1 relative group/input">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Type a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full bg-white border border-transparent rounded-lg px-3 py-2 text-[15px] outline-none h-10 resize-none flex items-center shadow-sm placeholder:text-gray-400 transition-all focus:border-primary/20"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className={cn(
            "p-2.5 rounded-full transition-all flex items-center justify-center",
            message.trim()
              ? "bg-primary text-white shadow-sm hover:opacity-90 active:scale-95"
              : "text-gray-400 cursor-not-allowed"
          )}
        >
          <Send className="w-5 h-5 fill-current" />
        </button>
      </div>
    </div>
  );
};
