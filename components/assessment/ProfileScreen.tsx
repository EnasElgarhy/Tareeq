"use client";

import {
  ChevronRight,
  Headphones,
  Lock,
  Mail,
  Sparkles,
  TrendingUp,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { Kai } from "@/components/brand/Kai";
import {
  ArchetypeIcon,
  CompassResultIcon,
  DriverIcon,
  EcosystemIcon,
} from "@/components/brand/ResultIcons";
import { readProfileSnapshot, type ProfileSnapshot } from "@/lib/profile/journey";

const MODULE_ICONS: Record<string, ReactNode> = {
  compass: <CompassResultIcon size={22} />,
  interview: <Headphones size={20} />,
  skills: <Wrench size={20} />,
  pulse: <TrendingUp size={20} />,
};

export function ProfileScreen() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);

  useEffect(() => {
    const next = readProfileSnapshot();
    // Soft gate — if there's no registration the user shouldn't be
    // here yet. Send them to /start so they can either resume or begin.
    if (!next.registration) {
      router.replace("/start");
      return;
    }
    setSnapshot(next);
  }, [router]);

  if (!snapshot || !snapshot.registration) return null;

  const initials = getInitials(snapshot.registration.name);
  const coreModule = snapshot.modules.find((m) => m.id === "core-compass");
  const coreCompleted = coreModule?.status === "completed";

  return (
    <section className="anim-screen-enter flex flex-1 flex-col gap-4 pb-2">
      {/* ─── Header: avatar + name + email ─── */}
      <header className="relative overflow-hidden rounded-[28px] border border-sand/12 bg-gradient-to-br from-violet/12 via-sand/[0.04] to-warm/[0.06] p-4 shadow-[0_22px_60px_rgba(0,0,0,0.28)]">
        {/* Top-right warm bloom */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,107,61,0.25), transparent 70%)",
            filter: "blur(20px)",
          }}
        />
        <div className="relative flex items-center gap-3">
          {/* Avatar — Kai face on a glass tile with the user's initials
              floating as a soft caption underneath. */}
          <div className="relative">
            <div className="grid size-16 place-items-center overflow-hidden rounded-2xl bg-night/70 ring-1 ring-sand/16 shadow-[0_10px_24px_rgba(0,0,0,0.4)]">
              <Kai mood="warm" size={62} />
            </div>
            <span
              aria-hidden
              className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-grad-warm text-[10px] font-black text-sand shadow-warm-glow"
            >
              {initials}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sand/52">
              Your profile
            </p>
            <h1 className="mt-0.5 truncate text-[22px] font-black leading-tight text-sand">
              {snapshot.registration.name}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-sand/55">
              <Mail size={11} />
              {snapshot.registration.email}
            </p>
          </div>
        </div>

        {/* Profile-completion meter — grows as more assessments land */}
        <div className="relative mt-4 grid gap-1.5">
          <div className="flex items-center justify-between text-[10.5px] font-bold uppercase tracking-[0.13em]">
            <span className="text-sand/52">Profile complete</span>
            <span className="tabular-nums text-grad-warm">
              {snapshot.completedCount}/{snapshot.totalCount}
              <span className="ms-1 text-sand/40">
                · {snapshot.completionPct}%
              </span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-night/55">
            <div
              className="h-full rounded-full bg-grad-warm transition-[width] duration-500"
              style={{ width: `${Math.max(6, snapshot.completionPct)}%` }}
            />
          </div>
        </div>
      </header>

      {/* ─── Empty state if they have NO completed assessment ─── */}
      {!snapshot.hasAnyResult ? (
        <EmptyJourney />
      ) : (
        <>
          {/* ─── AI Career Profile snapshot — only when CORE is done ─── */}
          {snapshot.coreReport ? (
            <CareerProfileSnapshot report={snapshot.coreReport} />
          ) : null}
        </>
      )}

      {/* ─── Module list — completed + locked, in order ─── */}
      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sand/45">
              Your journey
            </p>
            <h2 className="mt-1 text-[18px] font-black text-sand">
              Assessments &amp; modules
            </h2>
          </div>
          <span className="rounded-full border border-sand/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sand/55">
            {snapshot.completedCount === 0
              ? "Just starting"
              : `${snapshot.completedCount} unlocked`}
          </span>
        </div>

        <ol className="grid gap-2">
          {snapshot.modules.map((mod) => (
            <ModuleRow
              key={mod.id}
              icon={MODULE_ICONS[mod.icon] ?? <Sparkles size={20} />}
              name={mod.name}
              tagline={mod.tagline}
              description={mod.description}
              duration={mod.durationLabel}
              status={mod.status}
              route={mod.route}
              completedAt={mod.completedAt}
            />
          ))}
        </ol>
      </section>

      {/* ─── Quick links ─── */}
      <section className="grid grid-cols-2 gap-2">
        {coreCompleted ? (
          <Link
            href="/results"
            className="btn-v2 btn-v2--ghost-on-dark w-full"
            data-size="md"
          >
            View full report
          </Link>
        ) : (
          <Link
            href="/start"
            className="btn-v2 btn-v2--primary w-full"
            data-size="md"
          >
            Begin CORE
          </Link>
        )}
        <Link
          href="/start"
          className="btn-v2 btn-v2--ghost-on-dark w-full"
          data-size="md"
        >
          {coreCompleted ? "Retake" : "Resume"}
        </Link>
      </section>

      <p className="text-center text-[11px] leading-snug text-sand/40">
        More assessments unlock as Tareeq grows. Your profile grows with you.
      </p>
    </section>
  );
}

