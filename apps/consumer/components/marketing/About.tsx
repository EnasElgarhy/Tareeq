"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { BRAND } from "@/lib/brand";
import type { Locale } from "@/lib/i18n/locale";
import { ArchHorizon } from "./Illustrations";
import { DayPage, PageHero, Section } from "./PageShell";
import { FadeIn } from "./Shared";

interface AboutCopy {
  eyebrow: string;
  headline: string;
  line: string;
  blocks: readonly { title: string; body: string }[];
  contactTitle: string;
  contactLine: string;
}

/**
 * About (28 Oct update, Part B; Arabic section 4). The founder is not named
 * on the site for now, so the old founder and credentials blocks are gone.
 */
const ABOUT_COPY: Record<Locale, AboutCopy> = {
  en: {
    eyebrow: "About Map My CORE",
    headline: "Good career guidance shouldn’t be hard to find.",
    line: "Map My CORE helps young people in the Middle East and North Africa explore the study fields and careers worth looking into, starting from what already pulls their interest.",
    blocks: [
      {
        title: "Why we built it",
        body: "Choosing what to study is one of the first big decisions young people make, often at 14 or 15, with endless options and a lot of expectation around them. Most young people are good at several things, yet few have a clear way to see where those interests could lead. So we built CORE for this region from the start: questions drawn from everyday teenage life, written in Arabic and English, with room for what matters to families here.",
      },
      {
        title: "What we believe",
        body: "A direction, not a verdict. Choosing a path is something you work out over time, not a single decision made in one year of school. CORE keeps several doors open, and the choice always stays with the student.",
      },
      {
        title: "Building evidence for our region",
        body: "Most career research comes from the US and Europe. With consent, we follow up with students about a year later to learn what they chose and how it’s going. Over time, this builds a clearer picture of how young people in the Middle East and North Africa choose their paths, and keeps CORE improving.",
      },
      {
        title: "Who we are",
        body: "Map My CORE is built by The ME Project (FZE), based at Sharjah Research Technology and Innovation Park in the UAE.",
      },
    ],
    contactTitle: "Get in touch",
    contactLine: "We read every message:",
  },
  ar: {
    eyebrow: "عن ماب ماي كور",
    headline: "التوجيه المهني الجيد لا ينبغي أن يكون صعب المنال.",
    line: "يساعد ماب ماي كور الشباب في الشرق الأوسط وشمال أفريقيا على استكشاف مجالات الدراسة والمهن التي تستحق الاهتمام، انطلاقًا مما يثير فضولهم أصلًا.",
    blocks: [
      {
        title: "لماذا أنشأناه",
        body: "اختيار ما يُدرس من أوائل القرارات الكبيرة في حياة الشباب، وغالبًا ما يأتي في سن 14 أو 15، وسط خيارات لا تنتهي وتوقّعات كثيرة من حولهم. ومعظم الشباب يُجيدون أشياء كثيرة، لكن قلّة منهم يملكون طريقة واضحة لرؤية إلى أين قد تقودهم هذه الاهتمامات. لذلك بنينا تقييم كور لهذه المنطقة منذ البداية: أسئلة مستمدة من الحياة اليومية للمراهقين، مكتوبة بالعربية والإنجليزية، مع مساحة لما يهمّ العائلات هنا.",
      },
      {
        title: "ما نؤمن به",
        body: "توجّه، لا حكم نهائي. اختيار المسار أمر يتّضح مع الوقت، لا قرار واحد يُتّخذ في عام دراسي واحد. ويُبقي تقييم كور عدة أبواب مفتوحة، ويبقى الاختيار دائمًا للطالب.",
      },
      {
        title: "نبني المعرفة لمنطقتنا",
        body: "معظم الأبحاث المهنية تأتي من الولايات المتحدة وأوروبا. وبموافقة الطلاب، نتابع معهم بعد نحو عام لنعرف ما اختاروه وكيف تسير أمورهم. ومع الوقت، يرسم ذلك صورة أوضح عن كيفية اختيار الشباب في الشرق الأوسط وشمال أفريقيا لمساراتهم، ويُبقي تقييم كور في تطوّر مستمر.",
      },
      {
        title: "من نحن",
        body: "ماب ماي كور من تطوير شركة The ME Project (FZE)، ومقرّها مجمّع الشارقة للبحوث والتكنولوجيا والابتكار في الإمارات العربية المتحدة.",
      },
    ],
    contactTitle: "تواصلوا معنا",
    contactLine: "نقرأ كل رسالة:",
  },
};

export const About = () => {
  const { locale } = useLocale();
  const copy = ABOUT_COPY[locale];

  return (
    <DayPage>
      <main>
        <PageHero
          eyebrow={copy.eyebrow}
          title={copy.headline}
          lede={copy.line}
          art={ArchHorizon}
          artClass="w-48 h-auto"
        />
        <Section className="!pt-4">
          <div className="grid max-w-5xl gap-12 md:grid-cols-2 md:gap-x-14">
            {copy.blocks.map((block, i) => (
              <FadeIn key={block.title} delay={(i % 2) * 0.08}>
                <h2 className="font-heading text-2xl font-semibold">{block.title}</h2>
                <p className="mt-3 leading-relaxed text-[var(--day-ink-2)]">{block.body}</p>
              </FadeIn>
            ))}
          </div>
        </Section>
        <Section className="border-t border-[var(--day-line)]">
          <h2 className="font-heading text-2xl font-semibold">{copy.contactTitle}</h2>
          <p className="mt-3 text-[var(--day-ink-2)]">{copy.contactLine}</p>
          <a
            href={`mailto:${BRAND.supportEmail}`}
            dir="ltr"
            className="mt-2 inline-block font-heading text-xl font-semibold text-[#6D5BA8] underline-offset-4 hover:underline"
          >
            {BRAND.supportEmail}
          </a>
        </Section>
      </main>
    </DayPage>
  );
};
