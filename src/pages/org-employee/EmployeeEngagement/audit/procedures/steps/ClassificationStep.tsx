import type React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/Button";
import { Checkbox } from "@/ui/checkbox";
import { Badge } from "@/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/Table";
import { ScrollArea } from "@/ui/scroll-area";
import { Alert, AlertDescription } from "@/ui/alert";
import {
  CheckCircle,
  ArrowRight,
  Filter,
  AlertCircle,
  Euro,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useETBData } from "../../hooks/useETBData";

interface ClassificationStepProps {
  engagement: any;
  mode: string;
  stepData: any;
  onComplete: (data: any) => void;
  onBack: () => void;
}

function getDeepestClassification(classification: string) {
  if (!classification) return "";
  const parts = classification.split(" > ");
  const topLevel = parts[0];
  if (topLevel === "Assets" || topLevel === "Liabilities") {
    return parts.slice(0, 3).join(" > ");
  }
  return topLevel;
}

function formatClassificationForDisplay(classification: string) {
  if (!classification) return "Unclassified";
  const parts = classification.split(" > ");
  const topLevel = parts[0];
  if (topLevel === "Assets" || topLevel === "Liabilities") {
    return parts[parts.length - 1];
  }
  return topLevel;
}

export const ClassificationStep: React.FC<ClassificationStepProps> = ({
  engagement,
  mode: _mode,
  stepData,
  onComplete,
  onBack: _onBack,
}) => {
  const engagementId = engagement?.id ?? engagement?._id;
  const { data: etbData, isLoading: loading } = useETBData(engagementId);

  const [validitySelections, setValiditySelections] = useState<any[]>([]);
  const [selectedClassifications, setSelectedClassifications] = useState<
    string[]
  >([]);
  const { toast } = useToast();

  const materiality = stepData.materiality ?? 0;
  const etbRows = etbData?.etbRows ?? [];

  useEffect(() => {
    if (!etbRows.length) return;
    const initialSelections = etbRows.map((row: any, idx: number) => {
      const rowId =
        row.accountId ??
        row.id ??
        `${row.code ?? "NA"}::${row.accountName ?? "NA"}::${idx}`;
      const classification =
        row.classification ||
        [row.group1, row.group2, row.group3].filter(Boolean).join(" > ");
      const trimmed = classification?.trim() ?? "";
      const hasValidClassification =
        trimmed.length > 0 &&
        trimmed.toLowerCase() !== "unclassified";
      const meetsMateriality = Math.abs(row.finalBalance ?? 0) >= materiality;
      return {
        rowId,
        code: row.code,
        accountName: row.accountName,
        finalBalance: row.finalBalance ?? 0,
        classification,
        isValid: meetsMateriality && hasValidClassification,
      };
    });
    setValiditySelections(initialSelections);
    const validRows = initialSelections.filter((s) => s.isValid && s.classification);
    const uniqueClassifications = [
      ...new Set(validRows.map((r) => getDeepestClassification(r.classification))),
    ].filter((c) => Boolean(c) && c !== "Unclassified");
    setSelectedClassifications(uniqueClassifications);
  }, [etbRows, materiality]);

  const handleValidityChange = (rowId: string, isValid: boolean) => {
    setValiditySelections((prev) => {
      const next = prev.map((selection) =>
        selection.rowId === rowId ? { ...selection, isValid } : selection
      );
      const validRows = next.filter((s) => s.isValid && s.classification);
      const uniqueClassifications = [
        ...new Set(
          validRows.map((r) => getDeepestClassification(r.classification))
        ),
      ].filter((c) => Boolean(c) && c !== "Unclassified");
      setSelectedClassifications(uniqueClassifications);
      return next;
    });
  };

  const handleSelectAll = () => {
    const allSelected = validitySelections.every((s) => s.isValid);
    const newIsValid = !allSelected;
    setValiditySelections((prev) => {
      const next = prev.map((selection) => ({
        ...selection,
        isValid: newIsValid,
      }));
      const validRows = next.filter((s) => s.isValid && s.classification);
      const uniqueClassifications = [
        ...new Set(
          validRows.map((r) => getDeepestClassification(r.classification))
        ),
      ].filter((c) => Boolean(c) && c !== "Unclassified");
      setSelectedClassifications(uniqueClassifications);
      return next;
    });
  };

  const handleClassificationToggle = (classification: string) => {
    setSelectedClassifications((prev) =>
      prev.includes(classification)
        ? prev.filter((c) => c !== classification)
        : [...prev, classification]
    );
  };

  const handleProceed = () => {
    if (selectedClassifications.length === 0) {
      toast({
        title: "No Classifications Selected",
        description:
          "Please select at least one classification to proceed.",
        variant: "destructive",
      });
      return;
    }
    onComplete({
      validitySelections,
      selectedClassifications,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const validSelections = validitySelections.filter((s) => s.isValid);
  const totalValidAmount = validSelections.reduce(
    (sum, s) => sum + Math.abs(s.finalBalance),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4 border-blue-600" />
          <p className="text-muted-foreground font-body text-gray-500">
            Loading Extended Trial Balance data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="font-heading text-xl text-foreground flex items-center gap-2 text-gray-900">
            <Filter className="h-5 w-5 text-primary text-blue-600" />
            Account Selection & Classifications
          </CardTitle>
          <p className="text-muted-foreground font-body text-gray-600">
            Review and adjust the accounts selected based on your materiality
            threshold of <strong>{formatCurrency(stepData.materiality)}</strong>.
            Then confirm the classifications for procedure generation.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg bg-blue-100">
                <CheckCircle className="h-5 w-5 text-primary text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-body text-gray-500">
                  Selected Accounts
                </p>
                <p className="text-xl font-body-semibold text-foreground text-gray-900">
                  {validSelections.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg bg-gray-100">
                <Euro className="h-5 w-5 text-accent text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-body text-gray-500">
                  Total Amount
                </p>
                <p className="text-xl font-body-semibold text-foreground text-gray-900">
                  {formatCurrency(totalValidAmount)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg bg-gray-100">
                <AlertCircle className="h-5 w-5 text-secondary text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-body text-gray-500">
                  Classifications
                </p>
                <p className="text-xl font-body-semibold text-foreground text-gray-900">
                  {selectedClassifications.length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-lg text-foreground text-gray-900">
              Extended Trial Balance
            </CardTitle>
            <Button
              size="sm"
              onClick={handleSelectAll}
              className="font-body"
            >
              {validitySelections.every((s) => s.isValid)
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground font-body text-gray-500">
            Accounts with final balance ≥ {formatCurrency(stepData.materiality)}{" "}
            are pre-selected. You can adjust selections manually.
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Valid</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead className="text-right">Final Balance</TableHead>
                  <TableHead>Classification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validitySelections.map((selection) => (
                  <TableRow
                    key={selection?.rowId}
                    className={selection.isValid ? "bg-muted/20 bg-gray-50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selection.isValid}
                        onCheckedChange={(checked) =>
                          handleValidityChange(selection.rowId, !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {selection.code}
                    </TableCell>
                    <TableCell className="font-body">
                      {selection.accountName}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(selection.finalBalance)}
                    </TableCell>
                    <TableCell>
                      {selection.classification ? (
                        <Badge
                          variant="outline"
                          className="font-body text-xs"
                        >
                          {formatClassificationForDisplay(
                            selection.classification
                          )}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm font-body text-gray-500">
                          Unclassified
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedClassifications.length > 0 && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-foreground text-gray-900">
              Selected Classifications
            </CardTitle>
            <p className="text-sm text-muted-foreground font-body text-gray-500">
              These classifications will be used for procedure generation. You
              can deselect any you don&apos;t want to include.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                ...new Set(
                  validSelections
                    .map((s) => getDeepestClassification(s.classification))
                    .filter(Boolean),
                ),
              ].map((classification) => (
                <div key={classification} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedClassifications.includes(classification)}
                    onCheckedChange={() =>
                      handleClassificationToggle(classification)
                    }
                  />
                  <Badge
                    variant={
                      selectedClassifications.includes(classification)
                        ? "default"
                        : "outline"
                    }
                    className={`font-body cursor-pointer ${selectedClassifications.includes(classification) ? "!bg-gray-800 !text-white hover:!bg-gray-700" : ""}`}
                    onClick={() =>
                      handleClassificationToggle(classification)
                    }
                  >
                    {formatClassificationForDisplay(classification)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClassifications.length === 0 && (
        <Alert className="border-gray-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-body text-gray-600">
            No classifications are currently selected. Please select at least
            one account with a classification to proceed with procedure
            generation.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-end justify-end">
        <Button
          onClick={handleProceed}
          disabled={selectedClassifications.length === 0}
          variant="default"
          className="flex items-center gap-2"
        >
          Proceed to Procedures
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
