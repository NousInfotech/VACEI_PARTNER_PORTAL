import { Search } from "lucide-react";
import { Input } from "@/ui/input";

interface TableSearchProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export const TableSearch = ({ placeholder, value, onChange }: TableSearchProps) => (
  <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
    <div className="relative w-full md:w-80">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input 
        placeholder={placeholder}
        className="pl-11 h-11 bg-gray-50 border-none rounded-2xl focus-visible:ring-primary/20"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
    </div>
  </div>
);

export default TableSearch;
