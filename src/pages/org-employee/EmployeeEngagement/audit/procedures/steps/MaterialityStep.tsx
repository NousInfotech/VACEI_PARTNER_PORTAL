import type React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Alert, AlertDescription } from "@/ui/alert";
import { Calculator, TrendingUp, ArrowRight, Info, Euro } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MaterialityStepProps {
  engagement: any;
  mode: string;
  stepData: any;
  onComplete: (data: any) => void;
  onBack: () => void;
}

export const MaterialityStep: React.FC<MaterialityStepProps> = ({
  engagement: _engagement,
  mode: _mode,
  stepData,
  onComplete,
  onBack: _onBack,
}) => {
  const [materiality, setMateriality] = useState<string>(
    stepData.materiality?.toString() || ""
  );
  const [isValid, setIsValid] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const value = Number.parseFloat(materiality);
    setIsValid(!Number.isNaN(value) && value > 0);
  }, [materiality]);

  const handleProceed = () => {
    const materialityValue = Number.parseFloat(materiality);
    if (!isValid) {
      toast({
        title: "Invalid Materiality",
        description:
          "Please enter a valid materiality amount greater than 0.",
        variant: "destructive",
      });
      return;
    }
    onComplete({ materiality: materialityValue });
  };

  const formatCurrency = (amount: string) => {
    const value = Number.parseFloat(amount);
    if (Number.isNaN(value)) return "";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getMaterialityGuidance = () => {
    const value = Number.parseFloat(materiality);
    if (Number.isNaN(value) || value <= 0) return null;
    let guidance = "";
    let color = "text-muted-foreground text-gray-500";
    if (value < 1000) {
      guidance = "Very low materiality - suitable for small entities";
      color = "text-blue-600";
    } else if (value < 10000) {
      guidance = "Low materiality - typical for small to medium entities";
      color = "text-green-600";
    } else if (value < 100000) {
      guidance = "Moderate materiality - typical for medium entities";
      color = "text-yellow-600";
    } else {
      guidance = "High materiality - typical for large entities";
      color = "text-orange-600";
    }
    return { guidance, color };
  };

  const materialityInfo = getMaterialityGuidance();

  return (
    <div className="space-y-6">
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="font-heading text-xl text-foreground flex items-center gap-2 text-gray-900">
            <Calculator className="h-5 w-5 text-primary text-blue-600" />
            Set Materiality Threshold
          </CardTitle>
          <p className="text-muted-foreground font-body text-gray-600">
            Define the materiality threshold for selecting accounts from the
            Extended Trial Balance. Only accounts with final balances equal to or
            greater than this amount will be automatically selected for audit
            procedures.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="materiality"
              className="font-body-semibold text-foreground text-gray-900"
            >
              Materiality Amount
            </Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground text-gray-500" />
              <Input
                id="materiality"
                type="number"
                value={materiality}
                onChange={(e) => setMateriality(e.target.value)}
                placeholder="Enter materiality amount"
                className="pl-10 font-body text-lg"
                min={0}
                step="0.01"
              />
            </div>
            {materiality && (
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-primary text-blue-600" />
                <span className="font-body-semibold text-foreground text-gray-900">
                  {formatCurrency(materiality)}
                </span>
                {materialityInfo && (
                  <span
                    className={`font-body ${materialityInfo.color}`}
                  >
                    • {materialityInfo.guidance}
                  </span>
                )}
              </div>
            )}
          </div>

          <Alert className="border-gray-200">
            <Info className="h-4 w-4" />
            <AlertDescription className="font-body text-gray-600">
              <strong>Materiality Guidelines:</strong> Materiality is typically
              set as a percentage of key financial statement items (e.g., 5% of
              net income, 0.5-1% of total assets, or 0.5-1% of revenue).
              Consider the entity&apos;s size, nature, and risk profile when
              setting materiality.
            </AlertDescription>
          </Alert>

          <div className="bg-muted/30 rounded-lg p-4 space-y-3 bg-gray-50">
            <h4 className="font-body-semibold text-foreground text-gray-900">
              What happens next?
            </h4>
            <ul className="space-y-2 text-sm font-body text-muted-foreground text-gray-600">
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0 bg-blue-600" />
                All ETB accounts with final balance ≥{" "}
                {formatCurrency(materiality) || "$X"} will be pre-selected
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0 bg-blue-600" />
                You can manually adjust selections in the next step
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0 bg-blue-600" />
                Selected accounts will be used for classification-based procedure
                generation
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-end justify-end">
        <Button
          onClick={handleProceed}
          disabled={!isValid}
          className="flex items-center gap-2"
        >
          Proceed to Classifications
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
