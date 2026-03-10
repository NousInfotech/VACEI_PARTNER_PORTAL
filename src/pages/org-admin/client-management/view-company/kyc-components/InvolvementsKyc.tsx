import React, { useState } from 'react';
import { UserPlus, Plus } from 'lucide-react';
import type { KycWorkflow } from './types';
import PersonKycCard from './PersonKycCard';
import { Button } from '../../../../../ui/Button';
import InvolvementKycModal from './InvolvementKycModal';

interface InvolvementsKycProps {
  workflows: KycWorkflow[];
  companyId: string;
  kycId?: string;
  isReadOnly?: boolean;
}

const InvolvementsKyc: React.FC<InvolvementsKycProps> = ({ workflows, companyId, kycId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const filteredWorkflows = workflows.filter(w => w.workflowType === 'Shareholder' || w.workflowType === 'Representative');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-300 shadow-sm">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-2">Active Involvements</h4>
        <div className="flex items-center gap-2">
          <Button 
              variant="outline"
              size="sm"
              className="rounded-xl border-dashed border-gray-200 text-primary hover:bg-primary/5 h-10 px-4 font-bold uppercase tracking-wider text-[10px]"
              onClick={() => setIsModalOpen(true)}
          >
              <UserPlus size={16} className="mr-2" />
              Add Involvements
          </Button>
        </div>
      </div>

      {filteredWorkflows.length === 0 ? (
        <div className="p-16 text-center text-gray-400 bg-white/50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-600">
              <UserPlus size={40} className="opacity-60" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Involvement KYC Cycles</h3>
          <p className="max-w-xs text-sm text-gray-500 font-medium mb-8">
            You haven't initialized any KYC workflows for shareholders or representatives of this company yet.
          </p>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all px-8 h-12 font-bold uppercase tracking-widest text-xs"
          >
            <Plus size={18} className="mr-2" />
            Add Person
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredWorkflows.map(workflow => (
            <div key={workflow._id} className="space-y-4">
              {workflow.documentRequests.map(request => (
                <PersonKycCard 
                  key={request._id} 
                  personKyc={request}
                  companyId={companyId}
                  kycId={kycId}
                  workflowId={workflow._id}
                  workflowStatus={workflow.status}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      <InvolvementKycModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        companyId={companyId}
        kycId={kycId || ''}
        workflows={workflows}
        onSuccess={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default InvolvementsKyc;

