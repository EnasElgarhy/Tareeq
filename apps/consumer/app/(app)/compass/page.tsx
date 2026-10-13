import { Suspense } from "react";
import { CompassScreen } from "@/components/home/CompassScreen";

export default function CompassPage() {
  // CompassScreen reads the URL (report section, preview), which needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <CompassScreen />
    </Suspense>
  );
}
