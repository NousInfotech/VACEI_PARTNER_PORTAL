import MBRManagementCard from "./components/MBRManagementCard";
import StatusOverviewCard from "./components/StatusOverviewCard";
import UpdateStatusCard from "./components/UpdateStatusCard";
import UploadDocumentCard from "./components/UploadDocumentCard";
import StatusHistoryCard from "./components/StatusHistoryCard";

export default function MBRView() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <MBRManagementCard status="Pending" />
                </div>
                <div>
                    <StatusOverviewCard />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-full">
                    <UpdateStatusCard />
                </div>
                <div className="h-full">
                    <UploadDocumentCard />
                </div>
                <div className="h-full">
                    <StatusHistoryCard />
                </div>
            </div>
        </div>
    );
}
