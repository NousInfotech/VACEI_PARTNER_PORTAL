import type React from "react";
import { ProcedureQuestionsStep } from "./ProcedureQuestionsStep";

/**
 * AI mode: generate questions step. Reuses ProcedureQuestionsStep with mode="ai".
 */
const AIProcedureQuestionsStep: React.FC<{
  engagement: any;
  mode: "ai";
  stepData: any;
  onComplete: (patch: any) => void;
  onBack: () => void;
}> = (props) => <ProcedureQuestionsStep {...props} mode="ai" />;

export default AIProcedureQuestionsStep;
