import { Badge } from "@/ui/badge";
import { cn } from "@/lib/utils";

interface EngagementStatusBadgeProps {
  status: string;
}

export const EngagementStatusBadge = ({ status }: EngagementStatusBadgeProps) => {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return 'outline';
      case 'ACCEPTED': return 'secondary';
      case 'ACTIVE': return 'secondary';
      case 'REJECTED': return 'destructive';
      case 'COMPLETED': return 'default';
      default: return 'outline';
    }
  };

  return (
    <Badge 
      variant={getStatusBadgeVariant(status) as any}
      className={cn(
        "uppercase tracking-widest text-[10px] px-2.5 py-0.5",
        ['ACTIVE', 'ASSIGNED', 'REJECTED'].includes(status) && "border-primary text-primary bg-white hover:bg-white"
      )}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
};

export default EngagementStatusBadge;
