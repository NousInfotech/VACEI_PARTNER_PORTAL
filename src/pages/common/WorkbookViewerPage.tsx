import { useSearchParams, useNavigate } from 'react-router-dom';
import ExcelSheetViewer from '../org-employee/EmployeeEngagement/audit/classification-view/components/ExcelSheetViewer';
import { ArrowLeft } from 'lucide-react';

export default function WorkbookViewerPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const filename = searchParams.get('filename') || 'New Workbook';

    const handleBack = () => {
        if (window.opener) {
            window.close();
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-gray-100">
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm shrink-0">
                <button
                    onClick={handleBack}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-semibold text-gray-800">{filename}</h1>
            </div>
            <div className="flex-1 p-4 overflow-hidden">
                <ExcelSheetViewer filename={filename} />
            </div>
        </div>
    );
}
