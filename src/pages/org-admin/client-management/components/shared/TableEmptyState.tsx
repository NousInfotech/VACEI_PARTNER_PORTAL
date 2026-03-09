import { TableRow, TableCell } from "@/ui/Table";

interface TableEmptyStateProps {
  colSpan: number;
  icon: React.ElementType;
  message: string;
}

export const TableEmptyState = ({ colSpan, icon: Icon, message }: TableEmptyStateProps) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="py-20 text-center">
      <div className="flex flex-col items-center justify-center">
        <Icon className="h-10 w-10 text-gray-200 mb-3" />
        <p className="text-gray-500 font-bold">{message}</p>
      </div>
    </TableCell>
  </TableRow>
);

export default TableEmptyState;
