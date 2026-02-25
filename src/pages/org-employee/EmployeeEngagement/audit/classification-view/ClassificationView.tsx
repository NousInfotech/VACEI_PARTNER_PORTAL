import { useState, useMemo } from "react";
import ClassificationHeader from "./components/ClassificationHeader";
import ClassificationSummary from "./components/ClassificationSummary";
import ClassificationTable, { type TableRow } from "./components/ClassificationTable";
import ClassificationEvidence from "./components/ClassificationEvidence";
import ClassificationProcedures from "./components/ClassificationProcedures";
import ClassificationWorkbook from "./components/ClassificationWorkbook";
import { useETBData } from "../hooks/useETBData";
import { useClassification } from "../hooks/useClassification";
import { extractClassificationGroups, getRowsForClassification } from "../utils/classificationUtils";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/config/base";
import { endPoints } from "@/config/endPoint";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";

interface ClassificationViewProps {
    classificationId?: string;
    engagementId?: string;
    title?: string;
    subtitle?: string;
}


export default function ClassificationView({ classificationId, engagementId, title: propTitle }: ClassificationViewProps) {
    // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
    // Tab values match REFERENCE-PORTAL ClassificationSection (lead-sheet, evidence, procedures, work-book)
    const [activeTab, setActiveTab] = useState<string>('lead-sheet');

    // Fetch ETB data
    const { data: etbData, isLoading, trialBalanceId } = useETBData(engagementId);

    // Extract classification group and rows
    const classificationGroup = useMemo(() => {
        if (!etbData?.etbRows || !classificationId) return null;
        const groups = extractClassificationGroups(etbData.etbRows);
        return groups.find(g => `classification-${g.id}` === classificationId);
    }, [etbData?.etbRows, classificationId]);

    // Get or create classification record from database
    const { classificationId: dbClassificationId, isLoading: isLoadingClassification } = useClassification(
        classificationGroup ?? null,
        trialBalanceId
    );

    // Get rows for this classification
    const classificationRows = useMemo(() => {
        if (!etbData?.etbRows || !classificationGroup) return [];
        return getRowsForClassification(etbData.etbRows, classificationGroup);
    }, [etbData?.etbRows, classificationGroup]);

    // Convert to TableRow format
    const tableRows: TableRow[] = useMemo(() => {
        return classificationRows.map(row => ({
            code: row.code,
            accountName: row.accountName,
            currentYear: row.currentYear,
            reClassification: row.reClassification,
            adjustments: row.adjustments,
            finalBalance: row.finalBalance,
            priorYear: row.priorYear,
            linkedFiles: row.linkedFiles?.length || 0
        }));
    }, [classificationRows]);

    // Calculate summary from classification group totals
    const summary = useMemo(() => {
        if (classificationGroup?.totals) {
            return {
                currentYear: classificationGroup.totals.currentYear,
                priorYear: classificationGroup.totals.priorYear,
                adjustments: classificationGroup.totals.adjustments,
                finalBalance: classificationGroup.totals.finalBalance,
            };
        }
        // Fallback: calculate from rows
        return tableRows.reduce((acc, row) => ({
            currentYear: acc.currentYear + row.currentYear,
            priorYear: acc.priorYear + row.priorYear,
            adjustments: acc.adjustments + row.adjustments,
            finalBalance: acc.finalBalance + row.finalBalance,
        }), { currentYear: 0, priorYear: 0, adjustments: 0, finalBalance: 0 });
    }, [classificationGroup, tableRows]);

    // Fetch engagement when Procedures tab is active so we can pass it to ClassificationProcedures (avoids refetch in ProceduresTab)
    const { data: engagementData } = useQuery({
        queryKey: ["engagement-view", engagementId],
        enabled: !!engagementId && activeTab === "procedures",
        queryFn: () => apiGet<any>(endPoints.ENGAGEMENTS.GET_BY_ID(engagementId!)),
    });
    const engagement = engagementData?.data ?? engagementData;

    // Determine title
    const title = propTitle || classificationGroup?.label || 'Classification';

    // NOW conditional returns are safe
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-sm">Loading classification data...</p>
                </div>
            </div>
        );
    }

    if (!classificationGroup && classificationId) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                    <p className="text-sm">Classification not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-6">
            <Card className="flex-1 flex flex-col">
                <CardHeader>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">{title}</CardTitle>
                                <Badge variant="outline" className="mt-1">
                                    {tableRows.length} {tableRows.length === 1 ? 'account' : 'accounts'}
                                </Badge>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <ClassificationHeader title={title} accountCount={tableRows.length} actionsOnly />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col min-h-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="lead-sheet">Lead Sheet</TabsTrigger>
                            <TabsTrigger value="evidence">Evidence</TabsTrigger>
                            <TabsTrigger value="procedures">Procedures</TabsTrigger>
                            <TabsTrigger value="work-book">WorkBook</TabsTrigger>
                        </TabsList>

                        <TabsContent value="lead-sheet" className="flex-1 flex flex-col mt-4 space-y-6">
                            <ClassificationSummary
                                currentYear={summary.currentYear}
                                priorYear={summary.priorYear}
                                adjustments={summary.adjustments}
                                finalBalance={summary.finalBalance}
                            />
                            <ClassificationTable
                                title={`${title} - Cost`}
                                rows={tableRows}
                            />
                        </TabsContent>

                        <TabsContent value="evidence" className="flex-1 flex flex-col mt-4">
                            <ClassificationEvidence
                                classificationId={dbClassificationId}
                                engagementId={engagementId}
                                trialBalanceId={trialBalanceId}
                                isLoadingClassification={isLoadingClassification}
                            />
                        </TabsContent>

                        <TabsContent value="procedures" className="flex-1 flex flex-col mt-4">
                            <ClassificationProcedures title={title} engagementId={engagementId} engagement={engagement} />
                        </TabsContent>

                        <TabsContent value="work-book" className="flex-1 flex flex-col mt-4">
                            <ClassificationWorkbook
                                title={title}
                                engagementId={engagementId}
                                classification={title}
                                classificationId={dbClassificationId ?? undefined}
                                classificationRows={tableRows}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
