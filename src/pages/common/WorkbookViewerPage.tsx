import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../config/base';
import { endPoints } from '../../config/endPoint';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import ExcelViewer from '../org-employee/EmployeeEngagement/audit/classification-view/components/excel-viewer/ExcelViewer';

interface Workbook {
    id: string;
    name: string;
    webUrl?: string;
    cloudFileId?: string;
    engagementId?: string;
    classification?: string | null;
    category?: string | null;
    sheets?: Array<{ id: string; name: string }>;
}

export default function WorkbookViewerPage() {
    const { workbookId } = useParams<{ workbookId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const engagementId = searchParams.get('engagementId');
    const classification = searchParams.get('classification');
    const classificationId = searchParams.get('classificationId');

    const { data: workbook, isLoading, error } = useQuery<Workbook>({
        queryKey: ['workbook', workbookId],
        queryFn: async () => {
            if (!workbookId) throw new Error('Workbook ID is required');
            const response = await apiGet<{ data: Workbook }>(endPoints.AUDIT.GET_WORKBOOK(workbookId));
            return response.data || response;
        },
        enabled: !!workbookId,
        retry: 2,
    });

    const handleBack = () => {
        if (window.opener) {
            window.close();
        } else {
            navigate(-1);
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-4 text-gray-600">Loading workbook...</p>
            </div>
        );
    }

    if (error || !workbook || !workbookId) {
        return (
            <div className="h-screen w-screen flex flex-col bg-gray-100">
                <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm shrink-0">
                    <button
                        onClick={handleBack}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-800">Workbook Viewer</h1>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-lg font-semibold text-gray-900 mb-2">Failed to load workbook</p>
                        <p className="text-sm text-gray-500">
                            {error instanceof Error ? error.message : 'Workbook not found or could not be loaded'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex flex-col bg-gray-100">
            <ExcelViewer
                workbookId={workbookId}
                workbookName={workbook.name}
                workbookWebUrl={workbook.webUrl}
                engagementId={engagementId || undefined}
                classification={classification || undefined}
                classificationId={classificationId || undefined}
                onBack={handleBack}
            />
        </div>
    );
}
