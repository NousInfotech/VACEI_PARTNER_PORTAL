import { useQuery } from "@tanstack/react-query";
import { 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  FileText,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { ShadowCard } from "../../ui/ShadowCard";
import { Button } from "../../ui/Button";
import { Skeleton } from "../../ui/Skeleton";
import { cn } from "../../lib/utils";
import { MOCK_COMPLIANCE } from "../../lib/compliance";

export const EmployeeCompliance: React.FC = () => {
  const { isLoading: loading } = useQuery({
    queryKey: ['employee-compliance'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return MOCK_COMPLIANCE;
    }
  });
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
            [1, 2, 3, 4].map((i) => (
                <ShadowCard key={i} className="p-5 border border-primary/5 flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-5 w-3/4" />
                    </div>
                </ShadowCard>
            ))
        ) : (
            [
              { label: "Total Tasks", value: 12, icon: FileText, color: "primary" },
              { label: "Critical", value: 2, icon: AlertCircle, color: "dark" },
              { label: "Completed", value: 8, icon: CheckCircle2, color: "primary" },
              { label: "Pending", value: 4, icon: Clock, color: "primary" },
            ].map((stat, i) => (
              <ShadowCard key={i} className="p-5 border border-primary/5 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-primary/5 text-primary/60">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-dark/44">{stat.label}</p>
                  <h3 className="text-xl text-primary mt-0.5">{stat.value}</h3>
                </div>
              </ShadowCard>
            ))
        )}
      </div>

      <ShadowCard className="overflow-hidden border border-primary/10">
        <div className="p-6 border-b border-primary/5 bg-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary/60" />
            <h2 className="text-2xl text-primary tracking-tight font-medium">Compliance Tracking</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="default">
              Filter by Status
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-primary/5">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-dark/44 font-normal">Task Details</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-dark/44 font-normal">Category</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-dark/44 font-normal">Due Date</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-dark/44 font-normal">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-dark/44 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                      <tr key={i}>
                          <td className="px-6 py-4 space-y-2">
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-3 w-32" />
                          </td>
                          <td className="px-6 py-4"><Skeleton className="h-5 w-20 rounded-md" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                          <td className="px-6 py-4 text-right"><Skeleton className="h-7 w-20 rounded-lg ml-auto" /></td>
                      </tr>
                  ))
              ) : (
                  MOCK_COMPLIANCE.map((item) => (
                    <tr key={item.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-sm text-primary tracking-tight">{item.title}</p>
                        <p className="text-[11px] text-primary/40 mt-0.5 tracking-wide">{item.companyName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-primary/60 px-2 py-0.5 rounded-md bg-primary/5">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-primary/60">
                          <Calendar className="h-3.5 w-3.5 text-primary/30" />
                          {item.dueDate}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full tracking-wider",
                          item.status === "COMPLETED" ? "bg-green-50 text-green-600/70" :
                          item.status === "PENDING" ? "bg-orange-50 text-orange-600/70" :
                          "bg-rose-50 text-rose-600/70"
                        )}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" className="text-[10px] h-7 px-3 rounded-lg text-primary/40 hover:text-primary hover:bg-primary/5">
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </ShadowCard>
    </div>
  );
};

export default EmployeeCompliance;
