import React from 'react';

export const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', 
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '🤨', '🧐', '👋', '🤚', '🖐', '✋',
  '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
  '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜',
  '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪',
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  return (
    <div className="absolute bottom-full mb-2 left-0 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex justify-between items-center mb-2 px-2 pt-1">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Frequently Used</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xs">ESC</button>
      </div>
      <div className="grid grid-cols-8 gap-1 h-48 overflow-y-auto pr-1">
        {EMOJI_LIST.map((emoji, i) => (
          <button
            key={i}
            onClick={() => onSelect(emoji)}
            className="text-xl hover:bg-gray-100 p-1.5 rounded-lg transition-colors flex items-center justify-center"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
