import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../../../config/base';
import { endPoints } from '../../../../../config/endPoint';
import type { IncorporationCycle } from '../../../../../types/company';
import { transformBackendDocReq } from '../../../../../utils/documentTransform';

interface IncorpCycleContextType {
  cycle: IncorporationCycle | undefined;
  transformedDocs: any[];
  isLoading: boolean;
  refetch: () => Promise<any>;
  companyId: string | undefined;
}

const IncorpCycleContext = createContext<IncorpCycleContextType | undefined>(undefined);

export const IncorpCycleProvider: React.FC<{ companyId: string | undefined; children: ReactNode }> = ({ companyId, children }) => {
  const { data: cycle, isLoading, refetch } = useQuery<IncorporationCycle>({
    queryKey: ['incorporation-cycle', companyId],
    queryFn: () => apiGet<{ data: IncorporationCycle }>(endPoints.INCORPORATION.GET_BY_COMPANY(companyId!)).then(res => res.data),
    enabled: !!companyId,
  });

  const transformedDocs = useMemo(() => {
    return cycle?.documentRequests?.map(dr => transformBackendDocReq(dr)) || [];
  }, [cycle]);

  return (
    <IncorpCycleContext.Provider value={{ cycle, transformedDocs, isLoading, refetch, companyId }}>
      {children}
    </IncorpCycleContext.Provider>
  );
};

export const KycCycleProvider: React.FC<{ 
  kycData: any; 
  isLoading: boolean; 
  refetch: () => Promise<any>; 
  companyId: string | undefined; 
  children: ReactNode 
}> = ({ kycData, isLoading, refetch, companyId, children }) => {
  const transformedDocs = useMemo(() => {
    if (!kycData) return [];
    // The kycData is already transformed in KycSection.tsx transformData function
    return kycData.flatMap((w: any) => 
        w.documentRequests?.map((dr: any) => dr.documentRequest) || []
    ).filter(Boolean);
  }, [kycData]);

  return (
    <IncorpCycleContext.Provider value={{ cycle: undefined, transformedDocs, isLoading, refetch, companyId }}>
      {children}
    </IncorpCycleContext.Provider>
  );
};

export const useIncorpCycle = () => {
  const context = useContext(IncorpCycleContext);
  if (context === undefined) {
    throw new Error('useIncorpCycle must be used within an IncorpCycleProvider');
  }
  return context;
};
