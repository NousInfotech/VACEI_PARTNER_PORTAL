import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Eye, Calendar, Plus } from 'lucide-react';
import { Button } from '../../../ui/Button';
import { ShadowCard } from '../../../ui/ShadowCard';
import { Skeleton } from '../../../ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../ui/Table';
import { apiGet } from '../../../config/base';
import { endPoints } from '../../../config/endPoint';
import type { Client, ClientResponse } from '../../../types/client';
import PageHeader from '../../common/PageHeader';
import Dropdown from '../../common/Dropdown';
import Pagination from '../../common/Pagination';
import { useAuth } from '../../../context/auth-context-core';

const Clients: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState('');
    const [selectedDateRange, setSelectedDateRange] = useState('All time');
    const [showOnboardedOnly, setShowOnboardedOnly] = useState(false);
    const { organizationMember } = useAuth();
    const orgId = organizationMember?.organizationId;

    const page = parseInt(searchParams.get('page') || '1', 10);
    const setPage = (updater: number | ((p: number) => number)) => {
        const newPage = typeof updater === 'function' ? updater(page) : updater;
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('page', String(newPage));
        setSearchParams(nextParams);
    };
    const limit = 10;

    // Fetch clients for the organization
    const { data: realData, isLoading } = useQuery<ClientResponse>({
        queryKey: ['org-clients', orgId],
        queryFn: () => apiGet(endPoints.CLIENT.GET_ALL, { organizationId: orgId, limit: 1000 }),
        enabled: !!orgId,
    });

    const allClients = useMemo(() => realData?.data ?? [], [realData?.data]);

    const filteredClients = useMemo(() => {
        let results = allClients;

        // Apply date range filter
        if (selectedDateRange !== 'All time') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            results = results.filter(client => {
                const clientDate = new Date(client.createdAt);
                if (selectedDateRange === 'Today') {
                    return clientDate >= today;
                }
                if (selectedDateRange === 'Last 7 days') {
                    const sevenDaysAgo = new Date(today);
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    return clientDate >= sevenDaysAgo;
                }
                if (selectedDateRange === 'Last 30 days') {
                    const thirtyDaysAgo = new Date(today);
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return clientDate >= thirtyDaysAgo;
                }
                return true;
            });
        }

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            results = results.filter(client => 
                `${client.user.firstName} ${client.user.lastName}`.toLowerCase().includes(searchLower) ||
                client.user.email?.toLowerCase().includes(searchLower)
            );
        }

        // Apply onboarding type filter (ORG_ONBOARDED_CLIENT for this org)
        if (showOnboardedOnly && orgId) {
            results = results.filter(client =>
                client.onboardings?.some(
                    (o) =>
                        o.organizationId === orgId &&
                        o.type === 'ORG_ONBOARDED_CLIENT' &&
                        o.isActive
                )
            );
        }

        return results;
    }, [allClients, search, selectedDateRange, showOnboardedOnly, orgId]);

    const totalPages = Math.max(1, Math.ceil(filteredClients.length / limit));

    const paginatedClients = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredClients.slice(start, start + limit);
    }, [filteredClients, page]);

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Clients" 
                icon={Users}
                actions={
                    <Button
                        onClick={() => navigate('/dashboard/clients/create')}
                        variant='header'
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New client
                    </Button>
                }
            />

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search clients by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-6 py-3 bg-white border border-gray-200 focus:border-primary/20 rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-gray-700 shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Dropdown
                        label={selectedDateRange}
                        trigger={
                            <Button variant="outline" className="h-full px-6 py-3 rounded-2xl flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="font-semibold">{selectedDateRange}</span>
                            </Button>
                        }
                        items={[
                            { id: 'All time', label: 'All time', onClick: () => setSelectedDateRange('All time') },
                            { id: 'Today', label: 'Today', onClick: () => setSelectedDateRange('Today') },
                            { id: 'Last 7 days', label: 'Last 7 days', onClick: () => setSelectedDateRange('Last 7 days') },
                            { id: 'Last 30 days', label: 'Last 30 days', onClick: () => setSelectedDateRange('Last 30 days') },
                        ].map(item => ({
                            ...item,
                            className: selectedDateRange === item.id ? "bg-primary/5 text-primary font-bold" : ""
                        }))}
                        align="right"
                    />

                    <Button
                        type="button"
                        variant={showOnboardedOnly ? 'default' : 'outline'}
                        className="h-full px-4 py-3 rounded-2xl text-xs font-semibold uppercase tracking-widest"
                        onClick={() => setShowOnboardedOnly(!showOnboardedOnly)}
                    >
                        {showOnboardedOnly ? 'Showing onboarded only' : 'Show onboarded only'}
                    </Button>
                </div>
            </div>

            <ShadowCard className="overflow-hidden border border-gray-100 shadow-sm rounded-2xl bg-white">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="py-4 px-6 text-nowrap">S.No</TableHead>
                            <TableHead>Client Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right px-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell className="px-6"><Skeleton className="h-4 w-4" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell className="text-right px-6"><Skeleton className="h-8 w-12 ml-auto rounded-lg" /></TableCell>
                                </TableRow>
                            ))
                        ) : paginatedClients.length > 0 ? (
                            paginatedClients.map((client: Client, index: number) => (
                                <TableRow key={client.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <TableCell className="py-4 px-6 font-bold text-gray-400 text-xs">
                                        {(((page - 1) * limit) + index + 1).toString().padStart(2, '0')}
                                    </TableCell>
                                    <TableCell className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                                        {client.user.firstName} {client.user.lastName}
                                    </TableCell>
                                    <TableCell className="text-gray-600">{client.user.email || 'N/A'}</TableCell>
                                    <TableCell className="text-gray-500 font-medium text-xs">
                                        {new Date(client.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => navigate(`/dashboard/clients/${client.id}`)}
                                                className="rounded-xl hover:bg-primary/5 hover:text-primary transition-all border-gray-200 shadow-none"
                                             >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <Users className="h-12 w-12 mb-4 opacity-20" />
                                        <p className="text-lg font-medium">No clients found</p>
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
                    totalItems={filteredClients.length}
                    itemsPerPage={limit}
                />
            </ShadowCard>
        </div>
    );
};

export default Clients;
