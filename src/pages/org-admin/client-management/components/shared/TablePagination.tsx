import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/ui/Button";
import { cn } from "@/lib/utils";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  startIndex: number;
  totalItems: number;
  itemsPerPage: number;
  itemName: string;
}

export const TablePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  startIndex,
  totalItems,
  itemsPerPage,
  itemName
}: TablePaginationProps) => (
  <div className="flex items-center justify-between px-8 py-5 border-t border-gray-50 bg-gray-50/30">
    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
      Showing <span className="text-gray-900">{startIndex + 1}</span> to <span className="text-gray-900">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="text-gray-900">{totalItems}</span> {itemName}
    </div>
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-9 w-9 p-0 rounded-xl border-gray-200 flex items-center justify-center"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={16} />
      </Button>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8 w-8 rounded-xl font-black text-[10px]",
              currentPage === page ? "bg-primary text-white border-primary" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-9 w-9 p-0 rounded-xl border-gray-200 flex items-center justify-center"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  </div>
);

export default TablePagination;