/* ============================================================
 * Sub-components
 * ============================================================ */

function CareerProfileSnapshot({
  report,
}: {
  report: NonNullable<ProfileSnapshot["coreReport"]>;
}) {
  return (
    <section className="rounded-[24px] border border-sand/10 bg-sand/[0.055] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold">
            AI career profile
          </p>
          <h2 className="mt-1 text-[18px] font-black text-sand">
            Your{" "}
            <span
              className="text-grad-warm"
              style={{
                fontStyle: "italic",
                fontVariationSettings: '"SOFT" 100, "opsz" 144',
              }}
            >
              compass
            </span>{" "}
            so far
          </h2>
        </div>
        <span className="rounded-full border border-sand/10 px-3 py-1 text-[10.5px] font-bold text-sand/62">
          {report.score.confidencePercentage}%
        </span>
      </div>

      <div className="mt-3 rounded-[18px] border border-sand/8 bg-night/30 p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sand/40">
          Primary direction
        </p>
        <p className="mt-1 text-[24px] font-black leading-none text-sand">
          {report.clusterName}
        </p>
        <p className="mt-1.5 text-[12.5px] leading-snug text-sand/62">
          {report.headline}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <SnapshotTile
          icon={<ArchetypeIcon size={18} />}
          label="Style"
          value={report.archetype}
          accent="violet"
        />
        <SnapshotTile
          icon={<DriverIcon size={18} />}
          label="Drive"
          value={report.primaryDriver}
          accent="warm"
        />
        <SnapshotTile
          icon={<EcosystemIcon size={18} />}
          label="Thrives in"
          value={report.ecosystemFit}
          accent="mint"
        />
      </div>
    </section>
  );
}

function SnapshotTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent: "warm" | "violet" | "mint";
}) {
  const tileBg = {
    warm: "linear-gradient(135deg, rgba(255,107,61,0.20), rgba(255,165,61,0.08))",
    violet:
      "linear-gradient(135deg, rgba(157,127,240,0.20), rgba(110,72,228,0.08))",
    mint: "linear-gradient(135deg, rgba(111,224,192,0.20), rgba(111,224,192,0.05))",
  }[accent];

  return (
    <div className="grid gap-1.5 rounded-[16px] border border-sand/8 bg-night/30 p-2.5">
      <span
        className="grid size-8 place-items-center rounded-xl"
        style={{ background: tileBg }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-sand/42">
          {label}
        </p>
        <p className="mt-0.5 truncate text-[11.5px] font-black leading-tight text-sand">
          {value}
        </p>
      </div>
    </div>
  );
}

function ModuleRow({
  icon,
  name,
  tagline,
  description: _description,
  duration,
  status,
  route,
  completedAt,
}: {
  icon: ReactNode;
  name: string;
  tagline: string;
  description: string;
  duration: string;
  status: "available" | "completed" | "locked";
  route?: string;
  completedAt: string | null;
}) {
  const isLocked = status === "locked";
  const isCompleted = status === "completed";

  const tileClasses = [
    "relative grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-[20px] border px-3 py-3 transition-colors",
    isCompleted
      ? "border-mint/24 bg-mint/[0.06]"
      : isLocked
        ? "border-sand/8 bg-sand/[0.02] opacity-70"
        : "border-sand/14 bg-sand/[0.06] hover:bg-sand/[0.09]",
  ].join(" ");

  const body = (
    <>
      <span
        className={`grid size-11 place-items-center rounded-2xl ${
          isCompleted
            ? "bg-mint/15 text-mint"
            : isLocked
              ? "bg-sand/[0.04] text-sand/35"
              : "bg-grad-warm/15 text-sand"
        }`}
        style={
          isCompleted
            ? undefined
            : !isLocked
              ? {
                  background:
                    "linear-gradient(135deg, rgba(255,107,61,0.18), rgba(255,165,61,0.08))",
                  boxShadow: "inset 0 0 0 1px rgba(255,107,61,0.32)",
                }
              : undefined
        }
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={`truncate text-[13.5px] font-black leading-tight ${
              isLocked ? "text-sand/50" : "text-sand"
            }`}
          >
            {name}
          </p>
          {isCompleted ? (
            <span className="inline-flex items-center rounded-full border border-mint/40 bg-mint/12 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.12em] text-mint">
              Done
            </span>
          ) : isLocked ? (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-sand/12 bg-sand/[0.04] px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.12em] text-sand/45">
              <Lock size={9} /> Soon
            </span>
          ) : null}
        </div>
        <p
          className={`mt-0.5 truncate text-[11.5px] leading-snug ${
            isLocked ? "text-sand/40" : "text-sand/60"
          }`}
        >
          {tagline}
        </p>
        <p className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-sand/35">
          <span>{duration}</span>
          {isCompleted && completedAt ? (
            <>
              <span>·</span>
              <span>Completed {formatDate(completedAt)}</span>
            </>
          ) : null}
        </p>
      </div>
      {!isLocked ? (
        <ChevronRight
          size={18}
          className={isCompleted ? "text-mint/70" : "text-sand/50"}
        />
      ) : (
        <span className="size-[18px]" aria-hidden />
      )}
    </>
  );

  if (isLocked || !route) {
    return <li className={tileClasses}>{body}</li>;
  }

  return (
    <li>
      <Link href={route} className={tileClasses}>
        {body}
      </Link>
    </li>
  );
}

function EmptyJourney() {
  return (
    <section className="rounded-[24px] border border-sand/10 bg-sand/[0.04] p-4 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold">
        Just getting started
      </p>
      <h2 className="mt-2 text-[18px] font-black leading-tight text-sand">
        Your profile is{" "}
        <span
          className="text-grad-warm"
          style={{
            fontStyle: "italic",
            fontVariationSettings: '"SOFT" 100, "opsz" 144',
          }}
        >
          waiting
        </span>{" "}
        for its first signal.
      </h2>
      <p className="mx-auto mt-2 max-w-[32ch] text-[12.5px] leading-snug text-sand/62">
        Finish your CORE Compass to unlock your AI career profile. Each
        assessment after that adds another layer.
      </p>
    </section>
  );
}

/* ============================================================
 * Helpers
 * ============================================================ */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() ?? "?";
  return (
    (parts[0]?.charAt(0) ?? "") + (parts[parts.length - 1]?.charAt(0) ?? "")
  ).toUpperCase();
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}
