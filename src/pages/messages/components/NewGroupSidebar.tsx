import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Search, Users, X } from 'lucide-react';
import { users as mockUsers } from '../mockData';
import { cn } from '../../../lib/utils';

interface NewGroupSidebarProps {
  onBack: () => void;
  onCreateGroup: (name: string, participantIds: string[]) => void;
}

export const NewGroupSidebar: React.FC<NewGroupSidebarProps> = ({
  onBack,
  onCreateGroup,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [groupName, setGroupName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      onBack();
    }
  };

  const selectedUsersData = mockUsers.filter(u => selectedParticipants.includes(u.id));

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-left duration-300">
      {/* Dynamic Header based on Step */}
      <div className="h-16 bg-[#f0f2f5] flex items-center gap-4 px-4 border-b shrink-0">
        <button 
          type="button"
          onClick={step === 2 ? () => setStep(1) : onBack}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h2 className="text-[16px] font-semibold text-gray-800 leading-tight">
            {step === 1 ? 'Add group participants' : 'New group'}
          </h2>
          {step === 1 && selectedParticipants.length > 0 && (
            <span className="text-[12px] text-gray-500">{selectedParticipants.length} selected</span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {step === 1 ? (
          <>
            {/* Selected Participants Chips */}
            {selectedParticipants.length > 0 && (
              <div className="p-3 border-b border-gray-100 flex flex-wrap gap-2 animate-in fade-in duration-200 max-h-[120px] overflow-y-auto custom-scrollbar">
                {selectedUsersData.map(user => (
                  <div key={user.id} className="flex items-center gap-1.5 bg-gray-100 rounded-full pl-1 pr-2 py-1 border border-gray-200">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                      {user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[12px] font-medium text-gray-700">{user.name}</span>
                    <button 
                      onClick={() => toggleParticipant(user.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Step 1: Participant Search */}
            <div className="p-3 bg-white border-b border-gray-100 flex items-center px-4">
              <div className="relative flex-1 group/search">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within/search:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search name or role"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#f0f2f5] border border-transparent rounded-lg text-sm outline-none transition-all focus:bg-white focus:border-primary/20 placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Participant Selection List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggleParticipant(user.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 hover:bg-[#f5f6f6] transition-all text-left border-b border-gray-50/30",
                    selectedParticipants.includes(user.id) && "bg-[#f5f6f6]"
                  )}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {user.name.substring(0, 2).toUpperCase()}
                    </div>
                    {selectedParticipants.includes(user.id) && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full border-2 border-white flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-normal text-gray-900 truncate">{user.name}</p>
                    <p className="text-sm text-gray-500 truncate lowercase">{user.role.replace('_', ' ')}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Step 1 Floating Ab: NEXT */}
            <div className="p-6 bg-white shrink-0 flex justify-center animate-in slide-in-from-bottom-4 duration-300">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={selectedParticipants.length === 0}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg",
                  selectedParticipants.length > 0
                    ? "bg-primary text-white hover:scale-105 active:scale-95 cursor-pointer"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col p-8 space-y-8 animate-in slide-in-from-right duration-300">
            {/* Step 2 UI: Group Name */}
            <div className="flex flex-col items-center space-y-8">
              <div className="w-24 h-24 rounded-full bg-[#dfe5e7] flex items-center justify-center text-[#54656f] shrink-0">
                <Users className="w-10 h-10" />
              </div>

              <div className="w-full space-y-2">
                <label className="text-xs font-medium text-primary uppercase tracking-wider">Group Subject</label>
                <div className="relative group/subject">
                  <input
                    type="text"
                    placeholder="Provide a group subject"
                    value={groupName}
                    autoFocus
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-0 py-2 bg-transparent border-b-2 border-gray-200 rounded-none text-sm focus:border-primary outline-none transition-all placeholder:text-gray-400"
                  />
                  <span className="absolute right-0 bottom-2 text-xs text-gray-400">{25 - groupName.length}</span>
                </div>
              </div>
            </div>

            {/* Step 2 Floating Ab: CREATE */}
            <div className="mt-auto pb-4 flex justify-center">
              <button
                type="button"
                onClick={handleCreate}
                disabled={groupName.trim().length === 0}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg",
                  groupName.trim().length > 0
                    ? "bg-primary text-white hover:scale-105 active:scale-95 cursor-pointer"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                <Check className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
