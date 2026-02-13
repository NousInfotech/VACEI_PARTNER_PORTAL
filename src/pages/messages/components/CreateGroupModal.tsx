import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { users as mockUsers } from '../mockData';
import { cn } from '../../../lib/utils';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, participantIds: string[]) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
}) => {
  const [groupName, setGroupName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = () => {
    if (groupName.trim() && selectedParticipants.length > 0) {
      onCreateGroup(groupName.trim(), selectedParticipants);
      setGroupName('');
      setSelectedParticipants([]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="h-16 bg-[#f0f2f5] flex items-center justify-between px-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Create New Group
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Group Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 ml-1">Group Name</label>
            <input
              type="text"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>

          {/* Participant Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 ml-1">
              Select Participants ({selectedParticipants.length})
            </label>
            <div className="max-h-60 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
              {mockUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggleParticipant(user.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                    selectedParticipants.includes(user.id) 
                      ? "bg-primary/5 border border-primary/20" 
                      : "hover:bg-gray-50 border border-transparent"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-[11px] text-gray-500 capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                    selectedParticipants.includes(user.id)
                      ? "bg-primary border-primary"
                      : "border-gray-200 group-hover:border-gray-300"
                  )}>
                    {selectedParticipants.includes(user.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={groupName.trim().length === 0 || selectedParticipants.length === 0}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-all",
              (groupName.trim().length > 0 && selectedParticipants.length > 0)
                ? "bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95"
                : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
            )}
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
};
