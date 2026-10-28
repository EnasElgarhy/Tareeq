import type { Locale } from "@/lib/i18n/locale";

/**
 * FAQ page (28 Oct update, Part B; Arabic section 3). Plain data so the page
 * and the FAQPage structured data (app/(marketing)/faq/page.tsx) read the same
 * questions.
 */

export interface FaqEntry {
  q: string;
  a: string;
  link?: { href: string; label: string };
}

export interface FaqGroup {
  title: string;
  items: readonly FaqEntry[];
}

export interface FaqCopy {
  title: string;
  groups: readonly FaqGroup[];
  closing: string;
}

const SCIENCE = "/research";
const PRIVACY = "/privacy-policy";

export const FAQ_COPY: Record<Locale, FaqCopy> = {
  en: {
    title: "Good questions. Honest answers.",
    closing: "Still have a question? Write to us at",
    groups: [
      {
        title: "Getting started",
        items: [
          {
            q: "Who is CORE for?",
            a: "Students aged 13 to 21, from secondary school to early university, who want to explore which study fields and careers are worth looking into. It’s especially useful for students with several interests and no single clear direction. Students under 13 can’t take CORE.",
          },
          {
            q: "How long does it take?",
            a: "About 15 minutes: 46 short questions about everyday situations, then four quick background questions. There’s no time limit. Take your time, because answering too fast makes the results less useful.",
          },
          {
            q: "How much does it cost?",
            a: "Answering the questions is free. To unlock the full report, there’s a one-time payment of 360 AED (limited time offer; regular price 450 AED). This includes the full report, a section for parents, and three months with Kai, the AI coach.",
          },
          {
            q: "Do I need an account?",
            a: "Not to start. You answer the questions first, then create an account at the end to save your results and unlock your report.",
          },
          {
            q: "Can my child take it in Arabic?",
            a: "Yes. Students choose Arabic or English at the start. Every question, report and conversation with Kai is available in both, and the Arabic was written for Arabic speakers, not translated word for word.",
          },
          {
            q: "My child started on their own. How do I pay?",
            a: "When your child finishes, they can tap “Ask a parent to unlock it” and send you a link, usually on WhatsApp. Open it on your phone, see what’s included, and pay. The report unlocks for your child straight away. The link works for 7 days, and your child can send a new one at any time.",
          },
        ],
      },
      {
        title: "Your report",
        items: [
          {
            q: "What will the report show?",
            a: "Seven short sections, in plain words: what pulls your interest, how you like to work, what motivates you and the work setting you prefer, then the job families and study fields worth exploring, with the routes within them closest to your answers. It ends with practical next steps and a section written for parents.",
          },
          {
            q: "Will it tell me which career to choose?",
            a: "No, and that’s on purpose. CORE shows several directions worth exploring, not one job title. The choice is always yours, and Kai can help you think it through.",
          },
          {
            q: "What if I don’t agree with my results?",
            a: "You know yourself best. The report describes your answers today, not who you are forever. If something doesn’t feel right, tell Kai. Kai will take your view seriously and work from your version.",
          },
          {
            q: "How do I use it to choose university subjects?",
            a: "Each job family in your report lists the study fields that lead there. Your next steps include questions to ask your school or a university. Entry requirements differ by country and university, so confirm them with your school counsellor and the university’s official website.",
          },
          {
            q: "How long can I talk to Kai?",
            a: "For three months from the day you take CORE. Kai has read your report, so every conversation starts from your results, whenever you need it.",
          },
          {
            q: "Can I take CORE again?",
            a: "Yes. Interests grow and change, so taking CORE again a year later shows how yours have developed. We’ll send a reminder when it’s time.",
          },
          {
            q: "Are the careers up to date?",
            a: "Yes. The career list was checked in 2026 against the World Economic Forum’s Future of Jobs Report 2025 and the International Labour Organization’s 2025 study of jobs affected by AI, and it’s reviewed every year. Roles that are changing carry a short note in your report.",
            link: { href: SCIENCE, label: "Read more on The science page →" },
          },
        ],
      },
      {
        title: "Trust and privacy",
        items: [
          {
            q: "Is CORE a test?",
            a: "No. CORE is an exploration and coaching tool, not a psychometric test. It doesn’t measure ability, intelligence or personality, there’s no pass or fail, and it doesn’t compare you with other students. It describes your answers today, to help you explore.",
          },
          {
            q: "What is CORE built on?",
            a: "Decades of career research: John Holland’s work on career interests, research on how jobs are designed, research on what people want from work, and research on work settings. The careers and what they involve come from O*NET, a public database of occupations. CORE was written in Arabic and English for families in this region, and with consent, we follow up with students later to keep improving it.",
            link: { href: SCIENCE, label: "Read more on The science page →" },
          },
          {
            q: "Who can see my results and my conversations with Kai?",
            a: "You can. For students aged 13 to 17, the parent who unlocks the report can also see it and read conversations with Kai. Students are told this before they start. If you share a summary card, you choose what’s on it, and it never shows your age, your school or a link to your report.",
          },
          {
            q: "Is my information safe?",
            a: "Yes. Personal details are kept separate from your answers and protected. We never sell your information. If you don’t create an account at the end, your answers are deleted. Taking part in research is optional and needs consent.",
            link: { href: PRIVACY, label: "Read our privacy policy →" },
          },
          {
            q: "Who is behind Map My CORE?",
            a: "Map My CORE is built by The ME Project (FZE), a company based at Sharjah Research Technology and Innovation Park in the UAE, focused on career and study exploration for young people in the Middle East and North Africa.",
          },
        ],
      },
      {
        title: "Choosing a path",
        items: [
          {
            q: "How can my teenager decide what to study at university?",
            a: "Start broad, then narrow. Decision research suggests three steps: look at a wide range of options, explore a few in depth, then choose (Gati & Asher, 2001). Begin with what they’re drawn to, not only their grades, and check entry requirements with their school and universities. CORE helps with the first step: it shows the job families and linked study fields worth exploring, based on what pulls their interest.",
          },
          {
            q: "My child is good at many subjects. How do they choose a direction?",
            a: "Being good at many things is a strength, not a problem. It often helps to look at why they enjoy each thing: four students in the same robotics club can be there for four different reasons, and those reasons point to different futures. CORE looks at exactly that, and shows whether their interests connect into one direction or cover a wide range, with paths to explore either way.",
          },
          {
            q: "Is it normal not to know what you want to do yet?",
            a: "Yes. Career researchers describe roughly ages 15 to 24 as a stage for exploring, not committing (Super). A 2020 survey of university students in the region found only 56% had a clear plan for after graduation. Not knowing yet is a reason to explore, not to worry.",
          },
          {
            q: "When should students start thinking about careers?",
            a: "Early secondary school is a good time to start exploring, before subject choices begin to narrow the options. Young people often rule out paths early, based on what seems expected of them (Gottfredson, 1981). In an OECD study of 15-year-olds in 41 countries, 47% of boys and 53% of girls expected to work in one of just ten jobs. Exploring early keeps more doors open.",
          },
          {
            q: "How is AI changing the careers students should consider?",
            a: "Skills are changing more than job titles. The World Economic Forum expects 39% of workers’ core skills to change by 2030. Analytical thinking remains the most valued skill, and AI and big data, creative thinking, resilience, and curiosity and lifelong learning are rising fastest. That’s a reason to choose a direction you’re curious about and keep learning, not to look for a “safe” job. CORE’s career list is checked against these trends, and changing roles are marked.",
          },
          {
            q: "How can parents help without adding pressure?",
            a: "In the UAE, research has found that parents are the strongest influence on students’ career choices (Mohebi & David, 2024). That influence helps most when it opens doors: ask what feels right to them before suggesting what to choose, explore options together, and talk openly if your hopes differ. CORE’s report includes a section for parents, and Kai can help your child prepare for that conversation.",
          },
        ],
      },
    ],
  },
  ar: {
    title: "أسئلة جيدة، وإجابات صريحة.",
    closing: "هل لديكم سؤال آخر؟ راسلونا على:",
    groups: [
      {
        title: "البداية",
        items: [
          {
            q: "لمن تقييم كور؟",
            a: "للطلاب من سن 13 إلى 21، من المرحلة الثانوية حتى السنوات الأولى في الجامعة، ممن يرغبون في استكشاف مجالات الدراسة والمهن التي تستحق الاهتمام. ويفيد بشكل خاص الطلاب ذوي الاهتمامات المتعددة دون توجّه واحد واضح. ولا يمكن لمن هم دون 13 عامًا إجراء التقييم.",
          },
          {
            q: "كم يستغرق التقييم؟",
            a: "نحو 15 دقيقة: 46 سؤالًا قصيرًا عن مواقف يومية، ثم أربعة أسئلة سريعة عن الخلفية. لا يوجد حدّ زمني، والتمهّل مهم، لأن الإجابة بسرعة كبيرة تقلّل من فائدة النتائج.",
          },
          {
            q: "كم التكلفة؟",
            a: "الإجابة عن الأسئلة مجانية. ولفتح التقرير الكامل، هناك دفعة واحدة قدرها 360 درهمًا (عرض لفترة محدودة؛ السعر الأصلي 450 درهمًا). وتشمل التقرير الكامل، وقسمًا لأولياء الأمور، وثلاثة أشهر مع كاي، المدرّب المهني الذكي.",
          },
          {
            q: "هل أحتاج إلى حساب؟",
            a: "ليس للبدء. تُجاب الأسئلة أولًا، ثم يُنشأ حساب في النهاية لحفظ النتائج وفتح التقرير.",
          },
          {
            q: "هل يمكن لابني أو ابنتي إجراء التقييم بالعربية؟",
            a: "نعم. يختار الطالب العربية أو الإنجليزية في البداية. وكل سؤال وتقرير ومحادثة مع كاي متاحة باللغتين، وقد كُتبت النسخة العربية لمتحدثي العربية، لا مترجمة حرفيًا.",
          },
          {
            q: "بدأ ابني أو ابنتي التقييم دون مساعدتي. كيف أدفع؟",
            a: "عند الانتهاء، يمكن لابنكم أو ابنتكم إرسال رابط إليكم، غالبًا عبر واتساب. افتحوه على هاتفكم، واطّلعوا على ما يشمله التقرير، ثم ادفعوا، فيُفتح التقرير فورًا. والرابط صالح لمدة 7 أيام، ويمكن إرسال رابط جديد في أي وقت.",
          },
        ],
      },
      {
        title: "التقرير",
        items: [
          {
            q: "ماذا يعرض التقرير؟",
            a: "سبعة أقسام قصيرة بكلمات واضحة: ما يثير فضولك، وطريقتك المفضّلة في العمل، وما يحفّزك، وأجواء العمل التي تفضّلها، ثم مجموعات المهن ومجالات الدراسة التي تستحق الاستكشاف، مع المسارات الأقرب إلى إجاباتك داخلها. ويُختتم بخطوات عملية تالية وقسم مكتوب لأولياء الأمور.",
          },
          {
            q: "هل سيخبرني التقرير بالمهنة التي يجب أن أختارها؟",
            a: "لا، وهذا مقصود. يعرض تقييم كور عدة توجّهات تستحق الاستكشاف، لا مسمّى وظيفيًا واحدًا. فالاختيار يبقى لك دائمًا، ويمكن لكاي مساعدتك على التفكير فيه.",
          },
          {
            q: "ماذا لو لم أتّفق مع نتائجي؟",
            a: "لا أحد يعرفك أكثر منك. يصف التقرير إجاباتك اليوم، لا من تكون إلى الأبد. وإذا بدا لك شيء غير دقيق، يمكن مشاركة ذلك مع كاي، فهو يأخذ رأيك بجدية وينطلق من رؤيتك أنت.",
          },
          {
            q: "كيف أستخدم التقرير لاختيار التخصّص الجامعي؟",
            a: "تتضمّن كل مجموعة مهن في تقريرك مجالات الدراسة التي تؤدي إليها، وتشمل خطواتك التالية أسئلة لطرحها على مدرستك أو على الجامعات. وتختلف شروط القبول بحسب البلد والجامعة، لذا يُنصح بالتحقق منها مع المرشد الأكاديمي في المدرسة وعبر المواقع الرسمية للجامعات.",
          },
          {
            q: "إلى متى يمكنني التحدث مع كاي؟",
            a: "لمدة ثلاثة أشهر من يوم إجراء التقييم. وقد قرأ كاي تقريرك، لذلك تبدأ كل محادثة من نتائجك، متى احتجت إليه.",
          },
          {
            q: "هل يمكنني إعادة التقييم؟",
            a: "نعم. الاهتمامات تنمو وتتغيّر، وإعادة التقييم بعد عام تُظهر كيف تطوّرت اهتماماتك. وسنرسل تذكيرًا حين يحين الوقت.",
          },
          {
            q: "هل قائمة المهن محدّثة؟",
            a: "نعم. رُوجعت قائمة المهن في عام 2026 مقارنةً بتقرير «مستقبل الوظائف 2025» الصادر عن المنتدى الاقتصادي العالمي، ودراسة منظمة العمل الدولية لعام 2025 عن الوظائف المتأثرة بالذكاء الاصطناعي، وتُراجَع سنويًا. والمهن التي تشهد تغيّرًا تحمل ملاحظة قصيرة في تقريرك.",
            link: { href: SCIENCE, label: "المزيد في صفحة الأساس العلمي ←" },
          },
        ],
      },
      {
        title: "الثقة والخصوصية",
        items: [
          {
            q: "هل تقييم كور اختبار؟",
            a: "لا. تقييم كور أداة للاستكشاف والتوجيه، وليس اختبارًا نفسيًا قياسيًا. لا يقيس القدرات أو الذكاء أو الشخصية، ولا يوجد فيه نجاح أو رسوب، ولا يقارنك بالطلاب الآخرين. بل يصف إجاباتك اليوم ليساعدك على الاستكشاف.",
          },
          {
            q: "على ماذا يقوم تقييم كور؟",
            a: "على عقود من الأبحاث في الاختيار المهني: أعمال عالم النفس جون هولاند عن الاهتمامات المهنية، وأبحاث تصميم الوظائف، وأبحاث ما يريده الناس من العمل، وأبحاث بيئات العمل. وتأتي المهن وتفاصيلها من «أونت»، وهي قاعدة بيانات عامة للمهن. وقد كُتب التقييم بالعربية والإنجليزية لعائلات المنطقة، ونتابع مع الطلاب لاحقًا، بموافقتهم، لتطويره باستمرار.",
            link: { href: SCIENCE, label: "المزيد في صفحة الأساس العلمي ←" },
          },
          {
            q: "من يمكنه رؤية نتائجي ومحادثاتي مع كاي؟",
            a: "أنت. وللطلاب من سن 13 إلى 17، يمكن لولي الأمر الذي فتح التقرير الاطلاع عليه وقراءة المحادثات مع كاي، ويُبلَّغ الطلاب بذلك قبل البدء. وإذا شاركت بطاقة ملخّص، فأنت من يختار ما يظهر فيها، ولن تظهر فيها سنّك أو مدرستك أو رابط تقريرك.",
          },
          {
            q: "هل معلوماتي آمنة؟",
            a: "نعم. البيانات الشخصية محفوظة بشكل منفصل عن إجاباتك ومحمية، ولا نبيع معلوماتك أبدًا. وإذا لم يُنشأ حساب في النهاية، تُحذف الإجابات. والمشاركة في البحث اختيارية وتتطلّب الموافقة.",
            link: { href: PRIVACY, label: "اطّلعوا على سياسة الخصوصية ←" },
          },
          {
            q: "من يقف وراء ماب ماي كور؟",
            a: "تطوّر ماب ماي كور شركة The ME Project (FZE)، ومقرّها مجمّع الشارقة للبحوث والتكنولوجيا والابتكار في الإمارات العربية المتحدة، وتركّز على استكشاف المسارات الدراسية والمهنية للشباب في الشرق الأوسط وشمال أفريقيا.",
          },
        ],
      },
      {
        title: "اختيار المسار",
        items: [
          {
            q: "كيف يمكن لابني أو ابنتي اختيار التخصّص الجامعي؟",
            a: "البداية بالاتساع ثم التضييق. تقترح أبحاث اتخاذ القرار ثلاث خطوات: النظر في مجموعة واسعة من الخيارات، ثم التعمّق في عدد قليل منها، ثم الاختيار (غاتي وآشر، 2001). ومن المفيد البدء بما يشدّهم، لا بالدرجات وحدها، والتحقق من شروط القبول مع المدرسة والجامعات. ويساعد تقييم كور في الخطوة الأولى، إذ يعرض مجموعات المهن ومجالات الدراسة المرتبطة بها التي تستحق الاستكشاف، بناءً على ما يثير فضولهم.",
          },
          {
            q: "ابني أو ابنتي يُجيد مواد كثيرة. كيف يختار توجّهًا؟",
            a: "إجادة أشياء كثيرة نقطة قوة، لا مشكلة. ومن المفيد النظر في سبب الاستمتاع بكل منها: فأربعة طلاب في نادي الروبوتات نفسه قد يكونون هناك لأربعة أسباب مختلفة، وكل سبب يشير إلى مستقبل مختلف. وهذا تحديدًا ما ينظر إليه تقييم كور، فيُظهر إن كانت الاهتمامات تلتقي في توجّه واحد أو تمتد على نطاق واسع، مع مسارات للاستكشاف في الحالتين.",
          },
          {
            q: "هل من الطبيعي ألّا يعرف المرء ماذا يريد بعد؟",
            a: "نعم. يصف باحثو التطوّر المهني المرحلة من 15 إلى 24 عامًا تقريبًا بأنها مرحلة استكشاف، لا التزام (سوبر). ووجد استطلاع أُجري عام 2020 على طلاب جامعات في المنطقة أن 56% فقط لديهم خطة واضحة لما بعد التخرّج. فعدم المعرفة بعد سبب للاستكشاف، لا للقلق.",
          },
          {
            q: "متى ينبغي للطلاب البدء بالتفكير في المهن؟",
            a: "بداية المرحلة الثانوية وقت مناسب لبدء الاستكشاف، قبل أن تبدأ اختيارات المواد في تضييق الخيارات. فكثيرًا ما يستبعد الشباب مسارات مبكرًا بناءً على ما يبدو متوقّعًا منهم (غوتفريدسون، 1981). وفي دراسة لمنظمة التعاون الاقتصادي والتنمية شملت طلابًا في سن 15 من 41 دولة، توقّع 47% من الفتيان و53% من الفتيات العمل في واحدة من عشر مهن فقط. والاستكشاف المبكر يُبقي أبوابًا أكثر مفتوحة.",
          },
          {
            q: "كيف يغيّر الذكاء الاصطناعي المهن التي ينبغي للطلاب التفكير فيها؟",
            a: "المهارات تتغيّر أكثر من المسمّيات الوظيفية. يتوقّع المنتدى الاقتصادي العالمي أن تتغيّر 39% من المهارات الأساسية للعاملين بحلول عام 2030. ويبقى التفكير التحليلي المهارة الأكثر طلبًا، بينما تتصاعد بأسرع وتيرة أهمية الذكاء الاصطناعي والبيانات الضخمة، والتفكير الإبداعي، والمرونة، والفضول والتعلّم مدى الحياة. وهذا سبب لاختيار توجّه يثير الفضول ومواصلة التعلّم، لا للبحث عن وظيفة «آمنة». وقائمة المهن في تقييم كور مراجَعة في ضوء هذه التوجّهات، والمهن التي تشهد تغيّرًا مُعلَّمة.",
          },
          {
            q: "كيف يمكن لأولياء الأمور المساعدة دون زيادة الضغط؟",
            a: "في الإمارات، وجدت الأبحاث أن أولياء الأمور هم الأكثر تأثيرًا في الاختيارات المهنية للطلاب (محبّي وديفيد، 2024). ويكون هذا التأثير أكثر فائدة حين يفتح الأبواب: بالسؤال عمّا يشعرون أنه مناسب لهم قبل اقتراح ما يختارونه، والاستكشاف معًا، والحوار بصراحة إذا اختلفت الآمال. ويتضمّن تقرير كور قسمًا لأولياء الأمور، ويمكن لكاي مساعدة أبنائكم على الاستعداد لهذا الحوار.",
          },
        ],
      },
    ],
  },
};

/** schema.org FAQPage, one per language (28 Oct update, Part A.6). */
export function faqStructuredData(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": (Object.keys(FAQ_COPY) as Locale[]).map((locale) => ({
      "@type": "FAQPage",
      inLanguage: locale,
      mainEntity: FAQ_COPY[locale].groups.flatMap((group) =>
        group.items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      ),
    })),
  };
}
