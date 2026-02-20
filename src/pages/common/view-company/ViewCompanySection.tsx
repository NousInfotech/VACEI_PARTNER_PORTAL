import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    Building2, 
    Users, 
    PieChart, 
    Network,
    ClipboardList
} from 'lucide-react';
import { ShadowCard } from "../../../ui/ShadowCard";
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
import IncorporationTab from './components/IncorporationTab';

// Skeletons
import CompanyDetailsSkeleton from './components/skeletons/CompanyDetailsSkeleton';
import InvolvementsSkeleton from './components/skeletons/InvolvementsSkeleton';

interface ViewCompanySectionProps {
    companyId?: string;
    engagementId?: string;
}

const TABS = [
    { id: 'details', label: 'Company Details', icon: Building2 },
    { id: 'involvements', label: 'Involvements', icon: Users },
    { id: 'distribution', label: 'Distribution', icon: PieChart },
    { id: 'hierarchy', label: 'Hierarchy', icon: Network },
    { id: 'incorporation', label: 'Incorporation', icon: ClipboardList },
];

const ViewCompanySection: React.FC<ViewCompanySectionProps> = ({ companyId: initialCompanyId, engagementId }) => {
    const [activeTab, setActiveTab] = useState('details');
    const [activeInvolvementSubTab, setActiveInvolvementSubTab] = useState<'shareholders' | 'representatives'>('shareholders');

    const { data: engagementData } = useQuery({
        queryKey: ['engagement-minimal', engagementId],
        queryFn: () => apiGet<any>(endPoints.ENGAGEMENTS.GET_BY_ID(engagementId!)).then(res => res.data || res),
        enabled: !!engagementId && !initialCompanyId,
    });

    const companyId = initialCompanyId || engagementData?.companyId;

    const { data: realCompany, isLoading: isCompanyLoading } = useQuery<Company>({
        queryKey: ['company', companyId],
        queryFn: () => apiGet<any>(endPoints.COMPANY.GET_BY_ID(companyId!)).then(res => res.data || res),
        enabled: !!companyId,
    });

    const company = realCompany;


    return (
        <div id="company-details-section">
            <ShadowCard className="overflow-hidden bg-gray-50/30 border border-gray-100 rounded-[2.5rem] animate-in slide-in-from-bottom-8 duration-700">
            <div className="p-6 md:p-8 bg-white border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary shrink-0">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                            {isCompanyLoading ? (
                                <Skeleton className="h-8 w-64" />
                            ) : (
                                company?.name || 'Company Profile'
                            )}
                        </h2>
                        <p className="text-sm text-gray-500 font-medium mt-1">Comprehensive view of company architecture and records</p>
                    </div>
                </div>
            </div>

            <div className="px-6 md:px-8 py-4 bg-white border-b border-gray-100">
                <PillTab 
                    tabs={TABS} 
                    activeTab={activeTab} 
                    onTabChange={setActiveTab} 
                />
            </div>

            <div className="p-6 md:p-8">
                <div className="mx-auto">
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
                     {activeTab === 'incorporation' && (
                          isCompanyLoading ? (
                             <div className="space-y-4">
                                 <Skeleton className="h-[400px] w-full rounded-3xl" />
                             </div>
                          ) : company && <IncorporationTab company={company} />
                     )}
                </div>
            </div>
        </ShadowCard>
        </div>
    );
};

export default ViewCompanySection;
