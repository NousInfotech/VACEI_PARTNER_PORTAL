import React, { useState } from 'react';
import { Users, ShieldCheck, MapPin, Globe, Plus, Trash2, Edit2, Building2, Mail, Phone } from 'lucide-react';
import { ShadowCard } from '../../../../../ui/ShadowCard';
import { Button } from '../../../../../ui/Button';
import PillTab from '../../../../common/PillTab';
import type { Company, CompanyInvolvement } from '../../../../../types/company';
import InvolvementModal from './InvolvementModal';
import { useQueryClient } from '@tanstack/react-query';
import { apiDelete } from '../../../../../config/base';
import { endPoints } from '../../../../../config/endPoint';
import { DeleteConfirmModal } from '../../../components/DeleteConfirmModal';

interface InvolvementsTabProps {
    company: Company;
    activeInvolvementSubTab: 'shareholders' | 'representatives';
    onSubTabChange: (id: 'shareholders' | 'representatives') => void;
    isReadOnly?: boolean;
}

const InvolvementsTab: React.FC<InvolvementsTabProps> = ({ 
    company, 
    activeInvolvementSubTab, 
    onSubTabChange,
    isReadOnly
}) => {
    const [isInvolvementModalOpen, setIsInvolvementModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedInvolvement, setSelectedInvolvement] = useState<CompanyInvolvement | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; involvementId: string | null; itemName: string }>({
        isOpen: false,
        involvementId: null,
        itemName: ''
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const queryClient = useQueryClient();

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['company', company.id] });
    };

    const handleAdd = () => {
        setModalMode('add');
        setSelectedInvolvement(null);
        setIsInvolvementModalOpen(true);
    };

    const handleEdit = (inv: CompanyInvolvement) => {
        setModalMode('edit');
        setSelectedInvolvement(inv);
        setIsInvolvementModalOpen(true);
    };

    const handleDelete = (inv: CompanyInvolvement) => {
        setDeleteModal({
            isOpen: true,
            involvementId: inv.id,
            itemName: inv.person?.name || inv.holderCompany?.name || 'Involvement'
        });
    };

    const confirmDelete = async () => {
        if (!deleteModal.involvementId) return;
        
        setIsDeleting(true);
        try {
            await apiDelete(endPoints.INVOLVEMENT.DELETE(deleteModal.involvementId));
            handleSuccess();
            setDeleteModal({ isOpen: false, involvementId: null, itemName: '' });
        } catch (err) {
            console.error('Failed to delete involvement:', err);
            alert('Failed to remove involvement');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PillTab 
                    tabs={[
                        { id: 'shareholders', label: 'Shareholders', icon: Users },
                        { id: 'representatives', label: 'Representatives', icon: ShieldCheck },
                    ]} 
                    activeTab={activeInvolvementSubTab} 
                    onTabChange={(id) => onSubTabChange(id as 'shareholders' | 'representatives')} 
                />
                
                {!isReadOnly && (
                    <Button 
                        onClick={handleAdd}
                        className="rounded-xl bg-primary text-white shadow-lg shadow-primary/20 flex items-center gap-2 px-6"
                    >
                        <Plus size={18} />
                        Add {activeInvolvementSubTab === 'shareholders' ? 'Shareholder' : 'Representative'}
                    </Button>
                )}
            </div>

            <div className="mt-4">
                {activeInvolvementSubTab === 'shareholders' ? (
                    <>
                        {(() => {
                            const shareholders = company.involvements?.filter(inv => 
                                inv.role.includes('SHAREHOLDER') || 
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
                                                                    {(inv.classA || 0) > 0 && (
                                                                        <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-1 text-sm font-medium flex flex-col items-center">
                                                                            <span>Class A: {(inv.classA || 0).toLocaleString()}</span>
                                                                            {inv.classAPaidUpPercentage != null && (
                                                                                <span className="text-[13px] text-blue-500 font-medium border border-blue-200 rounded-lg px-3 py-1">{Number(inv.classAPaidUpPercentage)}% Paid</span>
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                    {(inv.classB || 0) > 0 && (
                                                                        <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-1 text-sm font-medium flex flex-col items-center">
                                                                            <span>Class B: {(inv.classB || 0).toLocaleString()}</span>
                                                                            {inv.classBPaidUpPercentage != null && (
                                                                                <span className="text-[13px] text-blue-500 font-medium border border-blue-200 rounded-lg px-3 py-1">{Number(inv.classBPaidUpPercentage)}% Paid</span>
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                    {(inv.classC || 0) > 0 && (
                                                                        <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-1 text-sm font-medium flex flex-col items-center">
                                                                            <span>Class C: {(inv.classC || 0).toLocaleString()}</span>
                                                                            {inv.classCPaidUpPercentage != null && (
                                                                                <span className="text-[13px] text-blue-500 font-medium border border-blue-200 rounded-lg px-3 py-1">{Number(inv.classCPaidUpPercentage)}% Paid</span>
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                    {(inv.ordinary || 0) > 0 && (
                                                                        <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-1 text-sm font-medium flex flex-col items-center">
                                                                            <span>Ordinary: {(inv.ordinary || 0).toLocaleString()}</span>
                                                                            {inv.ordinaryPaidUpPercentage != null && (
                                                                                <span className="text-[13px] text-blue-500 font-medium border border-blue-200 rounded-lg px-3 py-1">{Number(inv.ordinaryPaidUpPercentage)}% Paid</span>
                                                                            )}
                                                                        </span>
                                                                    )}
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
                                                                {inv.person?.email && (
                                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                        <Mail className="h-3 w-3" />
                                                                        <span>{inv.person?.email}</span>
                                                                    </div>
                                                                )}
                                                                {inv.person?.phone && (
                                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                        <Phone className="h-3 w-3" />
                                                                        <span>{inv.person?.phone}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {inv.holderCompany?.registrationNumber && (
                                                                <div className="mt-1 text-[10px] text-gray-400 font-medium">
                                                                    Reg: {inv.holderCompany.registrationNumber}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {!isReadOnly && (
                                                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button 
                                                                    onClick={() => handleEdit(inv)}
                                                                    className="p-2 bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                                    title="Edit Involvement"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDelete(inv)}
                                                                    className="p-2 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                    title="Remove Involvement"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        )}
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
                            const representatives = company.involvements?.filter(inv => inv.role.some(r => r !== 'SHAREHOLDER')) || [];
                            
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
                                                            {inv.role.filter(role => role !== 'SHAREHOLDER').map((role, rIdx) => (
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
                                                        {inv.person?.email && (
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                <Mail className="h-3 w-3" />
                                                                <span>{inv.person?.email}</span>
                                                            </div>
                                                        )}
                                                        {inv.person?.phone && (
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                <Phone className="h-3 w-3" />
                                                                <span>{inv.person?.phone}</span>
                                                            </div>
                                                        )}
                                                        {inv.holderCompany?.registrationNumber && (
                                                            <div className="mt-1 text-[10px] text-gray-400 font-medium font-mono">
                                                                Reg: {inv.holderCompany.registrationNumber}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {!isReadOnly && (
                                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => handleEdit(inv)}
                                                                className="p-2 bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                                title="Edit Involvement"
                                                            >
                                                                    <Edit2 size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(inv)}
                                                                className="p-2 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                title="Remove Involvement"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    )}
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

            <InvolvementModal 
                isOpen={isInvolvementModalOpen}
                onClose={() => setIsInvolvementModalOpen(false)}
                onSuccess={handleSuccess}
                companyId={company.id}
                involvement={selectedInvolvement}
                mode={modalMode}
                existingInvolvements={company.involvements}
                shareClasses={company.shareClasses || []}
            />

            <DeleteConfirmModal 
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={confirmDelete}
                itemName={deleteModal.itemName}
                title="Remove Involvement"
                description={<>Are you sure you want to remove <span className="font-bold text-gray-900">"{deleteModal.itemName}"</span> from the involvement list?</>}
                loading={isDeleting}
            />
        </div>
    );
};

export default InvolvementsTab;
