import React, { useState } from 'react';
import { Building2, Shield, UserCheck, Plus, Activity, Download, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PillTab from '../../../../common/PillTab';
import CompanyKyc from './CompanyKyc';
import InvolvementsKyc from './InvolvementsKyc';
import type { KycWorkflow, KycBackendResponse } from './types';
import { ShadowCard } from '../../../../../ui/ShadowCard';
import { apiGet, apiPost, apiPatch } from '../../../../../config/base';
import { endPoints } from '../../../../../config/endPoint';
import { Button } from '../../../../../ui/Button';
import { toast } from 'sonner';
import KycSkeleton from '../components/skeletons/KycSkeleton';

interface KycSectionProps {
  companyId: string;
  isReadOnly?: boolean;
}

import { KycCycleProvider } from './IncorpCycleContext';
import { transformBackendDocReq } from '../../../../../utils/documentTransform';

const KycSection: React.FC<KycSectionProps> = ({ companyId, isReadOnly }) => {
  const [activeTab, setActiveTab] = useState('Company');
  const queryClient = useQueryClient();
  
  const { data: companyDetails } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => apiGet<{ data: { name: string; incorporationStatus: boolean } }>(endPoints.COMPANY.GET_BY_ID(companyId)).then(res => res.data),
    enabled: !!companyId,
  });


  const { data: realKycData, isLoading, refetch } = useQuery<KycBackendResponse | null>({
    queryKey: ['kyc-cycle', companyId],
    queryFn: () => apiGet<{ data: KycBackendResponse | null }>(endPoints.COMPANY.KYC(companyId)).then(res => res.data),
    enabled: !!companyId,
  });

  const createKycMutation = useMutation({
    mutationFn: (data: { involvementIds?: string[] }) => 
      apiPost(endPoints.COMPANY.KYC(companyId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-cycle', companyId] });
    }
  });

  // Automatically initialize KYC cycle if incorporation is complete and no KYC cycle exists
  React.useEffect(() => {
    if (companyDetails?.incorporationStatus && realKycData === null && !isLoading && !createKycMutation.isPending) {
      createKycMutation.mutate({});
    }
  }, [companyDetails?.incorporationStatus, realKycData, isLoading, createKycMutation.isPending]);

  const updateDocRequestStatusMutation = useMutation({
    mutationFn: ({ requestId, status }: { requestId: string; status: string }) =>
      apiPatch(endPoints.DOCUMENT_REQUESTS.UPDATE_STATUS(requestId), { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-cycle', companyId] });
      toast.success('Document status updated.');
    },
    onError: (error: any) => {
      toast.error('Failed to update document status', {
        description: error?.response?.data?.message || error?.message || 'Unexpected error'
      });
    }
  });

  const patchKycStatusMutation = useMutation({
    mutationFn: ({ status }: { status: string; requestIds?: string[] }) => 
      apiPatch(endPoints.COMPANY.KYC(companyId) + `/${realKycData?.id}`, { status }),
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kyc-cycle', companyId] });
      queryClient.invalidateQueries({ queryKey: ['client-companies'] });
      toast.success('KYC status updated successfully.');
      
      // When KYC moves into review, automatically activate all related document requests
      if (variables.status === 'IN_REVIEW' && variables.requestIds?.length) {
        await Promise.all(
          variables.requestIds.map((requestId) =>
            updateDocRequestStatusMutation.mutateAsync({ requestId, status: 'ACTIVE' })
          )
        );
      }
    },
    onError: (error: any) => {
      toast.error('Failed to update KYC status', {
        description: error?.response?.data?.message || error?.message || 'Unexpected error'
      });
    }
  });

  const transformData = (data: KycBackendResponse | null): KycWorkflow[] => {
    if (!data) return [];
    
    const workflows: KycWorkflow[] = [];

    // 1. Company Workflow
    if (data.documentRequest) {
      workflows.push({
        _id: data.id,
        companyId: data.companyId,
        workflowType: 'Company',
        status: data.status,
        documentRequests: [
          {
            _id: data.documentRequest.id,
            documentRequest: {
                ...transformBackendDocReq(data.documentRequest),
                entityName: data.company.name,
                address: data.company.address
            }
          }
        ]
      });
    }

    // 2. Involvements Workflows
    data.involvementKycs.forEach(invKyc => {
        const roles = invKyc.involvement.role || [];
        
        // Determine the workflow type based on roles, prioritizing Shareholder
        let workflowType: 'Shareholder' | 'Representative' | null = null;
        if (roles.includes('SHAREHOLDER')) {
            workflowType = 'Shareholder';
        } else if (roles.length > 0) {
            // Any other role (DIRECTOR, SECRETARY, etc.) is treated as a Representative
            workflowType = 'Representative';
        }
        
        if (workflowType) {
            const drId = invKyc.documentRequest.id;
            
            workflows.push({
                _id: invKyc.id,
                companyId: data.companyId,
                workflowType: workflowType,
                status: invKyc.status,
                documentRequests: [
                    {
                        _id: drId,
                        person: invKyc.involvement.person ? {
                            _id: invKyc.involvement.person.id,
                            name: invKyc.involvement.person.name,
                            address: invKyc.involvement.person.address || '',
                            email: invKyc.involvement.person.email,
                            nationality: (invKyc.involvement.person as any).nationality
                        } : {
                            _id: invKyc.involvement.holderCompany?.id || '',
                            name: invKyc.involvement.holderCompany?.name || '',
                            address: invKyc.involvement.holderCompany?.address || ''
                        },
                        documentRequest: {
                            ...transformBackendDocReq(invKyc.documentRequest),
                            entityName: invKyc.involvement.person?.name || invKyc.involvement.holderCompany?.name || '',
                            address: invKyc.involvement.person?.address || invKyc.involvement.holderCompany?.address || null
                        }
                    }
                ]
            });
        }
    });

    return workflows;
  };

  const kycData = transformData(realKycData || null);

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadAllZip = async () => {
    if (!kycData.length) return;
    setIsDownloading(true);
    
    try {
      const zip = new JSZip();
      const companyFolder = zip.folder(`${companyDetails?.name || 'Company'}_KYC`);
      
      const downloadPromises: Promise<any>[] = [];

      kycData.forEach(workflow => {
        workflow.documentRequests.forEach(req => {
          // Flatten all documents (single and multiple)
          const docs = [
            ...(req.documentRequest.documents || []),
            ...(req.documentRequest.multipleDocuments?.flatMap(m => m.multiple) || [])
          ];

          docs.forEach(doc => {
            const docUrl = doc.url;
            if (docUrl) {
              const promise = fetch(docUrl)
                .then(res => {
                  const contentType = res.headers.get('Content-Type');
                  if (contentType && contentType.includes('text/html')) {
                    throw new Error('Received HTML instead of file');
                  }
                  return res.blob();
                })
                .then(blob => {
                  const extension = docUrl.split('.').pop()?.split('?')[0] || 'pdf';
                  const docName = ('name' in doc ? (doc as any).name : (doc as any).label) || 'document';
                  const fileName = `${docName}.${extension}`;
                  companyFolder?.file(fileName, blob);
                })
                .catch(err => console.error(`Failed to download ${'name' in doc ? (doc as any).name : (doc as any).label}`, err));
              downloadPromises.push(promise);
            }
          });
        });
      });

      await Promise.all(downloadPromises);
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${companyDetails?.name || 'Company'}_KYC.zip`);
    } catch (error) {
      console.error("Error creating ZIP:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const tabs = [
    { id: 'Company', label: 'COMPANY', icon: Building2 },
    { id: 'Involvements', label: 'INVOLVEMENTS', icon: UserCheck },
  ];

  if (isLoading) {
      return <KycSkeleton />;
  }

  if (!realKycData) {
      return (
          <div className="space-y-8 animate-in fade-in duration-700">
              <ShadowCard className="flex items-center justify-between p-6 bg-linear-to-br from-white to-gray-50/50">
                  <div>
                      <h2 className="text-3xl font-semibold uppercase mb-2">KYC Verification</h2>
                      <p className="text-base font-light max-w-lg text-gray-500">No KYC verification cycle has been initialized for this company yet.</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-4xl text-primary border border-primary/20">
                      <Shield size={25} />
                  </div>
              </ShadowCard>

              <ShadowCard className="p-12 border-dashed border-2 border-gray-200 flex flex-col items-center justify-center text-center space-y-6">
                <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                    <Activity size={40} className="animate-pulse" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900">Start Verification Journey</h3>
                    <p className="text-gray-500 max-w-sm mx-auto font-light">
                        Initializing the KYC cycle will create formal document requests for this entity and its associated stakeholders.
                    </p>
                </div>
                {!isReadOnly && (
                    <Button 
                        className="rounded-4xl px-8 py-6 h-auto text-lg hover:scale-105 transition-transform"
                        onClick={() => createKycMutation.mutate({})}
                        disabled={createKycMutation.isPending}
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Initialize KYC Cycle
                    </Button>
                )}
              </ShadowCard>
          </div>
      );
  }

  return (
    <KycCycleProvider 
        kycData={kycData} 
        isLoading={isLoading} 
        refetch={refetch} 
        companyId={companyId}
    >
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between bg-white/40 p-6 rounded-2xl border border-white/60 shadow-sm backdrop-blur-md">
                <div>
                <h2 className="text-3xl font-semibold">KYC Verification {companyDetails?.name ? `- ${companyDetails.name}` : ''}</h2>
                <p className="text-sm text-gray-500 mt-1 font-medium">Monitor and audit compliance documentation across the entity or associated individuals</p>
                </div>
                <div className="flex items-center gap-3">
                {realKycData && (
                    <div className="flex items-center mr-2">
                    <select
                        value={realKycData.status}
                        disabled={patchKycStatusMutation.isPending || isReadOnly}
                        onChange={e => {
                          const newStatus = e.target.value;
                          const requestIds: string[] = [];
                          
                          // Collect all document request IDs if moving to IN_REVIEW
                          if (newStatus === 'IN_REVIEW') {
                            if (realKycData.documentRequest) {
                              requestIds.push(realKycData.documentRequest.id);
                            }
                            realKycData.involvementKycs.forEach(inv => {
                              if (inv.documentRequest) {
                                requestIds.push(inv.documentRequest.id);
                              }
                            });
                          }
                          
                          patchKycStatusMutation.mutate({ status: newStatus, requestIds });
                        }}
                        className={`rounded-xl px-4 py-2 text-[10px] font-black border outline-none cursor-pointer transition-all appearance-none shadow-sm uppercase tracking-widest h-10 w-fit text-left ${
                        realKycData.status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/80'
                            : realKycData.status === 'IN_REVIEW'
                            ? 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100/80'
                            : realKycData.status === 'REJECTED'
                            ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100/80'
                            : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/80'
                        }`}
                    >
                        <option value="PENDING">PENDING</option>
                        <option value="IN_REVIEW">IN REVIEW</option>
                        <option value="VERIFIED">VERIFIED</option>
                        <option value="REJECTED">REJECTED</option>
                    </select>
                    </div>
                )}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadAllZip}
                    disabled={isLoading || isDownloading || !kycData.length}
                    className="rounded-xl border-white/60 bg-white/40 text-gray-700 hover:bg-white/60 h-10 px-4 font-bold uppercase tracking-wider text-[10px]"
                    title="Download All Submitted as ZIP"
                >
                    {isDownloading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Download size={18} className="mr-2" />}
                    Download ZIP
                </Button>
                <div className="p-4 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                    <Shield size={32} />
                </div>
                </div>
            </div>

            <div className="space-y-8">
                <PillTab 
                tabs={tabs} 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
                className="bg-gray-50/50 p-1.5 rounded-3xl border border-gray-100"
                />

                <div className="min-h-[400px]">
                {activeTab === 'Company' && (
                    <CompanyKyc 
                    workflows={kycData} 
                    companyId={companyId}
                    kycId={realKycData?.id}
                    isReadOnly={isReadOnly}
                    />
                )}

                {activeTab === 'Involvements' && (
                    <InvolvementsKyc 
                    workflows={kycData} 
                    companyId={companyId}
                    kycId={realKycData?.id}
                    isReadOnly={isReadOnly}
                    />
                )}
                </div>
            </div>
        </div>
    </KycCycleProvider>
  );
};

export default KycSection;

