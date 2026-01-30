import TaxManagementCard from "./components/TaxManagementCard";
import DocumentOverviewCard from "./components/DocumentOverviewCard";
import TaxUpdateStatusCard from "./components/TaxUpdateStatusCard";
import UploadDraftDocumentCard from "./components/UploadDraftDocumentCard";
import UploadFinalDocumentCard from "./components/UploadFinalDocumentCard";
import TaxStatusHistoryCard from "./components/TaxStatusHistoryCard";

export default function TaxView() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <div>
                    <TaxManagementCard status="Rejected" />
                </div>
                <div>
                    <DocumentOverviewCard />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="h-full">
                    <TaxUpdateStatusCard />
                </div>
                <div className="h-full">
                    <UploadDraftDocumentCard />
                </div>
                <div className="h-full">
                    <UploadFinalDocumentCard />
                </div>
                <div className="h-full">
                    <TaxStatusHistoryCard />
                </div>
            </div>
        </div>
    );
}
