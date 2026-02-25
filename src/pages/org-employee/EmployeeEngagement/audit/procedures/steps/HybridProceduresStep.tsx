import type React from "react";
import { ProcedureQuestionsStep } from "./ProcedureQuestionsStep";

/**
 * Hybrid mode: manual first, then AI. Reuses ProcedureQuestionsStep with mode="hybrid".
 */
export const HybridProceduresStep: React.FC<{
  engagement: any;
  mode: "hybrid";
  stepData: any;
  onComplete: (patch: any) => void;
  onBack: () => void;
}> = (props) => <ProcedureQuestionsStep {...props} mode="hybrid" />;
