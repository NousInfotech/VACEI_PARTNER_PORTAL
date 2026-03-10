import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../ui/Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * (itemsPerPage || 10) + 1;
  const endItem = Math.min(currentPage * (itemsPerPage || 10), totalItems || 0);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gray-50/50 border-t border-gray-100">
      <div className="text-sm font-medium text-gray-500">
        {totalItems ? (
          <>
            Showing <span className="text-gray-900 font-bold">{startItem}</span> to{' '}
            <span className="text-gray-900 font-bold">{endItem}</span> of{' '}
            <span className="text-gray-900 font-bold">{totalItems}</span> results
          </>
        ) : (
          <>
            Page <span className="text-gray-900 font-bold">{currentPage}</span> of{' '}
            <span className="text-gray-900 font-bold">{totalPages}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-xl border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-all px-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        
        <div className="flex items-center gap-1 mx-2">
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            let pageNum = i + 1;
            
            if (totalPages > 5) {
              if (currentPage > 3) {
                pageNum = currentPage - 3 + i;
                if (pageNum > totalPages - 2) {
                   pageNum = totalPages - 4 + i;
                }
              }
            }
            
            if (pageNum > totalPages) return null;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                  currentPage === pageNum
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-xl border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-all px-4"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
