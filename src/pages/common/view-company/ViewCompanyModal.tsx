import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    X, 
    Building2, 
    Users, 
    PieChart, 
    Network
} from 'lucide-react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle 
} from "../../../ui/Dialog";
import { Button } from "../../../ui/Button";
import { Skeleton } from "../../../ui/Skeleton";
import { apiGet } from '../../../config/base';
import { endPoints } from '../../../config/endPoint';
import PillTab from '../PillTab';
import type { Company } from '../../../types/company';

// Modular Tab Components
import CompanyDetailsTab from './components/CompanyDetailsTab';
import InvolvementsTab from './components/InvolvementsTab';
import DistributionTab from './components/DistributionTab';
import HierarchyTab from './components/HierarchyTab';

// Skeletons
import CompanyDetailsSkeleton from './components/skeletons/CompanyDetailsSkeleton';
import InvolvementsSkeleton from './components/skeletons/InvolvementsSkeleton';

interface ViewCompanyModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyId: string;
}

const TABS = [
    { id: 'details', label: 'Company Details', icon: Building2 },
    { id: 'involvements', label: 'Involvements', icon: Users },
    { id: 'distribution', label: 'Distribution', icon: PieChart },
    { id: 'hierarchy', label: 'Hierarchy', icon: Network },
];

const ViewCompanyModal: React.FC<ViewCompanyModalProps> = ({ isOpen, onClose, companyId }) => {
    const [activeTab, setActiveTab] = useState('details');
    const [activeInvolvementSubTab, setActiveInvolvementSubTab] = useState<'shareholders' | 'representatives'>('shareholders');

    const { data: realCompany, isLoading: isCompanyLoading } = useQuery<Company>({
        queryKey: ['company', companyId],
        queryFn: () => apiGet<{ data: Company }>(endPoints.COMPANY.GET_BY_ID(companyId!)).then(res => res.data),
        enabled: !!companyId && isOpen,
    });

    const company = realCompany;


    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden bg-gray-50/50">
                <DialogHeader className="p-6 bg-white border-b border-gray-100 flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900 leading-tight">
                                {isCompanyLoading ? (
                                    <Skeleton className="h-7 w-48" />
                                ) : (
                                    company?.name || 'View Company'
                                )}
                            </DialogTitle>
                            <p className="text-sm text-gray-500 font-medium">Read-only view of company architecture</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-gray-100">
                        <X size={20} className="text-gray-500" />
                    </Button>
                </DialogHeader>

                <div className="px-6 py-4 bg-white border-b border-gray-100 overflow-x-auto">
                    <PillTab 
                        tabs={TABS} 
                        activeTab={activeTab} 
                        onTabChange={setActiveTab} 
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="max-w-6xl mx-auto">
                        {activeTab === 'details' && (
                            isCompanyLoading ? <CompanyDetailsSkeleton /> : company && <CompanyDetailsTab company={company} />
                        )}
                        {activeTab === 'involvements' && (
                            isCompanyLoading ? (
                                <InvolvementsSkeleton />
                            ) : (
                                company && (
                                    <InvolvementsTab 
                                        company={company} 
                                        activeInvolvementSubTab={activeInvolvementSubTab}
                                        onSubTabChange={setActiveInvolvementSubTab}
                                    />
                                )
                            )
                        )}
                        {activeTab === 'distribution' && (
                             isCompanyLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-64 w-full rounded-3xl" />
                                </div>
                             ) : company && <DistributionTab company={company} />
                        )}
                        {activeTab === 'hierarchy' && (
                             isCompanyLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-[600px] w-full rounded-3xl" />
                                </div>
                             ) : company && <HierarchyTab company={company} />
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ViewCompanyModal;
