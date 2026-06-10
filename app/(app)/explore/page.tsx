"use client";

import { Compass } from "lucide-react";
import { TabPlaceholder } from "@/components/home/TabPlaceholder";

/** Explore tab — the depth layer (placeholder until built). */
export default function ExplorePage() {
  return (
    <TabPlaceholder
      icon={Compass}
      eyebrow="Explore"
      title="Go deep on your directions"
      description="The full map: career families, university majors, the 8 curiosity clusters, day-in-the-life videos, and the surprising intersections your profile points toward."
      preview={["Career families", "Majors", "Day in the life", "Intersections"]}
    />
  );
}
