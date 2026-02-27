import { Eye, FileText, Flag, RefreshCw, Save } from "lucide-react";
import { Button } from "../../../../../../ui/Button";

interface ClassificationHeaderProps {
    title: string;
    accountCount: number;
    /** When true, only render the action buttons (e.g. inside Card header) */
    actionsOnly?: boolean;
    /** Called when Review is clicked — switch to Procedures tab and show View (fieldwork procedures) */
    onReviewClick?: () => void;
    /** Called when Sign-off is clicked — switch to Procedures tab and show View (sign-off context) */
    onSignOffClick?: () => void;
    /** Called when Review History is clicked — switch to Procedures tab and show Review History */
    onReviewHistoryClick?: () => void;
    /** Called when Reload Data is clicked */
    onReloadClick?: () => void;
    /** Called when Save As Spreadsheet is clicked */
    onSaveSpreadsheetClick?: () => void;
    /** Disable Review button (e.g. when signed off or loading) – matches REFERENCE-PORTAL */
    reviewDisabled?: boolean;
    /** Disable Sign-off button (e.g. when already signed off or loading) – matches REFERENCE-PORTAL */
    signOffDisabled?: boolean;
}

export default function ClassificationHeader({
    title,
    accountCount,
    actionsOnly,
    onReviewClick,
    onSignOffClick,
    onReviewHistoryClick,
    onReloadClick,
    onSaveSpreadsheetClick,
    reviewDisabled = false,
    signOffDisabled = false,
}: ClassificationHeaderProps) {
    const actions = (
        <div className="flex gap-2 flex-wrap">
            <Button
                variant="outline"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={onReviewClick}
                disabled={reviewDisabled}
            >
                <Eye size={16} />
                Review
            </Button>
            <Button
                variant="outline"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={onSignOffClick}
                disabled={signOffDisabled}
            >
                <FileText size={16} />
                Sign-off
            </Button>
            <Button
                variant="outline"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={onReviewHistoryClick}
            >
                <Flag size={16} />
                Review History
            </Button>
            <Button
                variant="outline"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={onReloadClick}
            >
                <RefreshCw size={16} />
                Reload Data
            </Button>
            <Button
                variant="outline"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={onSaveSpreadsheetClick}
            >
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
