import { Eye, FileText, Flag, RefreshCw, Save } from "lucide-react";
import { Button } from "../../../../../../ui/Button";

interface ClassificationHeaderProps {
    title: string;
    accountCount: number;
    /** When true, only render the action buttons (e.g. inside Card header) */
    actionsOnly?: boolean;
}

export default function ClassificationHeader({ title, accountCount, actionsOnly }: ClassificationHeaderProps) {
    const actions = (
        <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-2 text-muted-foreground">
                <Eye size={16} />
                Review
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-muted-foreground">
                <FileText size={16} />
                Sign-off
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-muted-foreground">
                <Flag size={16} />
                Review History
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-muted-foreground">
                <RefreshCw size={16} />
                Reload Data
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-muted-foreground">
                <Save size={16} />
                Save As Spreadsheet
            </Button>
        </div>
    );

    if (actionsOnly) return actions;

    return (
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {accountCount} account{accountCount !== 1 ? 's' : ''}
                </span>
            </div>
            {actions}
        </div>
    );
}
