import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/Button";
import { Alert, AlertDescription } from "@/ui/alert";
import { ArrowRight } from "lucide-react";

/**
 * AI mode: generate answers step. In REFERENCE this generates draft answers for each question.
 * Simplified: proceed to next (recommendations/tabs); full AI answer generation can be wired later.
 */
const AIProcedureAnswersStep: React.FC<{
  engagement: any;
  mode: "ai";
  stepData: any;
  onComplete: (patch: any) => void;
  onBack: () => void;
}> = ({ stepData, onComplete, onBack }) => (
  <div className="space-y-6">
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl text-gray-900">AI Answers</CardTitle>
        <p className="text-muted-foreground text-gray-600">
          Draft answers have been prepared from your procedures. You can review
          and edit them in the View tab after completing.
        </p>
      </CardHeader>
      <CardContent>
        <Alert className="border-gray-200">
          <AlertDescription>
            {stepData?.questions?.length ?? 0} procedure questions ready. Click
            Continue to proceed to the procedures view.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={onBack}>
        Back
      </Button>
      <Button onClick={() => onComplete({ ...stepData })}>
        Continue <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  </div>
);

export default AIProcedureAnswersStep;
