import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Inbox, 
  Filter,
  Eye,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../../../ui/Button';
import PageHeader from '../../../common/PageHeader';
import Dropdown from '../../../common/Dropdown';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../../context/auth-context-core';
import { apiGet } from '../../../../config/base';
import { endPoints } from '../../../../config/endPoint';
import { Skeleton } from '../../../../ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../ui/Table';
import { ShadowCard } from '../../../../ui/ShadowCard';
import type { Client, ClientResponse } from '../../../../types/client';
import type { ServiceRequest } from '../../../../types/service-request-template';
import Pagination from '../../../common/Pagination';

const ServiceRequestManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const { organizationMember } = useAuth();
  const orgId = organizationMember?.organizationId;
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const setPage = (newPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(newPage));
    setSearchParams(nextParams);
  };
  const limit = 10;

  type ServiceRequestApiResponse = { success?: boolean; data?: ServiceRequest[] } | ServiceRequest[];

  const { data: requestsData, isLoading: isLoadingRequests } = useQuery<ServiceRequestApiResponse>({
    queryKey: ['service-requests'],
    queryFn: () => apiGet<ServiceRequestApiResponse>(endPoints.SERVICE_REQUEST.GET_ALL, { 
      limit: 1000,
      organizationId: orgId 
    }),
    enabled: !!orgId,
  });

  const { data: clientsData, isLoading: isLoadingClients } = useQuery<ClientResponse>({
    queryKey: ['clients-lookup'],
    queryFn: () => apiGet<ClientResponse>(endPoints.CLIENT.GET_ALL, { limit: 1000 }),
  });

  const isLoading = isLoadingRequests || isLoadingClients;

  const clientMap = useMemo(() => {
    const map: Record<string, string> = {};
    const clients: Client[] = clientsData?.data ?? [];
    clients.forEach((c: Client) => {
      if (c.id && c.user) {
        map[c.id] = `${c.user.firstName} ${c.user.lastName}`;
      }
    });
    return map;
  }, [clientsData]);

  const requests: ServiceRequest[] = useMemo(() => {
    if (!requestsData) return [];
    if (Array.isArray(requestsData)) return requestsData;
    if (Array.isArray(requestsData.data)) return requestsData.data;
    return [];
  }, [requestsData]);

  const statuses = useMemo(() => {
    const uniqueStatuses = Array.from(new Set(requests.map((r: ServiceRequest) => r.status).filter(s => s !== 'DRAFT')));
    return ['All Statuses', ...uniqueStatuses.sort()];
  }, [requests]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdownId && !(event.target as Element).closest('.dropdown-trigger')) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdownId]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedStatus]);

  const handleView = (id: string) => {
    navigate(`/dashboard/service-request-management/${id}`);
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((req: ServiceRequest) => {
      if (req.status === 'DRAFT') return false;

      const companyName = req.company?.name || '';
      const matchesSearch = companyName.toLowerCase().includes(search.toLowerCase()) ||
                           req.service.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = selectedStatus === 'All Statuses' || req.status === selectedStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [requests, search, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / limit));
  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredRequests.slice(start, start + limit);
  }, [filteredRequests, page]);


  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Service Request Management" 
          icon={Inbox}
          description="Monitor and manage incoming service requests from clients."
        />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-[28px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Service Request Management" 
        icon={Inbox}
        description="Monitor and manage incoming service requests from clients."
      />

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search requests by client or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-gray-300 focus:border-primary/10 rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-gray-700"
          />
        </div>

        <Dropdown
          label={selectedStatus}
          trigger={
            <Button variant="secondary" className="h-full px-6 py-3 rounded-2xl flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700">
              <Filter className="h-4 w-4" />
              <span className="font-semibold">{selectedStatus}</span>
            </Button>
          }
          items={statuses.map(status => ({
            id: status,
            label: status.replace(/_/g, ' '),
            onClick: () => setSelectedStatus(status),
            className: selectedStatus === status ? "bg-primary/5 text-primary font-bold" : ""
          }))}
          align="right"
        />
      </div>

      <ShadowCard className="overflow-hidden border border-gray-100 shadow-sm rounded-3xl bg-white">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="py-5 px-6 text-nowrap">S.No</TableHead>
              <TableHead>Company / Ref</TableHead>
              <TableHead>Service Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-6"><Skeleton className="h-5 w-4 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-48 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-lg" /></TableCell>
                  <TableCell className="px-6"><Skeleton className="h-8 w-12 ml-auto rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : paginatedRequests.length > 0 ? (
              paginatedRequests.map((req: ServiceRequest, index: number) => (
                <TableRow key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="py-4 px-6 font-bold text-gray-400 text-xs">
                    {(((page - 1) * limit) + index + 1).toString().padStart(2, '0')}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight">
                        {req.company?.name || 'Unknown Company'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                        Ref: {req.id.split('-')[0]}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                      {req.service.replace(/_/g, ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      req.status === 'APPROVED' ? 'bg-green-50 text-green-600 border-green-100' : 
                      req.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' :
                      req.status === 'IN_REVIEW' || req.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-100'
                    }`}>
                      {req.status === 'APPROVED' ? <CheckCircle2 className="h-3 w-3" /> :
                       req.status === 'REJECTED' ? <AlertCircle className="h-3 w-3" /> :
                       req.status === 'IN_REVIEW' || req.status === 'SUBMITTED' ? <Clock className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {req.status.replace(/_/g, ' ')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      {req.client?.user ? `${req.client.user.firstName} ${req.client.user.lastName}` : 
                       (clientMap[req.clientId] || req.clientName || req.clientId.split('-')[0])}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleView(req.id)}
                      className="rounded-xl hover:bg-primary/5 hover:text-primary transition-all border-gray-200"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-32 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-10 bg-gray-50 rounded-[40px] text-gray-200">
                      <Inbox className="h-16 w-16" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">No Requests Found</h2>
                      <p className="text-gray-400 font-medium mt-1">Try adjusting your filters or search terms</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Pagination 
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={filteredRequests.length}
          itemsPerPage={limit}
        />
      </ShadowCard>
    </div>
  );
};

export default ServiceRequestManagement;
