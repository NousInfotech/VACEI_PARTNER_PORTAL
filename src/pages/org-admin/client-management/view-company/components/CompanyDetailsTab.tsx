import React, { useState } from 'react';
import { 
    Building2, 
    MapPin, 
    Globe, 
    Clock, 
    FileText, 
    PieChart, 
    BarChart3,
    Edit3
} from 'lucide-react';
import { ShadowCard } from '../../../../../ui/ShadowCard';
import { Button } from '../../../../../ui/Button';
import type { Company } from '../../../../../types/company';
import EditCompanyModal from './EditCompanyModal';
import { useQueryClient } from '@tanstack/react-query';

interface CompanyDetailsTabProps {
    company: Company;
    isReadOnly?: boolean;
}

const CompanyDetailsTab: React.FC<CompanyDetailsTabProps> = ({ company, isReadOnly }) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const queryClient = useQueryClient();

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['company', company.id] });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <ShadowCard className="p-4 border border-gray-100">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-5">
                        <div className="p-3 rounded-2xl text-primary shadow-sm border border-blue-100">
                            <Building2 size={25} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-semibold tracking-tight">{company.name}</h2>
                            <div className="flex items-center space-x-2 mt-1">
                                <p className="text-xs font-medium uppercase tracking-widest ">Registration Number :</p>
                                <span className="font-mono text-sm font-semibold bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{company.registrationNumber || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    {!isReadOnly && (
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsEditModalOpen(true)}
                            className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 transition-all flex items-center gap-2"
                        >
                            <Edit3 size={16} />
                            Edit Details
                        </Button>
                    )}
                </div>
            </ShadowCard>

            <EditCompanyModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={handleSuccess}
                company={company}
            />

            {/* Share Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ShadowCard className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
                    <div className="flex items-center space-x-2 mb-2">
                        <PieChart size={20} className="text-gray-500" />
                        <h3 className="font-medium text-gray-500 uppercase tracking-wider">Authorized Shares</h3>
                    </div>
                    <p className="text-2xl font-medium">{(company.authorizedShares || 0).toLocaleString()}</p>
                    <p className="text-gray-500 text-sm mt-1">Total shares authorized</p>
                </ShadowCard>

                <ShadowCard className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
                    <div className="flex items-center space-x-2 mb-2">
                        <BarChart3 size={20} className="text-gray-500" />
                        <h3 className="font-medium text-gray-500 uppercase tracking-wider">Issued Shares</h3>
                    </div>
                    <p className="text-2xl font-medium">{(company.issuedShares || 0).toLocaleString()}</p>
                    <p className="text-gray-500 text-sm mt-1">Total shares currently issued</p>
                </ShadowCard>
            </div>
            
            {/* Shares Breakdown Section */}
            {company.shareClasses && company.shareClasses.length > 0 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {company.shareClasses.map((share, index) => (
                            <ShadowCard key={index} className="p-4 rounded-xl border-gray-100 flex items-center justify-between">
                                <p className="text-[14px] font-medium uppercase tracking-widest group-hover:text-primary">
                                    {share.class.startsWith('CLASS_') 
                                        ? share.class.replace('CLASS_', 'Class ') 
                                        : (share.class.length === 1 
                                            ? `Class ${share.class}` 
                                            : share.class.charAt(0).toUpperCase() + share.class.slice(1).toLowerCase())} :
                                </p>
                                <div className="flex flex-col items-end">
                                    <p className="text-[14px] font-medium tracking-wide">{share.issued.toLocaleString()}</p>
                                    {share.perShareValue != null && Number(share.perShareValue) > 0 && (
                                        <p className="text-[15px] text-gray-400 font-medium border border-gray-400 rounded-lg px-3 py-1">€{Number(share.perShareValue).toFixed(2)} / share</p>
                                    )}
                                </div>
                            </ShadowCard> 
                        ))}
                        {/* Calculated Remaining Ordinary Shares if not explicitly provided */}
                        {!(company.shareClasses.some(s => s.class === 'ORDINARY')) && (
                            <ShadowCard className="bg-gray-50 p-4 rounded-xl border-gray-100 flex items-center justify-between border hover:bg-white hover:shadow-md transition-all group">
                                <p className="text-[14px] font-medium uppercase tracking-widest group-hover:text-primary">
                                    Ordinary
                                </p>
                                <div className="flex flex-col items-end">
                                    <p className="text-[14px] font-medium tracking-wide">
                                        {((company.issuedShares || 0) - company.shareClasses.reduce((acc, s) => acc + s.issued, 0)).toLocaleString()}
                                    </p>
                                    {company.shareClasses.find(s => s.class === 'ORDINARY')?.perShareValue != null && Number(company.shareClasses.find(s => s.class === 'ORDINARY')?.perShareValue) > 0 && (
                                        <p className="text-[15px] text-gray-400 font-medium">€{Number(company.shareClasses.find(s => s.class === 'ORDINARY')?.perShareValue).toFixed(2)} / share</p>
                                    )}
                                </div>
                            </ShadowCard>
                        )}
                    </div>
                </div>
            )}

            {/* Additional Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ShadowCard className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border-gray-100 border">
                    <MapPin className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Address</p>
                        <p className="text-gray-900 text-xl font-light">{company.address || 'N/A'}</p>
                    </div>
                </ShadowCard>

                {company.industry && company.industry.length > 0 && (
                    <ShadowCard className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border-gray-100 border">
                        <Globe className="h-5 w-5 text-gray-600 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Industry</p>
                            <p className="text-gray-900 text-xl font-light">{company.industry}</p>
                        </div>
                    </ShadowCard>
                )}

                <ShadowCard className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border-gray-100 border">
                    <Clock className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Incorporated At</p>
                        <p className="text-gray-900 text-xl font-light">
                            {company.companyStartedAt ? new Date(company.companyStartedAt).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </ShadowCard>

                {company.summary && (
                    <ShadowCard className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border-gray-100 border md:col-span-3">
                        <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
                        <div className="w-full">
                            <p className="text-sm text-gray-500 font-medium">Description</p>
                            <p className="text-gray-900 text-xl font-light">{company.summary}</p>
                        </div>
                    </ShadowCard>
                )}
            </div>
        </div>
    );
};

export default CompanyDetailsTab;
