import { Eye, FileText, Flag, Maximize2, RefreshCw, Save } from "lucide-react";
import { Button } from "../../../../../../ui/Button";

interface ClassificationHeaderProps {
    title: string;
    accountCount: number;
}

export default function ClassificationHeader({ title, accountCount }: ClassificationHeaderProps) {
    return (
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                    {accountCount} account{accountCount !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2 text-gray-600">
                    <Eye size={16} />
                    Review
                </Button>
                <Button variant="outline" size="sm" className="gap-2 text-gray-600">
                    <FileText size={16} />
                    Sign-off
                </Button>
                <Button variant="outline" size="sm" className="gap-2 text-gray-600">
                    <Flag size={16} />
                    Review History
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                    <Maximize2 size={16} />
                </Button>
                <Button variant="outline" size="sm" className="gap-2 text-gray-600">
                    <RefreshCw size={16} />
                    Reload Data
                </Button>
                <Button variant="outline" size="sm" className="gap-2 text-gray-600">
                    <Save size={16} />
                    Save As Spreadsheet
                </Button>
            </div>
        </div>
    );
}
