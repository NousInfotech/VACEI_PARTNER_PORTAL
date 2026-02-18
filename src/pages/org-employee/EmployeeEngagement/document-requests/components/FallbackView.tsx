import { FileText } from "lucide-react";
import { ShadowCard } from "../../../../../ui/ShadowCard";

export const FallbackView = () => (
  <ShadowCard className="p-12 text-center bg-gray-50/30 border-dashed">
    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900">No document requests yet</h3>
    <p className="text-gray-500 mt-2">New document request groups will appear here once created.</p>
  </ShadowCard>
);
