import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
} from "lucide-react";
import { ShadowCard } from "../../../ui/ShadowCard";
import { Button } from "../../../ui/Button";
import { Skeleton } from "../../../ui/Skeleton";
import { useAuth } from "../../../context/auth-context-core";

const MOCK_ENGAGEMENTS = [
  {
    id: "ENG-2024-001",
    name: "Acme Corp Tax Audit",
    progress: 75,
    service: "TAX"
  },
  {
    id: "ENG-2024-002",
    name: "Global Logistics VAT Filing",
    progress: 30,
    service: "VAT"
  },
  {
    id: "ENG-2024-003",
    name: "Bistro Malta Payroll",
    progress: 100,
    service: "PAYROLL"
  },
  {
    id: "ENG-2024-004",
    name: "Tech Solutions Annual Audit",
    progress: 15,
    service: "AUDITING"
  },
  {
    id: "ENG-2024-005",
    name: "StartUp Inc MBR Registration",
    progress: 60,
    service: "MBR"
  },
  {
    id: "ENG-2024-006",
    name: "Retail Group Accounting Review",
    progress: 45,
    service: "ACCOUNTING"
  },
  {
    id: "ENG-2024-007",
    name: "Legal Compliance Review",
    progress: 90,
    service: "LEGAL"
  },
  {
    id: "ENG-2024-008",
    name: "CFO Services - Monthly Reporting",
    progress: 80,
    service: "CFO"
  },
  {
    id: "ENG-2024-009",
    name: "Corporate Services - Annual Return",
    progress: 65,
    service: "CSP"
  }
];

export default function Engagement() {
  const { selectedService } = useAuth();

  const { isLoading: loading } = useQuery({
    queryKey: ['employee-engagements'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return MOCK_ENGAGEMENTS;
    }
  });

  const filteredEngagements = MOCK_ENGAGEMENTS.filter(engagement => {
    if (!selectedService) return true;
    return engagement.service === selectedService;
  });

  const handleViewDetails = (service: string) => {
    window.open(`/engagement-view/services/${service}`, '_blank');
  };

  return (
    <div className="mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((i) => (
            <ShadowCard key={i} className="p-6 border border-gray-100 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </ShadowCard>
          ))
        ) : (
          filteredEngagements.map((engagement) => (
            <ShadowCard key={engagement.id} className="group hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 flex flex-col">
              {/* Header info */}
              <div className="p-6 flex-1">
                <h3 className="text-xl font-medium mb-2 group-hover:text-primary transition-colors line-clamp-1">
                  {engagement.name}
                </h3>
              </div>

              {/* Action Area */}
              <Button
                onClick={() => handleViewDetails(engagement.service)} className="w-full">
                View Details
                <ArrowRight size={16} />
              </Button>
            </ShadowCard>
          ))
        )}
      </div>
    </div>
  );
}
