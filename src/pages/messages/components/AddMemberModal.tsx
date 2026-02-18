import React, { useState } from 'react';
import { X, UserPlus, Search, Loader2, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../config/base';
import { endPoints } from '../../../config/endPoint';
import { cn } from '../../../lib/utils';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMembers: (userIds: string[]) => void;
  existingParticipantIds: string[];
  isAdding?: boolean;
}

interface MemberResponseItem {
  id: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  role: string;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onAddMembers,
  existingParticipantIds,
  isAdding,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const { data: membersResponse, isLoading } = useQuery({
    queryKey: ['org-members', searchQuery],
    queryFn: () => apiGet<{ data: MemberResponseItem[] }>(endPoints.ORGANIZATION.GET_MEMBERS, {
      params: { search: searchQuery, limit: 100 }
    }),
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const members = membersResponse?.data || [];
  
  // Filter out users who are already in the group
  const availableMembers = members.filter(m => !existingParticipantIds.includes(m.userId));

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleAddClick = () => {
    if (selectedUserIds.length > 0) {
      onAddMembers(selectedUserIds);
      setSelectedUserIds([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="h-16 bg-[#f0f2f5] flex items-center justify-between px-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Add Members
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Search Input */}
          <div className="relative group/search">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within/search:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>

          {/* Members List */}
          <div className="max-h-80 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-sm">Fetching employees...</span>
              </div>
            ) : availableMembers.length > 0 ? (
              availableMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  disabled={isAdding}
                  onClick={() => toggleUserSelection(member.userId)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent transition-all text-left group",
                    selectedUserIds.includes(member.userId) && "bg-primary/5 border-primary/10",
                    isAdding && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {(member.user?.firstName?.[0] || 'U')}{(member.user?.lastName?.[0] || '')}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {member.user?.firstName || 'Unknown'} {member.user?.lastName || 'User'}
                    </p>
                    <p className="text-[11px] text-gray-500 lowercase">
                      {(member.role || 'MEMBER').replace('_', ' ')}
                    </p>
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                    selectedUserIds.includes(member.userId)
                      ? "bg-primary border-primary"
                      : "border-gray-200 group-hover:border-gray-300"
                  )}>
                    {selectedUserIds.includes(member.userId) && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              ))
            ) : (
              <div className="py-12 text-center text-gray-500">
                {searchQuery ? 'No employees found' : 'Start typing to search'}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isAdding || selectedUserIds.length === 0}
            onClick={handleAddClick}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2",
              selectedUserIds.length > 0
                ? "bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95"
                : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
            )}
          >
            {isAdding && <Loader2 className="w-4 h-4 animate-spin" />}
            Add {selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ''} Members
          </button>
        </div>
      </div>
    </div>
  );
};
