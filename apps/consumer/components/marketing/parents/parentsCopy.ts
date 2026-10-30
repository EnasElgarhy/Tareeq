import type { Locale } from "@/lib/i18n/locale";

/**
 * For parents page (28 Oct update, Part B; Arabic from the 28 Oct Arabic
 * website text, section 2). Parents are addressed in the plural in Arabic.
 */

interface TitledPoint {
  title: string;
  body: string;
}

export interface ParentsCopy {
  eyebrow: string;
  headline: string;
  subline: string;
  cta: string;
  underCta: string;
  why: { headline: string; text: string; highlight: string };
  how: { headline: string; steps: readonly TitledPoint[] };
  report: {
    headline: string;
    points: readonly TitledPoint[];
    exampleLabel: string;
    example: string;
    note: string;
  };
  help: { headline: string; intro: string; points: readonly TitledPoint[] };
  privacy: { headline: string; points: readonly string[]; link: string };
  price: {
    headline: string;
    full: (amount: number) => string;
    now: (amount: number) => string;
    under: string;
    includedTitle: string;
    included: readonly string[];
    note: string;
  };
  closing: { headline: string; underCta: string };
  /** The page's index: the questions a parent arrives with (new, for Enas to review). */
  questions: {
    title: string;
    report: string;
    how: string;
    help: string;
    privacy: string;
    price: string;
  };
  /** Label on the WhatsApp preview in the opening (new, for Enas to review). */
  messageLabel: string;
}

