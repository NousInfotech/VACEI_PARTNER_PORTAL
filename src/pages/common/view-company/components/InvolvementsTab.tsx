import React from 'react';
import { Users, ShieldCheck, MapPin, Globe, Building2 } from 'lucide-react';
import { ShadowCard } from '../../../../ui/ShadowCard';
import PillTab from '../../PillTab';
import type { Company } from '../../../../types/company';

interface InvolvementsTabProps {
    company: Company;
    activeInvolvementSubTab: 'shareholders' | 'representatives';
    onSubTabChange: (id: 'shareholders' | 'representatives') => void;
}

const InvolvementsTab: React.FC<InvolvementsTabProps> = ({ 
    company, 
    activeInvolvementSubTab, 
    onSubTabChange 
}) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PillTab 
                    tabs={[
                        { id: 'shareholders', label: 'Shareholders', icon: Users },
                        { id: 'representatives', label: 'Representatives', icon: ShieldCheck },
                    ]} 
                    activeTab={activeInvolvementSubTab} 
                    onTabChange={(id: string) => onSubTabChange(id as 'shareholders' | 'representatives')} 
                />
            </div>

            <div className="mt-4">
                {activeInvolvementSubTab === 'shareholders' ? (
                    <>
                        {(() => {
                            const shareholders = company.involvements?.filter(inv => 
                                (inv.role || []).includes('SHAREHOLDER') || 
                                ((inv.classA || 0) + (inv.classB || 0) + (inv.classC || 0) + (inv.ordinary || 0) > 0)
                            ) || [];
                            
                            if (shareholders.length === 0) {
                                return (
                                    <div className="p-16 text-center bg-gray-50/30 rounded-[2.5rem] border border-dashed border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6">
                                            <Users size={40} className="text-gray-300" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">No Shareholders Found</h3>
                                        <p className="text-base text-gray-500 mt-2 font-medium max-w-xs mx-auto">There are currently no shareholders registered for this entity.</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="grid grid-cols-1 gap-4">
                                    {shareholders.map((inv, idx) => {
                                        const totalShares = (inv.classA || 0) + (inv.classB || 0) + (inv.classC || 0) + (inv.ordinary || 0);
                                        return (
                                            <ShadowCard key={inv.id || idx} className="bg-white border border-indigo-100 rounded-xl shadow-sm hover:shadow-md transition-all group">
                                                <div className="p-6">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${inv.holderCompany ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                                                    {inv.holderCompany ? <Building2 size={20} /> : <Users size={20} />}
                                                                </div>
                                                                <h4 className="text-lg font-semibold text-gray-900">
                                                                    {inv.person?.name || inv.holderCompany?.name}
                                                                </h4>
                                                            </div>
                                                            
                                                            <div className="mb-4 space-y-3">
                                                                <div className="flex flex-wrap gap-2">
                                                                    {(inv.classA || 0) > 0 && <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-1 text-sm font-medium">Class A: {(inv.classA || 0).toLocaleString()}</span>}
                                                                    {(inv.classB || 0) > 0 && <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-1 text-sm font-medium">Class B: {(inv.classB || 0).toLocaleString()}</span>}
                                                                    {(inv.classC || 0) > 0 && <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-1 text-sm font-medium">Class C: {(inv.classC || 0).toLocaleString()}</span>}
                                                                    {(inv.ordinary || 0) > 0 && <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-1 text-sm font-medium">Ordinary: {(inv.ordinary || 0).toLocaleString()}</span>}
                                                                </div>

                                                                <div className="flex flex-wrap gap-2">
                                                                    <span className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-3 py-1 text-sm font-semibold">Total: {totalShares.toLocaleString()}</span>
                                                                    <span className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-3 py-1 text-sm font-semibold">Share: {(company.issuedShares > 0 ? (totalShares / company.issuedShares) * 100 : 0).toFixed(2)}%</span>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                    <MapPin className="h-3 w-3" />
                                                                    <span>{inv.person?.address || inv.holderCompany?.address}</span>
                                                                </div>
                                                                {inv.person?.nationality && (
                                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                        <Globe className="h-3 w-3" />
                                                                        <span>{inv.person?.nationality}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {inv.holderCompany?.registrationNumber && (
                                                                <div className="mt-1 text-[10px] text-gray-400 font-medium">
                                                                    Reg: {inv.holderCompany.registrationNumber}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </ShadowCard>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </>
                ) : (
                    <>
                        {(() => {
                            const representatives = company.involvements?.filter(inv => (inv.role || []).some(r => r !== 'SHAREHOLDER')) || [];
                            
                            if (representatives.length === 0) {
                                return (
                                    <div className="p-16 text-center bg-gray-50/30 rounded-[2.5rem] border border-dashed border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6">
                                            <ShieldCheck size={40} className="text-gray-300" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">No Representatives Found</h3>
                                        <p className="text-base text-gray-500 mt-2 font-medium max-w-xs mx-auto">There are currently no directors or authorized representatives listed.</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="grid grid-cols-1 gap-4">
                                    {representatives.map((inv, idx) => (
                                        <ShadowCard key={inv.id || idx} className="bg-white border border-indigo-100 rounded-xl shadow-sm hover:shadow-md transition-all group">
                                            <div className="p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${inv.holderCompany ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                                {inv.holderCompany ? <Building2 size={20} /> : <ShieldCheck size={20} />}
                                                            </div>
                                                            <h4 className="text-lg font-semibold text-gray-900">
                                                                {inv.person?.name || inv.holderCompany?.name}
                                                            </h4>
                                                        </div>
                                                        
                                                        <div className="flex flex-wrap gap-2 mb-4">
                                                            {(inv.role || []).filter(role => role !== 'SHAREHOLDER').map((role, rIdx) => (
                                                                <span key={rIdx} className="bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg px-3 py-1 text-sm font-medium">
                                                                    {role.replace('_', ' ')}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <MapPin className="h-3 w-3" />
                                                            <span>{inv.person?.address || inv.holderCompany?.address}</span>
                                                        </div>
                                                        {inv.person?.nationality && (
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                <Globe className="h-3 w-3" />
                                                                <span>{inv.person?.nationality}</span>
                                                            </div>
                                                        )}
                                                        {inv.holderCompany?.registrationNumber && (
                                                            <div className="mt-1 text-[10px] text-gray-400 font-medium font-mono">
                                                                Reg: {inv.holderCompany.registrationNumber}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </ShadowCard>
                                    ))}
                                </div>
                            );
                        })()}
                    </>
                )}
            </div>
        </div>
    );
};

export default InvolvementsTab;
