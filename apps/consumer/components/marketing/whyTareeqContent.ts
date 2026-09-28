import {
  ChartLineUp,
  ChatsCircle,
  Flask,
  HandHeart,
  Lightning,
  Notebook,
  Plant,
  Signpost,
  Wallet,
  type Icon,
} from "@phosphor-icons/react";
import type { StringKey } from "@/lib/i18n/strings";

export type Audience = "learners" | "parents";

export interface WhyPoint {
  title: StringKey;
  body: StringKey;
  /** `null` renders Kai's avatar instead of an icon. */
  icon: Icon | null;
}

export const AUDIENCES: readonly Audience[] = ["learners", "parents"];

export const TAB_LABELS: Record<Audience, StringKey> = {
  learners: "marketing.why.tab_learners",
  parents: "marketing.why.tab_parents",
};

export const HEADLINES: Record<Audience, StringKey> = {
  learners: "marketing.why.learners.headline",
  parents: "marketing.why.parents.headline",
};

export const POINTS: Record<Audience, readonly WhyPoint[]> = {
  learners: [
    { title: "marketing.why.learners.1_title", body: "marketing.why.learners.1_body", icon: ChatsCircle },
    { title: "marketing.why.learners.2_title", body: "marketing.why.learners.2_body", icon: Signpost },
    { title: "marketing.why.learners.3_title", body: "marketing.why.learners.3_body", icon: Notebook },
    { title: "marketing.why.learners.4_title", body: "marketing.why.learners.4_body", icon: Lightning },
    { title: "marketing.why.learners.5_title", body: "marketing.why.learners.5_body", icon: Plant },
  ],
  parents: [
    { title: "marketing.why.parents.1_title", body: "marketing.why.parents.1_body", icon: null },
    { title: "marketing.why.parents.2_title", body: "marketing.why.parents.2_body", icon: HandHeart },
    { title: "marketing.why.parents.3_title", body: "marketing.why.parents.3_body", icon: Flask },
    { title: "marketing.why.parents.4_title", body: "marketing.why.parents.4_body", icon: ChartLineUp },
    { title: "marketing.why.parents.5_title", body: "marketing.why.parents.5_body", icon: Wallet },
  ],
};
