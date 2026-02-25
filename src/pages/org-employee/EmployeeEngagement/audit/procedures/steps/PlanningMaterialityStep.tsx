import type React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Alert, AlertDescription } from "@/ui/alert";
import { Calculator, TrendingUp, ArrowRight, Info, Euro } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlanningMaterialityStepProps {
  engagement: any;
  mode: string;
  stepData: any;
  onComplete: (data: { materiality?: number }) => void;
  onBack: () => void;
}

export const PlanningMaterialityStep: React.FC<PlanningMaterialityStepProps> = ({
  stepData,
  onComplete,
  onBack,
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
        description: "Please enter a valid materiality amount greater than 0.",
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Set Planning Materiality
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Define the materiality threshold for planning procedures. This will be used to assess the significance of risks and procedures.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="materiality">Materiality Amount</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="materiality"
                type="number"
                value={materiality}
                onChange={(e) => setMateriality(e.target.value)}
                placeholder="Enter materiality amount"
                className="pl-10 text-lg"
                min={0}
                step={0.01}
              />
            </div>
            {materiality && (
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-medium">{formatCurrency(materiality)}</span>
              </div>
            )}
          </div>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Planning Materiality:</strong> This threshold will be used throughout the planning phase to assess the significance of risks, account balances, and audit procedures.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleProceed} disabled={!isValid}>
          Proceed to Sections
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
