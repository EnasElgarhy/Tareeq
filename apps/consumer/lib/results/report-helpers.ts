import type { Locale } from "@/lib/i18n/locale";

/**
 * Small presentation helpers shared between ResultsScreen (the full,
 * dark-themed report) and the Compass tab's lighter summary of the same
 * report data — moved here so both read from one source instead of the
 * subject-reasoning heuristic drifting between two copies.
 */

export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

/**
 * `subject` may already be an Arabic string (report content is
 * generated once, in the report's locale) — the keyword patterns below
 * carry both English and Arabic alternates so matching works either way.
 */
export function getSubjectReason(
  subject: string,
  clusterName: string,
  locale: Locale = "en",
): string {
  const normalized = subject.toLowerCase();

  if (
    /(computer|it|coding|technology|data|statistics|حاسوب|تقنية|برمجة|بيانات|إحصاء|معلومات)/.test(
      normalized,
    )
  ) {
    return locale === "ar"
      ? `يمنحك هذا أدوات عملية لاختبار أفكار ${clusterName}، وبناء مشاريع صغيرة، وفهم الأنظمة الرقمية وراء كثير من المهن الحديثة.`
      : `This gives you practical tools to test ${clusterName} ideas, build small projects, and understand the digital systems behind many modern careers.`;
  }

  if (/(math|mathematics|further maths|رياضيات)/.test(normalized)) {
    return locale === "ar"
      ? `يبني هذا طلاقة كمية تعتمد عليها كثير من مسارات ${clusterName}، خصوصًا عندما تتضمن الخيارات لاحقًا البيانات أو النمذجة أو التمويل أو الهندسة أو البحث.`
      : `This builds the quantitative fluency many ${clusterName} routes depend on, especially when choices later involve data, modelling, finance, engineering, or research.`;
  }

  if (
    /(physics|chemistry|biology|environmental|geography|science|فيزياء|كيمياء|أحياء|بيئة|جغرافيا|علوم)/.test(
      normalized,
    )
  ) {
    return locale === "ar"
      ? `يبقي هذا الجانب القائم على الأدلة في ${clusterName} مفتوحًا، خصوصًا للمهن التي تحتاج تجارب، أو عملًا ميدانيًا، أو تفكيرًا منظوميًا، أو مصداقية تقنية.`
      : `This keeps the evidence-based side of ${clusterName} open, especially for careers that need experiments, fieldwork, systems thinking, or technical credibility.`;
  }

  if (
    /(english|literature|history|government|politics|language|philosophy|لغة|أدب|تاريخ|حكومة|سياسة|فلسفة)/.test(
      normalized,
    )
  ) {
    return locale === "ar"
      ? `يعزز هذا مهارات التواصل والحجاج والتفسير، وهي مهارات تساعدك على شرح أفكار ${clusterName} بوضوح لأشخاص لا يفكرون مثلك.`
      : `This strengthens communication, argument, and interpretation: skills that help you explain ${clusterName} ideas clearly to people who do not think like you.`;
  }

  if (
    /(art|design|media|film|drama|music|visual|فن|تصميم|إعلام|سينما|دراما|موسيقى|بصري)/.test(
      normalized,
    )
  ) {
    return locale === "ar"
      ? `يساعدك هذا على بناء معرض أعمال والتعبير عن الأفكار بصريًا، مما يحوّل فضول ${clusterName} إلى عمل يمكن للناس رؤيته والتفاعل معه فعليًا.`
      : `This helps you build a portfolio and communicate ideas visually, which can turn ${clusterName} curiosity into work people can actually see and respond to.`;
  }

  if (/(business|economics|accounting|أعمال|اقتصاد|محاسبة)/.test(normalized)) {
    return locale === "ar"
      ? `يساعدك هذا على فهم المال والأسواق والمؤسسات، بحيث تتحول اهتمامات ${clusterName} إلى فرص عملية لا مجرد أفكار.`
      : `This helps you understand money, markets, and organisations, so ${clusterName} interests can become practical opportunities rather than only ideas.`;
  }

  return locale === "ar"
    ? `يمكن لهذه المادة أن تدعم ${clusterName} من خلال منحك المفردات والممارسة والدليل على أنك جاد بما يكفي لاختبار هذا المسار بشكل صحيح.`
    : `This subject can support ${clusterName} by giving you vocabulary, practice, and proof that you are serious enough to test the path properly.`;
}
