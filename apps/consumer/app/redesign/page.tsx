import type { Metadata } from "next";
import { Close } from "@/components/marketing/khatt/Close";
import { Core } from "@/components/marketing/khatt/Core";
import { Dawn } from "@/components/marketing/khatt/Dawn";
import { Hero } from "@/components/marketing/khatt/Hero";
import { Outcomes } from "@/components/marketing/khatt/Outcomes";
import { Problem } from "@/components/marketing/khatt/Problem";
import { Stats } from "@/components/marketing/khatt/Stats";
import "@/components/marketing/khatt/khatt.css";

export const metadata: Metadata = {
  title: "Khatt redesign preview",
  robots: { index: false, follow: false },
};

export default function KhattPreviewPage() {
  return (
    <div data-khatt className="page">
      <main>
        <Hero />
        <Stats />
        <Dawn />
        <Problem />
        <Core />
        <Outcomes />
        <Dawn direction="dusk" />
        <Close />
      </main>
    </div>
  );
}
