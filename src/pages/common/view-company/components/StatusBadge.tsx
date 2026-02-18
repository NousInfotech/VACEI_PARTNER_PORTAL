import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const isSuccess = ['APPROVED', 'VERIFIED', 'COMPLETED'].includes(status);
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
            isSuccess ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
        }`}>
            {status}
        </span>
    );
};

export default StatusBadge;
