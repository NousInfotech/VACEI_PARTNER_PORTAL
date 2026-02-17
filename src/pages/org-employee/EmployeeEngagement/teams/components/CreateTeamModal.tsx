import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Check, Loader2, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../../ui/Dialog';
import { Button } from '../../../../../ui/Button';
import { apiGet, apiPatch } from '../../../../../config/base';
import { endPoints } from '../../../../../config/endPoint';
import { cn } from '../../../../../lib/utils';
import { type ApiResponse } from '../../../../../lib/types';

interface OrgMember {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  role: string;
}

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  engagementId: string;
  currentTeamIds: string[];
}

export default function CreateTeamModal({ isOpen, onClose, engagementId, currentTeamIds }: CreateTeamModalProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(currentTeamIds);

  // Fetch all organization members
  const { data: membersResponse, isLoading } = useQuery({
    queryKey: ['org-members-selection'],
    queryFn: () => apiGet<ApiResponse<OrgMember[]>>(endPoints.ORGANIZATION.GET_MEMBERS, { limit: 100 }),
    enabled: isOpen
  });

  const members = (membersResponse?.data ?? []).filter(m => m.role === 'ORG_EMPLOYEE');

  const filteredMembers = members.filter(member => 
    `${member.user.firstName} ${member.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mutation = useMutation({
    mutationFn: (memberIds: string[]) => 
      apiPatch(endPoints.ENGAGEMENTS.TEAM(engagementId), { orgTeam: memberIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-team', engagementId] });
      onClose();
    }
  });

  const toggleMember = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    mutation.mutate(selectedIds);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-3xl">
        <DialogHeader className="p-8 pb-0 bg-white">
          <DialogTitle className="text-2xl font-bold text-gray-900 font-secondary flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <UserPlus size={24} />
            </div>
            Manage Engagement Team
          </DialogTitle>
          <p className="text-gray-500 mt-2 text-sm">Select members from your organization to assign to this engagement.</p>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-hidden"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading members...</p>
              </div>
            ) : filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => toggleMember(member.id)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border-2",
                    selectedIds.includes(member.id)
                      ? "bg-primary/5 border-primary/20"
                      : "bg-white border-transparent hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold",
                      selectedIds.includes(member.id) ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                    )}>
                      {member.user.firstName[0]}{member.user.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{member.user.firstName} {member.user.lastName}</p>
                      <p className="text-[11px] text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                  {selectedIds.includes(member.id) && (
                    <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center text-white">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-400 text-sm">No members found matching your search.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 pt-4 bg-gray-50/50 flex justify-end gap-3 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Save Assignments
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
