import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../../config/base";
import { endPoints } from "../../../config/endPoint";
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
import { Building2, ArrowRight, Briefcase } from "lucide-react";
import TableSearch from "./components/shared/TableSearch";
import TablePagination from "./components/shared/TablePagination";
import TableEmptyState from "./components/shared/TableEmptyState";

interface CompanyListProps {
  clientId: string;
  onSelectCompany: (companyId: string) => void;
}

const ITEMS_PER_PAGE = 8;

export default function CompanyList({ clientId, onSelectCompany }: CompanyListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: companiesResponse, isLoading } = useQuery({
    queryKey: ['client-companies', clientId],
    queryFn: () => apiGet<any>(endPoints.COMPANY.BASE, { clientId }),
    enabled: !!clientId
  });

  const allCompanies = companiesResponse?.data || [];

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return allCompanies.filter((company: any) => {
      const searchStr = searchTerm.toLowerCase();
      return (
        company.name?.toLowerCase().includes(searchStr) ||
        company.registrationNumber?.toLowerCase().includes(searchStr) ||
        company.industry?.some((i: string) => i.toLowerCase().includes(searchStr))
      );
    });
  }, [allCompanies, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCompanies = filteredCompanies.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (isLoading && allCompanies.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full rounded-2xl" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TableSearch 
        placeholder="Search companies by name or reg no..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-gray-100">
                <TableHead className="py-5 pl-8 font-bold text-gray-600 uppercase tracking-widest text-[10px]">Company Name</TableHead>
                <TableHead className="py-5 font-bold text-gray-600 uppercase tracking-widest text-[10px]">Registration No.</TableHead>
                <TableHead className="py-5 pr-8 text-right font-bold text-gray-600 uppercase tracking-widest text-[10px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCompanies.length === 0 ? (
                <TableEmptyState 
                  colSpan={3}
                  icon={Briefcase}
                  message="No companies found"
                />
              ) : (
                paginatedCompanies.map((company: any) => (
                  <TableRow key={company.id} className="group hover:bg-gray-50/50 transition-colors border-slate-100">
                    <TableCell className="py-4 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center transition-all duration-300">
                          <Building2 size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-gray-900">{company.name}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{company.industry?.join(', ') || 'N/A'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 font-medium text-gray-600">
                      {company.registrationNumber}
                    </TableCell>
                    <TableCell className="py-4 pr-8 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="rounded-xl font-black text-[11px] uppercase tracking-widest gap-2 group/btn h-10 px-4"
                        onClick={() => onSelectCompany(company.id)}
                      >
                        View Engagements
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
            totalItems={filteredCompanies.length}
            itemsPerPage={ITEMS_PER_PAGE}
            itemName="companies"
          />
        )}
      </div>
    </div>
  );
}
