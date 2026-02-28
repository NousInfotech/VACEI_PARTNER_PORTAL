import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import ClassificationHeader from "./components/ClassificationHeader";
import ClassificationSummary from "./components/ClassificationSummary";
import ClassificationTable, { type TableRow } from "./components/ClassificationTable";
import ClassificationEvidence from "./components/ClassificationEvidence";
import ClassificationProcedures from "./components/ClassificationProcedures";
import ClassificationWorkbook from "./components/ClassificationWorkbook";
import { useETBData } from "../hooks/useETBData";
import { useClassification } from "../hooks/useClassification";
import { extractClassificationGroups, getRowsForClassification } from "../utils/classificationUtils";
import { Loader2, Eye, Save, MessageSquare, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/config/base";
import { endPoints } from "@/config/endPoint";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/Button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context-core";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/ui/Dialog";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/Textarea";
import { Checkbox } from "@/ui/checkbox";

/** Review record shape for UI (matches REFERENCE-PORTAL display). */
interface ReviewRecord {
    id: string;
    userId: string;
    userName: string;
    timestamp: string;
    comment: string;
    status: "pending" | "in-review" | "signed-off";
    isDone?: boolean;
}

interface ReviewWorkflowState {
    reviews: ReviewRecord[];
    isSignedOff: boolean;
}

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
    const { toast } = useToast();
    const { organizationMember, user } = useAuth();

    // Review / Sign-off / Review History state (matches REFERENCE-PORTAL ClassificationSection)
    const [reviewPointsOpen, setReviewPointsOpen] = useState(false);
    const [reviewHistoryOpen, setReviewHistoryOpen] = useState(false);
    const [confirmSignoffOpen, setConfirmSignoffOpen] = useState(false);
    const [reviewComment, setReviewComment] = useState("");
    const [isReviewDone, setIsReviewDone] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewWorkflow, setReviewWorkflow] = useState<ReviewWorkflowState | null>(null);
    const [reviewLoading, setReviewLoading] = useState(false);

    const currentUser = useMemo(() => {
        const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
            || user?.email
            || "Current user";
        return {
            id: organizationMember?.id ?? "",
            name: displayName,
        };
    }, [organizationMember?.id, user?.firstName, user?.lastName, user?.email]);

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

    /** Load review workflow for this classification (matches REFERENCE-PORTAL loadReviewWorkflow). */
    const loadReviewWorkflow = useCallback(async () => {
        if (!dbClassificationId) return;
        setReviewLoading(true);
        try {
            const res = await apiGet<any>(
                endPoints.AUDIT.GET_CLASSIFICATION_REVIEWS(dbClassificationId),
                { limit: 100, order: "desc" }
            );
            const payload = (res as any)?.data ?? (Array.isArray(res) ? res : undefined);
            const raw = Array.isArray(payload)
                ? payload
                : Array.isArray((payload as any)?.data)
                    ? (payload as any).data
                    : Array.isArray((payload as any)?.items)
                        ? (payload as any).items
                        : [];
            const reviews: ReviewRecord[] = raw.map((r: any) => ({
                id: r.id,
                userId: r.organizationalMemberId ?? "",
                userName: r.organizationalMemberId === organizationMember?.id ? currentUser.name : "User",
                timestamp: (r as any).createdAt ?? new Date().toISOString(),
                comment: r.comment ?? "",
                status: r.status === "SIGN_OFF" ? "signed-off" : r.status === "IN_REVIEW" ? "in-review" : "pending",
            }));
            const sorted = [...reviews].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            const latest = sorted[0];
            setReviewWorkflow({
                reviews: sorted,
                isSignedOff: latest?.status === "signed-off",
            });
        } catch (e: any) {
            toast({ title: "Failed to load reviews", description: e?.message ?? "Could not load review workflow", variant: "destructive" });
            setReviewWorkflow({ reviews: [], isSignedOff: false });
        } finally {
            setReviewLoading(false);
        }
    }, [dbClassificationId, organizationMember?.id, currentUser.name, toast]);

    useEffect(() => {
        if (dbClassificationId) loadReviewWorkflow();
    }, [dbClassificationId, loadReviewWorkflow]);

    // Refetch only when dialog transitions from closed to open (avoids overwriting optimistic updates)
    const prevReviewHistoryOpen = useRef(false);
    useEffect(() => {
        const justOpened = reviewHistoryOpen && !prevReviewHistoryOpen.current;
        prevReviewHistoryOpen.current = reviewHistoryOpen;
        if (justOpened && dbClassificationId) loadReviewWorkflow();
    }, [reviewHistoryOpen, dbClassificationId, loadReviewWorkflow]);

    /** Submit review comment (Review button flow – matches REFERENCE submitReviewComment). */
    const submitReviewComment = useCallback(async () => {
        if (!reviewComment.trim() || !dbClassificationId || !organizationMember?.id) {
            toast({ title: "Comment required", description: "Please add review comments before submitting.", variant: "destructive" });
            return;
        }
        setIsSubmittingReview(true);
        try {
            const res = await apiPost<{ data?: { id: string } }>(endPoints.AUDIT.CREATE_CLASSIFICATION_REVIEW(dbClassificationId), {
                organizationalMemberId: organizationMember.id,
                comment: reviewComment.trim(),
                status: "IN_REVIEW",
            });
            const created = (res as any)?.data ?? res;
            setReviewWorkflow((prev) => ({
                reviews: [
                    ...(prev?.reviews ?? []),
                    {
                        id: created?.id ?? "",
                        userId: organizationMember.id,
                        userName: currentUser.name,
                        timestamp: new Date().toISOString(),
                        comment: reviewComment.trim(),
                        status: "in-review",
                    },
                ],
                isSignedOff: false,
            }));
            setReviewPointsOpen(false);
            setReviewComment("");
            setIsReviewDone(false);
            toast({ title: "Review comments saved", description: "Your review has been saved successfully." });
        } catch (e: any) {
            toast({ title: "Save failed", description: e?.message ?? "Could not save review comments.", variant: "destructive" });
        } finally {
            setIsSubmittingReview(false);
        }
    }, [dbClassificationId, organizationMember?.id, reviewComment, currentUser.name, toast]);

    /** Perform sign-off (Sign-off button flow – matches REFERENCE performSignOff). */
    const performSignOff = useCallback(async () => {
        if (!dbClassificationId || !organizationMember?.id) return;
        setIsSubmittingReview(true);
        try {
            const res = await apiPost<{ data?: { id: string } }>(endPoints.AUDIT.CREATE_CLASSIFICATION_REVIEW(dbClassificationId), {
                organizationalMemberId: organizationMember.id,
                comment: "Classification signed off",
                status: "SIGN_OFF",
            });
            const created = (res as any)?.data ?? res;
            setReviewWorkflow((prev) => ({
                reviews: [
                    ...(prev?.reviews ?? []),
                    {
                        id: created?.id ?? "",
                        userId: organizationMember.id,
                        userName: currentUser.name,
                        timestamp: new Date().toISOString(),
                        comment: "Classification signed off",
                        status: "signed-off",
                    },
                ],
                isSignedOff: true,
            }));
            setConfirmSignoffOpen(false);
            toast({ title: "Classification signed off", description: "This section is now signed off." });
        } catch (e: any) {
            toast({ title: "Sign-off failed", description: e?.message ?? "Could not sign off.", variant: "destructive" });
        } finally {
            setIsSubmittingReview(false);
        }
    }, [dbClassificationId, organizationMember?.id, currentUser.name, toast]);

    const isSignedOff = reviewWorkflow?.isSignedOff ?? false;
    const isReviewDisabled = isSignedOff || !currentUser.id || reviewLoading;
    const isSignOffDisabled = isSignedOff || !currentUser.id || reviewLoading;

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
                                <ClassificationHeader
                                    title={title}
                                    accountCount={tableRows.length}
                                    actionsOnly
                                    onReviewClick={() => setReviewPointsOpen(true)}
                                    onSignOffClick={() => setConfirmSignoffOpen(true)}
                                    onReviewHistoryClick={() => setReviewHistoryOpen(true)}
                                    reviewDisabled={isReviewDisabled}
                                    signOffDisabled={isSignOffDisabled}
                                />
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

                {/* Review Points & Comments dialog – matches REFERENCE-PORTAL */}
                <Dialog open={reviewPointsOpen} onOpenChange={setReviewPointsOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Review Points & Comments</DialogTitle>
                            <DialogDescription>
                                Add your review comments for: <span className="font-semibold">{title}</span>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Eye className="h-4 w-4" />
                                <span>Reviewing as: {currentUser.name || "Loading..."}</span>
                            </div>
                            <div>
                                <Label htmlFor="review-comment">Review Comments *</Label>
                                <Textarea
                                    id="review-comment"
                                    placeholder="Enter your review comments, observations, or points to address..."
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    rows={6}
                                    className="mt-1"
                                />
                                <p className="text-sm text-muted-foreground mt-1">* Comments are required for review submission</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="review-done"
                                    checked={isReviewDone}
                                    onCheckedChange={(checked) => setIsReviewDone(checked === true)}
                                />
                                <Label htmlFor="review-done" className="text-sm font-medium">
                                    Mark this review as completed
                                </Label>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setReviewPointsOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={submitReviewComment}
                                disabled={!reviewComment.trim() || isSubmittingReview}
                            >
                                {isSubmittingReview ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                )}
                                Save Review
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Confirm Sign-off dialog – matches REFERENCE-PORTAL */}
                <Dialog open={confirmSignoffOpen} onOpenChange={setConfirmSignoffOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Confirm Sign-off</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to sign off this classification? This action cannot be undone and will lock the section for editing.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Save className="h-4 w-4" />
                                <span>Signing off as: {currentUser.name || "Loading..."}</span>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setConfirmSignoffOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={performSignOff} disabled={isSubmittingReview}>
                                {isSubmittingReview ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Yes, Sign Off
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Review History dialog – matches REFERENCE-PORTAL */}
                <Dialog open={reviewHistoryOpen} onOpenChange={setReviewHistoryOpen}>
                    <DialogContent className="min-w-[70vw] max-w-[90vw] h-[70vh] flex flex-col p-0">
                        <DialogHeader className="shrink-0 px-6 py-4 border-b relative">
                            <DialogTitle>Review History</DialogTitle>
                            <DialogDescription>
                                Audit trail for: <span className="font-semibold">{title}</span>
                            </DialogDescription>
                            <button
                                type="button"
                                onClick={() => setReviewHistoryOpen(false)}
                                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            {!reviewWorkflow?.reviews?.length ? (
                                <div className="text-center text-muted-foreground">No review history found for this classification.</div>
                            ) : (
                                <div className="relative pl-6">
                                    <div className="absolute left-1 top-0 bottom-0 w-0.5 bg-border" />
                                    {reviewWorkflow.reviews.map((review, index) => (
                                        <div key={review.id} className="relative mb-6 pb-2">
                                            <div className="absolute left-0 top-0 -ml-2.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground z-10 text-xs">
                                                {review.status === "signed-off" ? "🔒" : review.status === "in-review" ? "👤" : "📝"}
                                            </div>
                                            <div className="ml-6 flex flex-col">
                                                <div className="flex items-baseline justify-between mb-1">
                                                    <span className="font-semibold text-sm capitalize">
                                                        {review.status === "signed-off" ? "Signed Off" : review.status === "in-review" ? "In Review" : "Review"}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(review.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    <strong className="text-foreground">Performed by:</strong> {review.userName || "N/A"}
                                                </p>
                                                {review.comment && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        <strong className="text-foreground">Comments:</strong> {review.comment}
                                                    </p>
                                                )}
                                                <div className="mt-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs ${
                                                            review.status === "signed-off"
                                                                ? "bg-green-50 text-green-700 border-green-200"
                                                                : review.status === "in-review"
                                                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                                                  : "bg-muted text-muted-foreground"
                                                        }`}
                                                    >
                                                        {review.status === "signed-off" ? "✓ Signed Off" : review.status === "in-review" ? "⏳ In Review" : "⏳ Pending"}
                                                    </Badge>
                                                </div>
                                            </div>
                                            {index < reviewWorkflow.reviews.length - 1 && (
                                                <div className="ml-6 mt-4 border-t border-border" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </Card>
        </div>
    );
}
