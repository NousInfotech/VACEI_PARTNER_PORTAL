import { ProceduresTab } from "../../procedures/ProceduresTab";

interface ClassificationProceduresProps {
    title: string;
    engagementId?: string;
    /** Engagement object for procedures (optional; fetched by ProceduresTab if not provided) */
    engagement?: any;
    /** DB classification id for per-classification fieldwork procedure persistence */
    classificationId?: string;
}

/**
 * Procedures tab content inside Sections → Classification view.
 * Matches REFERENCE-PORTAL Section's Procedures tab:
 * - Header shows classification name (title)
 * - Generate / View Procedures tabs with procedure type selection (Planning, Field Work, Completion)
 * - View disabled when no procedures match this classification
 * - Fieldwork view filtered by current classification
 */
export default function ClassificationProcedures({
    title,
    engagementId,
    engagement,
    classificationId,
}: ClassificationProceduresProps) {
    if (!engagementId) {
        return (
            <div className="p-6 text-muted-foreground">
                No engagement context. Open a classification from the Sections sidebar.
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <ProceduresTab
                engagementId={engagementId}
                engagement={engagement}
                classification={title}
                classificationId={classificationId}
            />
        </div>
    );
}
