import {
  Coins,
  Compass,
  Cpu,
  HandHeart,
  House,
  HouseLine,
  ListChecks,
  MagnifyingGlass,
  Medal,
  Megaphone,
  Mountains,
  PaintBrushBroad,
  Path,
  ShieldCheck,
  Shuffle,
  Stack,
  Stairs,
  SunHorizon,
  Target,
  TreeStructure,
  User,
  UsersFour,
  UsersThree,
  Wrench,
  type Icon,
} from "@phosphor-icons/react";
import type { AxisCode, CuriosityCode, MotivatorCode } from "@/lib/core-v2/types";

/** The CORE icon map from the report canvas (Phosphor, one icon per code). */
export const CURIOSITY_ICON: Record<CuriosityCode, Icon> = {
  RD: MagnifyingGlass,
  IE: PaintBrushBroad,
  PW: UsersThree,
  EI: Megaphone,
  PE: ListChecks,
  TS: Cpu,
  IR: Wrench,
  AE: Mountains,
};

export const MOTIVATOR_ICON: Record<MotivatorCode, Icon> = {
  REC: Medal,
  IMP: HandHeart,
  MAS: Target,
  AUT: Compass,
  SEC: ShieldCheck,
  INC: Coins,
  FAM: HouseLine,
  LIF: SunHorizon,
};

/** Side A and side B of each axis. "A mix of both" has no icon. */
export const AXIS_SIDE_ICON: Record<AxisCode, readonly [Icon, Icon]> = {
  structure: [Stairs, Path],
  focus: [Stack, TreeStructure],
  team: [UsersFour, User],
  setting: [House, Shuffle],
};
