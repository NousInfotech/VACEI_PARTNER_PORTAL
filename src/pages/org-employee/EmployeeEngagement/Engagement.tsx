import { useState, useEffect } from "react";
import { 
  ArrowRight,
} from "lucide-react";
import { ShadowCard } from "../../../ui/ShadowCard";
import { Button } from "../../../ui/Button";
import { Skeleton } from "../../../ui/Skeleton";

const MOCK_ENGAGEMENTS = [
  { 
    id: "ENG-2024-001", 
    name: "Acme Corp Tax Audit", 
    progress: 75,
   },
  { 
    id: "ENG-2024-002", 
    name: "Global Logistics VAT Filing", 
    progress: 30,
   },
  { 
    id: "ENG-2024-003", 
    name: "Bistro Malta Payroll", 
    progress: 100,
    },
];

export default function Engagement() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleViewDetails = (id: string) => {
    window.open(`/engagement-view/${id}`, '_blank');
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
            MOCK_ENGAGEMENTS.map((engagement) => (
              <ShadowCard key={engagement.id} className="group hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 flex flex-col">
                {/* Header info */}
                <div className="p-6 flex-1">
                  <h3 className="text-xl font-medium mb-2 group-hover:text-primary transition-colors line-clamp-1">
                    {engagement.name}
                  </h3>  
                </div>

                {/* Action Area */}
                  <Button 
                    onClick={() => handleViewDetails(engagement.id)} className="w-full">
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
