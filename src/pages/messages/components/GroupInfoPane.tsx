import React from 'react';
import { X, Users, Mail, Info } from 'lucide-react';
import type { User } from '../types';
import { cn } from '../../../lib/utils';

interface GroupInfoPaneProps {
  name: string;
  type: 'INDIVIDUAL' | 'GROUP';
  participants: User[];
  onClose: () => void;
}

export const GroupInfoPane: React.FC<GroupInfoPaneProps> = ({
  name,
  type,
  participants,
  onClose,
}) => {
  return (
    <div className="w-[400px] bg-[#f0f2f5] h-full border-l border-gray-100 flex flex-col animate-in slide-in-from-right duration-300 shadow-xl z-20 overflow-hidden">
      {/* Header */}
      <div className="h-16 flex items-center px-4 bg-white shrink-0 gap-6 border-b border-gray-100">
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="font-medium text-gray-900">
          {type === 'GROUP' ? 'Group Info' : 'Contact Info'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Profile Card */}
        <div className="bg-white px-8 py-7 flex flex-col items-center shadow-sm mb-2.5">
          <div className={cn(
            "w-[140px] h-[140px] rounded-full flex items-center justify-center mb-5 shrink-0 select-none",
            type === 'GROUP' 
              ? "bg-[#dfe5e7] text-[#54656f]" 
              : "bg-primary/10 text-primary font-bold text-3xl"
          )}>
            {type === 'GROUP' ? (
              <Users className="w-16 h-16" />
            ) : (
              name.substring(0, 2).toUpperCase()
            )}
          </div>
          <h2 className="text-xl font-normal text-gray-900 text-center mb-1">{name}</h2>
          {type === 'GROUP' && (
            <span className="text-[13px] text-gray-500">Group · {participants.length} members</span>
          )}
        </div>

        {/* Action List (Optional for now, but feels premium) */}
        {type === 'INDIVIDUAL' && (
          <div className="bg-white mb-2.5 shadow-sm p-4 space-y-4">
             <div className="flex items-center gap-4 text-gray-600">
               <Info className="w-5 h-5 opacity-60" />
               <div className="flex flex-col">
                 <span className="text-sm text-gray-500 italic">No status set</span>
                 <span className="text-[12px] text-gray-400 mt-0.5 uppercase tracking-wide font-medium">About</span>
               </div>
             </div>
             <div className="flex items-center gap-4 text-gray-600">
               <Mail className="w-5 h-5 opacity-60" />
               <span className="text-sm">{participants[0]?.id}@vacei.org</span>
             </div>
          </div>
        )}

        {/* Participants Section */}
        {type === 'GROUP' && (
          <div className="bg-white shadow-sm pt-4 pb-2">
            <h3 className="px-8 text-[14px] text-gray-500 mb-4">{participants.length} members</h3>
            
            <div className="divide-y divide-gray-50">
              {participants.map((member) => (
                <div key={member.id} className="px-8 py-3 flex items-center gap-4 hover:bg-[#f5f6f6] cursor-pointer transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                    {member.name.substring(0, 2)}
                  </div>
                  <div className="flex-1 flex flex-col border-b border-gray-50 transition-colors group-hover:border-transparent pb-0.5">
                    <span className="text-[15px] font-normal text-gray-900">{member.name}</span>
                    <span className="text-[13px] text-gray-500">{member.role || 'Member'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
