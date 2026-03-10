import React from 'react';
import { FileText, Eye, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Skeleton } from '../../../../ui/Skeleton';
import { Button } from '../../../../ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../ui/Table';
import { ShadowCard } from '../../../../ui/ShadowCard';
import Pagination from '../../../common/Pagination';
import type { ServiceRequestTemplate } from '../../../../types/service-request-template';
import { useTemplates } from '../../context/ServicesContext';

interface TemplateListProps {
  loading: boolean;
  templates: ServiceRequestTemplate[];
  onView: (template: ServiceRequestTemplate) => void;
  onToggleActive: (template: ServiceRequestTemplate) => void;
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
}

export const TemplateList: React.FC<TemplateListProps> = ({
  loading,
  templates,
  onView,
  onToggleActive,
  page,
  limit,
  totalPages,
  onPageChange,
  totalItems,
}) => {
  const { formatServiceLabel } = useTemplates();

  if (loading) {
    return (
      <ShadowCard className="overflow-hidden border border-gray-100 shadow-sm rounded-3xl bg-white">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="py-5 px-6 text-nowrap">S.No</TableHead>
              <TableHead>Service Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="px-6">
                  <Skeleton className="h-5 w-4 rounded-lg" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-48 rounded-lg" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24 rounded-lg" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-32 rounded-lg" />
                </TableCell>
                <TableCell className="px-6">
                  <Skeleton className="h-8 w-12 ml-auto rounded-lg" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={totalItems}
          itemsPerPage={limit}
        />
      </ShadowCard>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="col-span-full py-32 text-center">
        <div className="inline-flex p-10 bg-gray-50 rounded-[40px] text-gray-200">
          <FileText className="h-20 w-20" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mt-8">No Templates Found</h2>
        <p className="text-gray-500 max-w-sm mx-auto mt-4">
          Start by creating a service request template to define form fields for your users.
        </p>
      </div>
    );
  }

  return (
    <ShadowCard className="overflow-hidden border border-gray-100 shadow-sm rounded-3xl bg-white">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="py-5 px-6 text-nowrap">S.No</TableHead>
            <TableHead>Service Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right px-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template, index) => (
            <TableRow
              key={template.id}
              className="hover:bg-gray-50/50 transition-colors group"
            >
              <TableCell className="py-4 px-6 font-bold text-gray-400 text-xs">
                {(((page - 1) * limit) + index + 1).toString().padStart(2, '0')}
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      template.isActive
                        ? 'bg-primary/10 text-primary'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-gray-900 leading-tight">
                    {formatServiceLabel(
                      template.service as string | null,
                      template.customServiceCycleId,
                    )}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg uppercase tracking-widest">
                  {template.type}
                </span>
              </TableCell>
              <TableCell>
                {template.id === 'virtual-custom-group' ? (
                  <span className="text-gray-300 font-bold ml-4">—</span>
                ) : (
                  <button
                    onClick={() => onToggleActive(template)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                      template.isActive
                        ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'
                        : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                    }`}
                  >
                    {template.isActive ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {template.isActive ? 'Active' : 'Inactive'}
                  </button>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(template.updatedAt).toLocaleDateString()}
                </div>
              </TableCell>
              <TableCell className="text-right px-6">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(template)}
                    className="rounded-xl hover:bg-primary/5 hover:text-primary transition-all border-gray-200"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ShadowCard>
  );
};

