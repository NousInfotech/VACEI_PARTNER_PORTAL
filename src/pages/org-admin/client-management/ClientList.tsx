import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../../config/base";
import { endPoints } from "../../../config/endPoint";
import { useAuth } from "../../../context/auth-context-core";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../../../ui/Table";
import { Skeleton } from "../../../ui/Skeleton";
import { Button } from "../../../ui/Button";
import { User, Building2, ArrowRight, Briefcase } from "lucide-react";
import TableSearch from "./components/shared/TableSearch";
import TablePagination from "./components/shared/TablePagination";
import TableEmptyState from "./components/shared/TableEmptyState";

interface ClientListProps {
  onSelectClient: (clientId: string) => void;
}

const ITEMS_PER_PAGE = 8;

export default function ClientList({ onSelectClient }: ClientListProps) {
  const { organizationMember } = useAuth();
  const orgId = organizationMember?.organizationId;
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: clientsResponse, isLoading } = useQuery({
    queryKey: ['org-clients', orgId],
    queryFn: () => apiGet<any>(endPoints.CLIENT.GET_ALL, { organizationId: orgId }),
    enabled: !!orgId
  });

  const allClients = clientsResponse?.data || [];

  // Filter clients
  const filteredClients = useMemo(() => {
    return allClients.filter((client: any) => {
      const searchStr = searchTerm.toLowerCase();
      const fullName = `${client.user.firstName} ${client.user.lastName}`.toLowerCase();
      return (
        fullName.includes(searchStr) ||
        client.user.email?.toLowerCase().includes(searchStr) ||
        client.id.toLowerCase().includes(searchStr)
      );
    });
  }, [allClients, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (isLoading && allClients.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full rounded-2xl" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TableSearch 
        placeholder="Search clients by name or email..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-gray-100">
                <TableHead className="py-5 pl-8 font-bold text-gray-600 uppercase tracking-widest text-[10px]">Client Name</TableHead>
                <TableHead className="py-5 font-bold text-gray-600 uppercase tracking-widest text-[10px]">Email</TableHead>
                <TableHead className="py-5 text-center font-bold text-gray-600 uppercase tracking-widest text-[10px]">Companies</TableHead>
                <TableHead className="py-5 pr-8 text-right font-bold text-gray-600 uppercase tracking-widest text-[10px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.length === 0 ? (
                <TableEmptyState 
                  colSpan={4}
                  icon={Briefcase}
                  message="No clients found"
                />
              ) : (
                paginatedClients.map((client: any) => (
                  <TableRow key={client.id} className="group hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-4 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          <User size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-gray-900">
                            {client.user.firstName} {client.user.lastName}
                          </p>
                          </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-sm font-bold text-gray-600">{client.user.email}</p>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-900 text-[10px] font-black uppercase tracking-tighter">
                        <Building2 size={12} />
                        {client.companies?.length || 0} Companies
                      </div>
                    </TableCell>
                    <TableCell className="py-4 pr-8 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="rounded-xl font-black text-[11px] uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/10 gap-2 group/btn h-10 px-4"
                        onClick={() => onSelectClient(client.id)}
                      >
                        View Companies
                        <ArrowRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <TablePagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            startIndex={startIndex}
            totalItems={filteredClients.length}
            itemsPerPage={ITEMS_PER_PAGE}
            itemName="clients"
          />
        )}
      </div>
    </div>
  );
}