export const PARENTS_COPY: Record<Locale, ParentsCopy> = {
  en: {
    eyebrow: "Career and study exploration · Information for parents",
    headline: "Give your child the tools to make informed choices.",
    subline:
      "In 15 minutes, your child sees what pulls their interest, and the study fields and careers worth exploring. Parents get a section written just for them.",
    cta: "Send CORE to your child",
    underCta: "Free for your child to start · Arabic or English",
    why: {
      headline: "Most of us figured it out by trial and error.",
      text: "Now it’s our children’s turn, and the choices are even bigger. Good career guidance shouldn’t be hard to find, yet for most families it is.",
      highlight:
        "It’s hardest for children who are good at many things, with no single clear direction. CORE was built with them in mind.",
    },
    how: {
      headline: "How it works",
      steps: [
        {
          title: "Your child answers.",
          body: "About 15 minutes, on a phone or computer, in Arabic or English. Everyday situations, with no right or wrong answers. Free to take.",
        },
        {
          title: "You unlock the report.",
          body: "When they finish, you pay once to unlock their report. If your child started on their own, they can send you a link to do it from your phone.",
        },
        {
          title: "You read it together.",
          body: "The job families and study fields worth exploring, practical next steps, and a section written for parents on how to support without deciding for them.",
        },
        {
          title: "Kai keeps the conversation going.",
          body: "Your child can talk their results through with Kai, their AI coach, whenever they need.",
        },
      ],
    },
    report: {
      headline: "What you’ll see in the report",
      points: [
        {
          title: "Where their curiosities lead",
          body: "The job families worth exploring, with example jobs in each.",
        },
        {
          title: "The study fields behind them",
          body: "For each family, the university subjects that lead there.",
        },
        {
          title: "Different routes in the same field",
          body: "Which jobs are closest to how your child likes to work, what motivates them and the setting they prefer. Two students drawn to medicine might be pointed to a quiet laboratory or a busy emergency department.",
        },
        {
          title: "Next steps to try",
          body: "Something to watch, something to try, questions to ask someone in the field, and questions for their school or university.",
        },
      ],
      exampleLabel: "Example",
      example:
        "A student drawn to Research & Discovery and People & Wellbeing might see Clinical and health sciences, with jobs such as dentist, dietitian or genetic counsellor, and study fields such as psychology, nutrition and dietetics, and genetics.",
      note: "Several directions are always kept open. The choice stays with your child.",
    },
    help: {
      headline: "How you can help",
      intro: "Your interest makes the biggest difference when you explore together.",
      points: [
        {
          title: "Ask, don’t tell",
          body: "Ask what surprised them and what feels right to them, rather than what they should choose.",
        },
        {
          title: "Explore together",
          body: "Watch someone in the job online, visit an open day, or take the report’s questions to a school meeting.",
        },
        {
          title: "Talk through differences",
          body: "If your hopes differ from what they’re curious about, talk it through. Both views matter, and Kai can help your child prepare for that conversation.",
        },
        {
          title: "Treat it as a starting point",
          body: "Interests grow and change. Taking CORE again a year later shows how theirs have developed, and we’ll send a reminder when it’s time.",
        },
      ],
    },
    privacy: {
      headline: "Your child’s privacy and safety",
      points: [
        "Only for ages 13 and up. Anyone younger is stopped at the start, and nothing is saved.",
        "You’re part of it. For children aged 13 to 17, a parent unlocks the report, and parents can read their child’s conversations with Kai. Your child is told this before they start.",
        "Nothing kept without a reason. If your child doesn’t go on to register, their answers are deleted.",
        "Research is optional. We may invite your child to a short follow-up later, only with your consent, and you can withdraw it at any time.",
        "Sharing is their choice. If they share a summary card, it never shows their age, their school or a link to their report.",
        "Kai looks out for them. If your child shares something worrying, Kai responds with care, encourages them to talk to a trusted adult, and shares emergency contacts if needed.",
        "We never sell your child’s information.",
        "Personal details are kept separate from their answers and protected.",
      ],
      link: "Read our privacy policy",
    },
    price: {
      headline: "One payment. Everything included.",
      full: (amount) => `${amount} AED`,
      now: (amount) => `${amount} AED`,
      under: "Limited time offer · One-time payment · No subscription",
      includedTitle: "What’s included",
      included: [
        "Your child’s full report, with the job families, study fields, routes and next steps",
        "A section written for parents",
        "Kai, their AI coach, to talk the results through (available for 3 months from taking CORE)",
      ],
      note: "Answering the questions is free. You only pay to unlock the report.",
    },
    closing: {
      headline: "A clearer picture of their options, and the right tool to decide for themselves.",
      underCta: "About 15 minutes · Free for your child to start",
    },
    questions: {
      title: "Questions parents ask",
      report: "What will my child see?",
      how: "How does it work?",
      help: "How can I help?",
      privacy: "Is it safe?",
      price: "What does it cost?",
    },
    messageLabel: "What your child receives",
  },
  ar: {
    eyebrow: "استكشاف المسارات الدراسية والمهنية · معلومات لأولياء الأمور",
    headline: "امنحوا أبناءكم الأدوات لاتخاذ قرارات مدروسة.",
    subline:
      "خلال 15 دقيقة، يتعرّف أبناؤكم على ما يثير فضولهم، وعلى مجالات الدراسة والمهن التي تستحق الاستكشاف. ولأولياء الأمور قسم مكتوب خصيصًا لهم.",
    cta: "أرسلوا تقييم كور لأبنائكم",
    underCta: "البدء مجاني لأبنائكم · بالعربية أو الإنجليزية",
    why: {
      headline: "معظمنا وجد طريقه بالتجربة والخطأ.",
      text: "واليوم جاء دور أبنائنا، والخيارات أمامهم أوسع بكثير. التوجيه المهني الجيد لا ينبغي أن يكون صعب المنال، لكنه كذلك لدى معظم العائلات.",
      highlight:
        "ويكون الأمر أصعب على الأبناء الذين يُجيدون أشياء كثيرة دون توجّه واحد واضح. وقد صُمّم تقييم كور وهم في الحسبان.",
    },
    how: {
      headline: "كيف يعمل",
      steps: [
        {
          title: "يجيب أبناؤكم",
          body: "نحو 15 دقيقة، عبر الهاتف أو الحاسوب، بالعربية أو الإنجليزية. مواقف من الحياة اليومية، دون إجابات صحيحة أو خاطئة. والإجابة مجانية.",
        },
        {
          title: "تفتحون التقرير",
          body: "عند الانتهاء، تدفعون مرة واحدة لفتح التقرير. وإذا بدأ أبناؤكم التقييم بأنفسهم، يمكنهم إرسال رابط إليكم لإتمام ذلك من هاتفكم.",
        },
        {
          title: "تقرؤونه معًا",
          body: "مجموعات المهن ومجالات الدراسة التي تستحق الاستكشاف، وخطوات عملية تالية، وقسم مكتوب لأولياء الأمور عن كيفية الدعم دون اتخاذ القرار عنهم.",
        },
        {
          title: "كاي يواصل الحوار",
          body: "يمكن لأبنائكم مناقشة نتائجهم مع كاي، مدرّبهم المهني الذكي، متى احتاجوا إلى ذلك.",
        },
      ],
    },
    report: {
      headline: "ما ستجدونه في التقرير",
      points: [
        {
          title: "إلى أين يقود فضولهم",
          body: "مجموعات المهن التي تستحق الاستكشاف، مع أمثلة على المهن في كل منها.",
        },
        {
          title: "مجالات الدراسة المرتبطة بها",
          body: "لكل مجموعة، التخصّصات الجامعية التي تؤدي إليها.",
        },
        {
          title: "مسارات مختلفة في المجال نفسه",
          body: "المهن الأقرب إلى طريقتهم المفضّلة في العمل، وما يحفّزهم، والأجواء التي يفضّلونها. فطالبان ينجذبان إلى الطب قد يتّجه أحدهما إلى مختبر هادئ والآخر إلى قسم طوارئ مزدحم.",
        },
        {
          title: "خطوات تالية للتجربة",
          body: "شيء للمشاهدة، وشيء للتجربة، وأسئلة لشخص يعمل في المجال، وأسئلة للمدرسة أو الجامعة.",
        },
      ],
      exampleLabel: "مثال",
      example:
        "طالب ينجذب إلى «البحث والاكتشاف» و«خدمة الناس ودعمهم» قد يرى مجموعة «العلوم السريرية والصحية»، مع مهن مثل طبيب أسنان، وأخصائي تغذية، ومستشار وراثي، ومجالات دراسة مثل علم النفس، والتغذية العلاجية، وعلم الوراثة.",
      note: "تبقى عدة توجّهات مفتوحة دائمًا، والاختيار يبقى لأبنائكم.",
    },
    help: {
      headline: "كيف يمكنكم المساعدة",
      intro: "يُحدث اهتمامكم الفرق الأكبر حين تستكشفون معًا.",
      points: [
        {
          title: "اسألوا قبل أن توجّهوا",
          body: "اسألوهم عمّا فاجأهم وعمّا يشعرون أنه مناسب لهم، لا عمّا يجب أن يختاروه.",
        },
        {
          title: "استكشفوا معًا",
          body: "شاهدوا مقاطع لأشخاص في المهنة، أو زوروا يومًا مفتوحًا، أو اصطحبوا أسئلة التقرير إلى لقاء مدرسي.",
        },
        {
          title: "تحاوروا حين تختلف الآراء",
          body: "إذا اختلفت آمالكم عمّا يثير فضولهم، فالحوار هو الطريق. كلا الرأيين مهم، ويمكن لكاي مساعدة أبنائكم على الاستعداد لهذا الحديث.",
        },
        {
          title: "اعتبروه نقطة انطلاق",
          body: "الاهتمامات تنمو وتتغيّر. وإعادة تقييم كور بعد عام تُظهر كيف تطوّرت، وسنرسل لكم تذكيرًا حين يحين الوقت.",
        },
      ],
    },
    privacy: {
      headline: "خصوصية أبنائكم وسلامتهم",
      points: [
        "لمن هم في سن 13 فأكثر فقط. يتوقّف التقييم منذ البداية لمن هم أصغر سنًا، ولا يُحفظ أي شيء.",
        "أنتم جزء من التجربة. للأبناء من سن 13 إلى 17، يفتح أحد الوالدين التقرير، ويمكن لأولياء الأمور قراءة محادثات أبنائهم مع كاي. ويُبلَّغ الطالب بذلك قبل البدء.",
        "لا نحتفظ بشيء دون سبب. إذا لم يُكمل أبناؤكم التسجيل، تُحذف إجاباتهم.",
        "المشاركة في البحث اختيارية. قد ندعو أبناءكم لاحقًا إلى متابعة قصيرة، بموافقتكم فقط، ويمكنكم سحب الموافقة في أي وقت.",
        "المشاركة قرارهم. إذا شاركوا بطاقة ملخّص، فلن تظهر فيها أعمارهم أو مدارسهم أو رابط تقريرهم.",
        "كاي يرعاهم. إذا شارك أبناؤكم أمرًا مقلقًا، يتعامل كاي معه بعناية، ويشجّعهم على التحدّث إلى شخص بالغ يثقون به، ويشارك أرقام الطوارئ عند الحاجة.",
        "لا نبيع معلومات أبنائكم أبدًا.",
        "البيانات الشخصية محفوظة بشكل منفصل عن الإجابات ومحمية.",
      ],
      link: "اطّلعوا على سياسة الخصوصية",
    },
    price: {
      headline: "دفعة واحدة. كل شيء مشمول.",
      full: (amount) => `${amount} درهمًا`,
      now: (amount) => `${amount} درهمًا`,
      under: "عرض لفترة محدودة · دفعة واحدة · دون اشتراك",
      includedTitle: "ما يشمله السعر",
      included: [
        "تقرير كامل لأبنائكم، يتضمّن مجموعات المهن ومجالات الدراسة والمسارات والخطوات التالية",
        "قسم مكتوب لأولياء الأمور",
        "كاي، مدرّبهم المهني الذكي، لمناقشة النتائج (متاح لمدة 3 أشهر من تاريخ إجراء التقييم)",
      ],
      note: "الإجابة عن الأسئلة مجانية، والدفع فقط لفتح التقرير.",
    },
    closing: {
      headline: "صورة أوضح عن خياراتهم، والأداة المناسبة ليقرّروا بأنفسهم.",
      underCta: "نحو 15 دقيقة · البدء مجاني لأبنائكم",
    },
    questions: {
      title: "أسئلة أولياء الأمور",
      report: "ماذا سيرى أبناؤكم؟",
      how: "كيف يعمل؟",
      help: "كيف يمكنكم المساعدة؟",
      privacy: "هل هو آمن؟",
      price: "كم التكلفة؟",
    },
    messageLabel: "ما يصل إلى أبنائكم",
  },
};
