import { AnalyzingScreen } from "@/components/assessment/AnalyzingScreen";

/**
 * Internal preview route for the "analyzing your answers" screen.
 * Visit /analyzing-preview to review the loader (it holds open and loops
 * instead of redirecting to /results). Not linked in the live flow.
 */
export default function AnalyzingPreviewPage() {
  return <AnalyzingScreen preview />;
}
