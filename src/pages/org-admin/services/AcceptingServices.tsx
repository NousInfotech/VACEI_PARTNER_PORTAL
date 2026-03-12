import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Inbox, 
  Filter,
  User,
  Calendar,
  Check,
  Eye,
  FileText
} from 'lucide-react';
import { Button } from '../../../ui/Button';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../common/PageHeader';
import Dropdown from '../../common/Dropdown';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/auth-context-core';
import { apiGet, apiPost } from '../../../config/base';
import { endPoints } from '../../../config/endPoint';
import { Skeleton } from '../../../ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../ui/Table';
import { ShadowCard } from '../../../ui/ShadowCard';
import type { ServiceRequest } from '../../../types/service-request-template';
import Pagination from '../../common/Pagination';
import { toast } from 'sonner';
import { ServiceRequestDetailsModal } from './servicesRequestManagement/components/ServiceRequestDetailsModal';

const AcceptingServices: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedService, setSelectedService] = useState('All Services');
  const { organizationMember } = useAuth();
  const orgId = organizationMember?.organizationId;
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const limit = 10;

  const { data: requestsData, isLoading } = useQuery<{ data: (ServiceRequest & { applied?: boolean })[]; total: number }>({
    queryKey: ['available-service-requests', page, search, selectedService],
    queryFn: () => apiGet<{ data: (ServiceRequest & { applied?: boolean })[]; total: number }>(endPoints.SERVICE_REQUEST.LIST_AVAILABLE_FOR_ORG, { 
      page,
      limit,
      search: search || undefined,
      service: selectedService === 'All Services' ? undefined : selectedService
    }),
    enabled: !!orgId,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => apiPost(endPoints.SERVICE_REQUEST.ACCEPT(id), {}),
    onSuccess: () => {
      toast.success('Service request accepted successfully');
      queryClient.invalidateQueries({ queryKey: ['available-service-requests'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to accept service request');
    }
  });

  const requests = requestsData?.data || [];
  const totalItems = requestsData?.total || 0;
  const totalPages = Math.ceil(totalItems / limit);

  const services = useMemo(() => {
    return ['All Services', ...organizationMember?.organization?.availableServices || []];
  }, [organizationMember]);

  const handleAccept = (id: string) => {
    acceptMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Accepting Services" 
          icon={Inbox}
          description="View and accept incoming service requests available for your organization."
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
        title="Accepting Services" 
        icon={Inbox}
        description="View and accept incoming service requests available for your organization."
      />

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by company name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-gray-300 focus:border-primary/10 rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-gray-700"
          />
        </div>

        <Dropdown
          label={selectedService}
          trigger={
            <Button variant="secondary" className="h-full px-6 py-3 rounded-2xl flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700">
              <Filter className="h-4 w-4" />
              <span className="font-semibold">{selectedService}</span>
            </Button>
          }
          items={services.map(svc => ({
            id: svc,
            label: svc.replace(/_/g, ' '),
            onClick: () => {
              setSelectedService(svc);
              setPage(1);
            },
            className: selectedService === svc ? "bg-primary/5 text-primary font-bold" : ""
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
              <TableHead>Submitted By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length > 0 ? (
              requests.map((req, index) => (
                <TableRow key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="py-4 px-6 font-bold text-gray-400 text-xs">
                    {(((page - 1) * limit) + index + 1).toString().padStart(2, '0')}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight">
                          {req.company?.name || 'Unknown Company'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary transition-all p-0"
                          onClick={() => navigate(`/dashboard/clients/${req.clientId}/company/${req.companyId}`)}
                          title="View Company"
                        >
                          <Eye className="h-5 w-5" />
                        </Button>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                        Ref: {req.id.split('-')[0]}
                      </span>
                      {/* {req.client?.user && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 mt-1">
                          <User className="h-2.5 w-2.5" />
                          <span>Submitted By: {req.client.user.firstName} {req.client.user.lastName}</span>
                        </div>
                      )} */}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                      {req.service.replace(/_/g, ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      {req.client?.user ? `${req.client.user.firstName} ${req.client.user.lastName}` : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(req);
                          setIsDetailsModalOpen(true);
                        }}
                        className="rounded-xl px-4 flex items-center gap-2 border-gray-200 hover:bg-primary/5 hover:text-primary transition-all"
                        title="Services Request Form"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Services Request Form</span>
                      </Button>
                      
                      {req.applied ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl font-bold text-sm border border-green-100">
                          <Check className="h-4 w-4" />
                          Accepted
                        </div>
                      ) : (
                        <Button 
                          size="sm"
                          onClick={() => handleAccept(req.id)}
                          disabled={acceptMutation.isPending}
                          className="rounded-xl px-6"
                        >
                          {acceptMutation.isPending && acceptMutation.variables === req.id ? 'Accepting...' : 'Accept'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-32 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-10 bg-gray-50 rounded-[40px] text-gray-200">
                      <Inbox className="h-16 w-16" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">No Available Requests</h2>
                      <p className="text-gray-400 font-medium mt-1">Check back later for new service requests</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <Pagination 
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
            itemsPerPage={limit}
          />
        )}
      </ShadowCard>

      <ServiceRequestDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        request={selectedRequest}
      />
    </div>
  );
};

export default AcceptingServices;
