import {
  ArrowRight,
  Check,
  LockSimple,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import {
  ArchetypeIcon,
  CareerIcon,
  CompassResultIcon,
  DriverIcon,
  EcosystemIcon,
  NextStepsIcon,
  PathForwardIcon,
  RealityIcon,
} from "@/components/brand/ResultIcons";

const coreSignals = [
  {
    letter: "C",
    label: "Curiosities",
    value: "Business and innovation",
    icon: CompassResultIcon,
  },
  {
    letter: "O",
    label: "Operations",
    value: "Creative builder",
    icon: ArchetypeIcon,
  },
  { letter: "R", label: "Rewards", value: "Visible impact", icon: DriverIcon },
  {
    letter: "E",
    label: "Ecosystems",
    value: "Dynamic teams",
    icon: EcosystemIcon,
  },
] as const;

const reportChapters = [
  { title: "How your strengths work together", icon: ArchetypeIcon },
  { title: "How you make decisions", icon: DriverIcon },
  { title: "Your strongest work environments", icon: EcosystemIcon },
  { title: "Top career matches", icon: CareerIcon },
  { title: "Careers that may drain you", icon: RealityIcon },
  { title: "Where to stretch next", icon: PathForwardIcon },
] as const;

const benefits = [
  { label: "How your strengths work together", icon: ArchetypeIcon },
  { label: "Career matches ranked by fit", icon: CareerIcon },
  { label: "Work and study settings that fit you", icon: EcosystemIcon },
  { label: "Advice based on your response pattern", icon: NextStepsIcon },
] as const;

export default function DeepDivePreviewPage() {
  return (
    <section className="anim-screen-enter mx-auto w-full max-w-[1140px] pb-8 pt-2">
      <div className="grid lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-stretch">
        <header className="relative isolate overflow-hidden rounded-[28px] border border-sand/12 bg-night shadow-[0_28px_90px_rgba(0,0,0,0.42)] lg:rounded-e-none lg:border-e-0">
          <div className="relative aspect-[4/5] w-full md:aspect-[16/10] lg:h-full lg:min-h-[610px] lg:aspect-auto">
            <Image
              src="/illustrations/report-map-reveal-v1.webp"
              alt="Kai reveals a glowing personal compass across an unfolding map."
              fill
              priority
              unoptimized
              sizes="(max-width: 767px) 100vw, (max-width: 1023px) 820px, 620px"
              className="object-cover object-[center_58%] md:object-[center_52%] lg:object-[center_50%]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-night/30 via-transparent to-night" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-5 sm:p-7">
              <span className="rounded-full border border-sand/15 bg-night/55 px-3 py-2 text-[10px] font-bold text-sand backdrop-blur-md">
                Your Tareeq report
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-mint">
                <Check size={12} weight="bold" aria-hidden="true" />
                Your profile is ready
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
              <p className="text-[11px] font-bold text-gold">
                Your compass points to
              </p>
              <h1 className="mt-2 max-w-[13ch] font-heading text-[38px] font-black leading-[1.02] text-sand sm:text-[54px]">
                The Creative Builder
              </h1>
            </div>
          </div>
        </header>

        <section className="relative z-10 -mt-1 overflow-hidden rounded-b-[28px] rounded-t-[10px] border border-carbon/8 bg-sand px-5 py-7 text-carbon shadow-[0_22px_60px_rgba(0,0,0,0.22)] sm:px-8 sm:py-9 lg:mt-0 lg:flex lg:flex-col lg:rounded-[28px] lg:rounded-s-none lg:border-s-0 lg:px-7">
          <p className="max-w-[64ch] text-[15px] leading-7 text-carbon/72 sm:text-[16px]">
            You keep coming back to the moment an idea becomes real. You like
            room to test it, shape it, and see whether it works.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-[18px] border border-carbon/10 bg-carbon/10 md:grid-cols-4 lg:grid-cols-2">
            {coreSignals.map((signal) => {
              const SignalIcon = signal.icon;
              return (
                <article key={signal.letter} className="min-w-0 bg-paper p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="grid size-9 place-items-center rounded-[12px] bg-carbon text-sand">
                      <SignalIcon size={20} />
                    </span>
                    <span className="font-heading text-[22px] font-black text-violet/30">
                      {signal.letter}
                    </span>
                  </div>
                  <p className="mt-3 text-[9px] font-bold text-carbon/45">
                    {signal.label}
                  </p>
                  <p className="mt-1 break-words text-[12px] font-bold leading-snug text-carbon">
                    {signal.value}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-8 grid gap-4 border-t border-carbon/10 pt-7 sm:grid-cols-[auto_minmax(0,1fr)] lg:mt-auto">
            <span className="grid size-12 place-items-center rounded-[16px] bg-violet text-sand shadow-[0_10px_24px_rgba(110,72,228,0.25)]">
              <PathForwardIcon size={25} />
            </span>
            <div>
              <p className="text-[10px] font-bold text-violet">
                Your strongest direction
              </p>
              <h2 className="mt-1 font-heading text-[24px] font-bold leading-tight text-carbon">
                Build ideas people can use
              </h2>
              <p className="mt-3 text-[13px] leading-6 text-carbon/65">
                Product, innovation, design, and entrepreneurial paths let you
                own the work and see what it changes.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(370px,0.72fr)] xl:items-start xl:gap-5">
        <section className="relative overflow-hidden rounded-[28px] border border-sand/10 bg-midnight px-5 py-7 sm:px-8 sm:py-9 xl:min-h-[650px]">
          <div
            className="absolute -right-16 top-8 size-48 rounded-full border border-violet-soft/10"
            aria-hidden="true"
          />
          <p className="text-[10px] font-bold text-gold">Inside your report</p>
          <h2 className="mt-2 font-heading text-[30px] font-bold leading-tight text-sand">
            Your complete report
          </h2>
          <p className="mt-2 max-w-[54ch] text-[13px] leading-6 text-sand/56">
            We&apos;ve already built these chapters from your answers.
          </p>

          <div
            className="relative mt-7"
            aria-label="Report chapters requiring payment"
          >
            <span
              className="absolute bottom-4 start-[19px] top-4 w-px bg-gradient-to-b from-gold via-violet-soft/50 to-transparent"
              aria-hidden="true"
            />
            <div className="grid gap-1">
              {reportChapters.map((chapter, index) => {
                const ChapterIcon = chapter.icon;
                return (
                  <article
                    key={chapter.title}
                    className="relative flex min-h-[76px] items-start gap-4 py-3"
                    style={{ opacity: Math.max(0.5, 1 - index * 0.09) }}
                  >
                    <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-[13px] border border-sand/12 bg-[#1c1437] shadow-[0_8px_20px_rgba(0,0,0,0.22)]">
                      <ChapterIcon size={21} />
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[13px] font-semibold leading-5 text-sand/78">
                          {chapter.title}
                        </h3>
                        <LockSimple
                          size={12}
                          weight="duotone"
                          className="shrink-0 text-violet-soft/75"
                          aria-hidden="true"
                        />
                      </div>
                      <span
                        className="mt-2 block h-1.5 w-[min(72%,22rem)] rounded-full bg-sand/[0.055]"
                        aria-hidden="true"
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-midnight/88 to-midnight" />
        </section>

        <section className="relative z-10 -mt-14 overflow-hidden rounded-[28px] border border-gold/22 bg-[#130d2b] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.48)] sm:p-8 xl:sticky xl:top-4 xl:mt-0 xl:p-7">
          <div
            className="absolute -right-20 -top-20 size-56 rounded-full border border-gold/10"
            aria-hidden="true"
          />
          <div
            className="absolute -right-10 -top-10 size-36 rounded-full border border-violet-soft/14"
            aria-hidden="true"
          />
          <div className="relative">
            <p className="text-[10px] font-bold text-gold">
              Tareeq Complete Report
            </p>
            <h2 className="mt-3 max-w-[21ch] font-heading text-[31px] font-black leading-[1.08] text-sand sm:text-[40px] xl:text-[34px]">
              Turn your result into choices you can act on.
            </h2>
            <p className="mt-4 max-w-[58ch] text-[13px] leading-6 text-sand/62">
              See why these paths fit you, where you may thrive, what could
              drain you, and what to try next.
            </p>
          </div>

          <div className="relative mt-7 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 xl:grid-cols-2">
            {benefits.map((benefit) => {
              const BenefitIcon = benefit.icon;
              return (
                <div key={benefit.label} className="min-w-0">
                  <span className="grid size-10 place-items-center rounded-[14px] border border-sand/10 bg-sand/[0.06]">
                    <BenefitIcon size={21} />
                  </span>
                  <p className="mt-2 text-[11px] font-semibold leading-5 text-sand/72">
                    {benefit.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="relative mt-8 border-t border-sand/10 pt-6 md:flex md:items-end md:justify-between md:gap-6 xl:block">
            <div>
              <p className="text-[10px] font-semibold text-sand/45">
                Complete report
              </p>
              <p className="mt-1 text-[27px] font-black text-sand">
                Price to confirm
              </p>
            </div>
            <button
              type="button"
              className="btn-v2 btn-v2--primary mt-4 w-full md:mt-0 md:w-auto xl:mt-4 xl:w-full"
              data-size="lg"
            >
              Unlock my full report
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </button>
          </div>
          <div className="relative mt-4 flex items-center gap-1.5 text-[10px] font-medium text-sand/44">
            <ShieldCheck size={13} aria-hidden="true" />
            One-time payment · No subscription · Secure checkout
          </div>
        </section>
      </div>
    </section>
  );
}
