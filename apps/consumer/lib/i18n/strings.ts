import type { Locale } from "@/lib/i18n/locale";

interface Entry {
  en: string;
  ar: string;
}

/**
 * UI chrome string catalog. Assessment *content* (questions + options) is
 * already bilingual in the seed; this covers the surrounding UI text.
 */
export const STRINGS = {
  // ---- Language chooser ----
  "lang.title": { en: "Choose your language", ar: "اختر لغتك" },
  "lang.subtitle": {
    en: "Pick the language for your assessment.",
    ar: "اختر لغة التقييم الخاص بك.",
  },
  "lang.en.name": { en: "English", ar: "English" },
  "lang.en.note": { en: "Continue in English", ar: "المتابعة بالإنجليزية" },
  "lang.ar.name": { en: "العربية", ar: "العربية" },
  "lang.ar.note": { en: "المتابعة بالعربية", ar: "المتابعة بالعربية" },
  "lang.hint": {
    en: "You can switch anytime from the header.",
    ar: "يمكنك التبديل في أي وقت من الأعلى.",
  },

  // ---- Navigation / common ----
  "nav.continue": { en: "Continue", ar: "متابعة" },
  "nav.begin": { en: "Begin", ar: "ابدأ" },
  "nav.back": { en: "Back", ar: "رجوع" },
  "nav.next": { en: "Next", ar: "التالي" },
  "nav.skip": { en: "Skip", ar: "تخطّي" },
  "nav.done": { en: "Done", ar: "تم" },
  "nav.finish": { en: "Finish", ar: "إنهاء" },
  "nav.previous": { en: "Previous", ar: "السابق" },
  "common.of": { en: "of", ar: "من" },
  "kai.guide_aria": { en: "Kai, your guide", ar: "كاي، مرشدتك" },
  "audio.pause": { en: "Pause Kai’s voice", ar: "إيقاف صوت كاي مؤقتاً" },
  "audio.speed_control": {
    en: "Playback speed {speed}× — tap to change",
    ar: "سرعة التشغيل {speed}× — اضغط للتغيير",
  },
  "question.select_country_group_mena": {
    en: "Middle East & North Africa",
    ar: "الشرق الأوسط وشمال أفريقيا",
  },
  "question.select_country_group_other": { en: "Other", ar: "أخرى" },
  "question.select_country_placeholder": {
    en: "Select your country…",
    ar: "اختر بلدك…",
  },
  "question.select_country_aria": {
    en: "Select your country",
    ar: "اختر بلدك",
  },
  "question.text_helper": {
    en: "No wrong answers — write what comes to mind.",
    ar: "لا إجابات خاطئة — اكتب ما يخطر ببالك.",
  },
  "question.choose_n_of": { en: "Choose 1 of {n}", ar: "اختر 1 من {n}" },
  "question.two_paths": { en: "Two paths", ar: "طريقان" },
  "question.saving": { en: "Saving…", ar: "جارٍ الحفظ…" },
  "question.tap_to_continue": { en: "Tap to continue", ar: "اضغط للمتابعة" },
  "question.previous_aria": { en: "Previous question", ar: "السؤال السابق" },

  // ---- Did You Know interstitial (components/onboarding/DidYouKnow.tsx) ----
  "interstitial.chip": { en: "Kai · did you know?", ar: "كاي · هل تعلم؟" },
  "interstitial.dismiss_aria": { en: "Dismiss", ar: "إغلاق" },
  "interstitial.source_prefix": {
    en: "Source: {source}",
    ar: "المصدر: {source}",
  },
  "audio.speaking": { en: "Kai is speaking", ar: "كاي تتحدث" },

  // ---- Share flow (ResultsScreen share button + public /share/[token]) ----
  "share.generating": { en: "Creating your link…", ar: "جارٍ إنشاء رابطك…" },
  "share.link_error": {
    en: "Couldn’t create a shareable link. Try again.",
    ar: "تعذّر إنشاء رابط للمشاركة. حاول مرة أخرى.",
  },
  "share.owner_heading": {
    en: "{name}’s Career Compass",
    ar: "بوصلة {name} المهنية",
  },
  "share.owner_heading_fallback": { en: "A Career Compass", ar: "بوصلة مهنية" },
  "share.intro_tagline": {
    en: "Tareeq turns a student’s answers into a personal direction to explore — not a fixed destination.",
    ar: "يُحوّل طريق إجابات الطالب إلى اتجاه شخصي للاستكشاف — لا وجهة نهائية محددة.",
  },
  "share.careers_label": {
    en: "Career directions worth exploring",
    ar: "مسارات مهنية تستحق الاستكشاف",
  },
  "share.cta_title": {
    en: "Curious what yours would say?",
    ar: "هل تتساءل ماذا ستقول بوصلتك؟",
  },
  "share.cta_button": {
    en: "Take your own Career Compass",
    ar: "خذ بوصلتك المهنية الخاصة",
  },
  "share.cta_meta": {
    en: "Free · ~12 minutes · No account needed to start",
    ar: "مجاناً · ~12 دقيقة · لا حاجة لحساب للبدء",
  },
  "share.footer_brand": { en: "Powered by Tareeq", ar: "بواسطة طريق" },
  "share.not_found_title": {
    en: "This link isn’t available",
    ar: "هذا الرابط غير متاح",
  },
  "share.not_found_body": {
    en: "It may have expired, or the result was removed. You can still take your own Career Compass.",
    ar: "قد يكون منتهي الصلاحية، أو تمت إزالة النتيجة. لا يزال بإمكانك أخذ بوصلتك المهنية الخاصة.",
  },
  "share.intro_reveal_heading": {
    en: "{name} shared their Career Compass with you.",
    ar: "بوصلة {name} المهنية بين يديك.",
  },
  "share.intro_reveal_heading_fallback": {
    en: "A Career Compass was shared with you.",
    ar: "تمت مشاركة بوصلة مهنية معك.",
  },
  "share.intro_reveal_subtitle": {
    en: "Take a look at what Tareeq found.",
    ar: "ألقِ نظرة على ما اكتشفه طريق.",
  },
  "share.intro_skip": { en: "Tap to view now", ar: "اضغط للعرض الآن" },
  "question.reflect_placeholder": {
    en: "Type your reflection…",
    ar: "اكتب تأمّلك هنا…",
  },

  // ---- Intro / Kai ----
  "intro.getting_ready": { en: "Kai is getting ready.", ar: "كاي تستعد." },
  "intro.meet": { en: "Meet Kai", ar: "تعرّف على كاي" },
  "intro.meet_prefix": { en: "Meet ", ar: "تعرّف على " },
  "intro.kai_name": { en: "Kai", ar: "كاي" },
  "intro.body": {
    en: "Think of me as a filter for all the noise. We’re looking for your Energy Flows — the stuff that makes you lose track of time. Pick what you’d actually do.",
    ar: "اعتبرني فلتراً يُبعد عنك كل الضجيج. نحن نبحث عن مساراتك التي تتدفّق فيها طاقتك — الأشياء التي تُنسيك الوقت. اختر ما ستفعله فعلاً.",
  },

  // ---- Section encouragements (also narration) ----
  "kai.intro": {
    en: "Hey, I'm Kai. Think of me as a filter for all the noise. There are no wrong answers here — just pick what you would actually do, or the closest thing to it.",
    ar: "أهلاً، أنا كاي. اعتبرني فلتراً يُبعد عنك كل الضجيج. لا توجد إجابات خاطئة هنا — فقط اختر ما ستفعله فعلاً، أو أقرب شيء إليه.",
  },
  "kai.after_10": {
    en: "Nice progress. Your curiosity pattern is starting to take shape. Keep choosing what feels true to you.",
    ar: "تقدّم رائع. بدأ نمط فضولك يتّضح. استمر باختيار ما يشبهك فعلاً.",
  },
  "kai.after_20": {
    en: "You are doing well. This next part looks at how you like to work, not what anyone expects from you.",
    ar: "أنت تبلي حسناً. هذا الجزء التالي يستكشف الطريقة التي تحب أن تعمل بها، لا ما يتوقعه منك الآخرون.",
  },
  "kai.after_30": {
    en: "Stay with it. The next questions help us understand what keeps you motivated when work gets real.",
    ar: "واصل التركيز. الأسئلة التالية تساعدنا على فهم ما يبقيك متحمساً حين يصبح العمل جدّياً.",
  },
  "kai.after_40": {
    en: "Almost there. These final answers help me see the kind of environment where you can actually grow.",
    ar: "اقتربنا. هذه الإجابات الأخيرة تساعدني على رؤية البيئة التي يمكنك أن تنمو فيها حقاً.",
  },
  "kai.results": {
    en: "Nice work. Here's your Career Compass. Remember — this is a compass, not a GPS. You still get to choose the destination.",
    ar: "عمل رائع. هذه بوصلتك المهنية. تذكّر — إنها بوصلة، لا خريطة تقودك خطوة بخطوة. ما زلت أنت من يختار الوجهة.",
  },

  // ---- Audio controls ----
  "audio.mute": { en: "Mute Kai's voice", ar: "كتم صوت كاي" },
  "audio.unmute": { en: "Unmute Kai's voice", ar: "تشغيل صوت كاي" },
  "audio.replay": { en: "Replay Kai's voice", ar: "إعادة صوت كاي" },

  // ---- Profile tabs (lightweight internal tabs, not a global nav bar) ----
  "profile.tab.overview": { en: "Overview", ar: "نظرة عامة" },
  "profile.tab.compass": { en: "Career Compass", ar: "بوصلة المسار" },
  "profile.tab.journey": { en: "Journey", ar: "رحلتك" },
  "profile.tab.kai": { en: "Kai", ar: "كاي" },
  "profile.tab.settings": { en: "Settings", ar: "الإعدادات" },

  // ---- Kai panel (Profile > Kai — landing only, no chat yet) ----
  "kai.panel.greeting_morning": { en: "Good morning", ar: "صباح الخير" },
  "kai.panel.greeting_afternoon": { en: "Good afternoon", ar: "مساء الخير" },
  "kai.panel.greeting_evening": { en: "Good evening", ar: "مساء الخير" },
  "kai.panel.greeting_fallback_name": { en: "there", ar: "بك" },

  "kai.panel.empty_title": {
    en: "I'm still waiting to meet the real you.",
    ar: "ما زلت في انتظار التعرّف عليك حقاً.",
  },
  "kai.panel.empty_body": {
    en: "Finish your Career Compass first, then I can guide you with more personal advice.",
    ar: "أكمل بوصلتك المهنية أولاً، وبعدها يمكنني إرشادك بنصائح أكثر خصوصية.",
  },
  "kai.panel.empty_cta": { en: "Start Assessment", ar: "ابدأ التقييم" },
  "kai.panel.noticed_label": {
    en: "Kai noticed something",
    ar: "لاحظت كاي شيئاً",
  },
  "kai.panel.continue_cta": { en: "Continue with Kai", ar: "تابع مع كاي" },
  "kai.panel.todays_move": { en: "Today's move", ar: "خطوة اليوم" },
  "kai.panel.recent_activity": { en: "Recent activity", ar: "النشاط الأخير" },
  "kai.panel.next_milestone": { en: "Next station", ar: "المحطة القادمة" },
  "profile.overview.achievements_title": {
    en: "Achievements",
    ar: "الإنجازات",
  },

  "profile.compass.why_title": {
    en: "Why this direction",
    ar: "لماذا هذا الاتجاه",
  },
  "profile.compass.confidence_title": { en: "Confidence", ar: "مستوى الثقة" },
  "profile.compass.confidence_body": {
    en: "This reflects how consistently your answers pointed toward one direction — not a guarantee, a signal worth exploring.",
    ar: "يعكس هذا مدى اتساق إجاباتك في الإشارة إلى اتجاه واحد — إنها ليست ضمانة، بل إشارة تستحق الاستكشاف.",
  },
  "profile.compass.strengths_title": {
    en: "Strength breakdown",
    ar: "تحليل نقاط القوة",
  },
  "profile.compass.careers_title": {
    en: "Career matches",
    ar: "مسارات مهنية مناسبة",
  },
  "profile.compass.day_in_life": {
    en: "Watch: a day in the life",
    ar: "شاهد: يوم في الحياة",
  },
  "profile.compass.majors_title": {
    en: "University majors to explore",
    ar: "تخصصات جامعية للاستكشاف",
  },
  "profile.compass.subjects_title": {
    en: "High school subjects that keep doors open",
    ar: "مواد الثانوية التي تُبقي الخيارات مفتوحة",
  },
  "profile.compass.non_obvious_title": {
    en: "Less obvious paths",
    ar: "مسارات أقل وضوحاً",
  },
  "profile.compass.landscape_title": {
    en: "Why these career families fit",
    ar: "لماذا تناسبك هذه المسارات المهنية",
  },
  "profile.compass.academic_title": {
    en: "How the study path connects",
    ar: "كيف يرتبط المسار الدراسي",
  },
  "profile.compass.reality_title": { en: "Reality check", ar: "فحص الواقع" },
  "profile.compass.integration_title": {
    en: "How your work style changes the path",
    ar: "كيف يُغيّر أسلوب عملك المسار",
  },
  "profile.compass.next_steps_title": {
    en: "Next steps",
    ar: "الخطوات القادمة",
  },
  "profile.compass.ask_kai_title": {
    en: "Ask Kai about this",
    ar: "اسأل كاي عن هذا",
  },
  "profile.compass.ask_kai_subtitle": {
    en: "Get a deeper explanation in conversation",
    ar: "احصل على شرح أعمق في محادثة",
  },
  "profile.achievement.joined": { en: "Joined Tareeq", ar: "انضممت إلى طريق" },
  "profile.achievement.joined_sub": {
    en: "Created your profile and set your language",
    ar: "أنشأت ملفك الشخصي واخترت لغتك",
  },
  "profile.achievement.core_complete": { en: "First Compass", ar: "أول بوصلة" },
  "profile.achievement.core_complete_sub": {
    en: "Answered all 40 CORE Compass questions",
    ar: "أجبت عن جميع أسئلة بوصلة CORE الأربعين",
  },
  "profile.achievement.deep_dive": {
    en: "Deep Dive done",
    ar: "أكملت المقابلة المعمّقة",
  },
  "profile.achievement.deep_dive_sub": {
    en: "Complete the Deep Dive Interview",
    ar: "أكمل مقابلة الغوص العميق",
  },
  "profile.achievement.skills_audit": {
    en: "Skills mapped",
    ar: "حددت مهاراتك",
  },
  "profile.achievement.skills_audit_sub": {
    en: "Complete your Skills Audit",
    ar: "أكمل تدقيق مهاراتك",
  },
  "profile.achievement.consistent": { en: "Consistent", ar: "المثابر" },
  "profile.achievement.consistent_sub": {
    en: "Reach a 7-day streak",
    ar: "حقق تتابعاً لمدة 7 أيام",
  },
  "profile.activity.core_complete": {
    en: "Completed CORE Compass",
    ar: "أكملت بوصلة CORE",
  },
  "profile.activity.profile_created": {
    en: "Created your profile",
    ar: "أنشأت ملفك الشخصي",
  },

  "profile.streak.title": { en: "Your streak", ar: "تتابعك" },
  "profile.streak.count_label": { en: "day streak", ar: "أيام متتالية" },
  "profile.streak.to_go": { en: "{n} to go", ar: "{n} متبقية" },
  "profile.streak.note": {
    en: "Come back for {days} more days to unlock the {badge} badge.",
    ar: "عد لمدة {days} أيام أخرى لفتح شارة {badge}.",
  },
  "profile.streak.day.mon": { en: "M", ar: "ن" },
  "profile.streak.day.tue": { en: "T", ar: "ث" },
  "profile.streak.day.wed": { en: "W", ar: "ر" },
  "profile.streak.day.thu": { en: "T", ar: "خ" },
  "profile.streak.day.fri": { en: "F", ar: "ج" },
  "profile.streak.day.sat": { en: "S", ar: "س" },
  "profile.streak.day.sun": { en: "S", ar: "ح" },

  "profile.resultHero.eyebrow": {
    en: "CORE Compass · Curiosity signal",
    ar: "بوصلة CORE · إشارة الفضول",
  },
  "profile.resultHero.style_label": { en: "Style", ar: "الأسلوب" },
  "profile.resultHero.view_report": {
    en: "View full Compass report",
    ar: "عرض تقرير البوصلة الكامل",
  },

  "profile.journey.minutes_left": { en: "~{n} min left", ar: "~{n} د متبقية" },
  "profile.journey.locked_hint": {
    en: "Coming soon as Tareeq grows",
    ar: "قريباً مع نمو طريق",
  },
  "profile.journey.caption.core-compass": {
    en: "The foundation — everything else builds on this.",
    ar: "الأساس — كل شيء آخر يُبنى على هذا.",
  },
  "profile.journey.caption.deep-dive": {
    en: "A live conversation that goes deeper on what CORE found.",
    ar: "محادثة مباشرة تتعمق فيما وجدته CORE.",
  },
  "profile.journey.caption.skills-audit": {
    en: "What you already have, and what's worth building next.",
    ar: "ما تملكه بالفعل، وما يستحق بناؤه بعد ذلك.",
  },
  "profile.journey.caption.pulse-check": {
    en: "A quick monthly check on how your direction is shifting.",
    ar: "فحص شهري سريع لكيفية تغيّر اتجاهك.",
  },
  "profile.journey.eyebrow": { en: "Your journey", ar: "رحلتك" },
  "profile.journey.heading": {
    en: "Assessments & modules",
    ar: "التقييمات والوحدات",
  },
  "profile.journey.just_starting": { en: "Just starting", ar: "بداية الرحلة" },
  "profile.journey.unlocked_count": { en: "{n} unlocked", ar: "{n} مفتوحة" },
  "profile.journey.status_done": { en: "Done", ar: "تم" },
  "profile.journey.status_current": { en: "Up next", ar: "التالي" },
  "profile.journey.status_soon": { en: "Soon", ar: "قريباً" },
  "profile.journey.completed_on": { en: "Completed", ar: "اكتمل في" },

  "profile.proactive.resume_conversation": {
    en: "Pick up where you left off — {summary}",
    ar: "تابع من حيث توقفت — {summary}",
  },
  "profile.proactive.resume_topic": {
    en: "You mentioned {topic} last time — want to pick up there?",
    ar: "ذكرت {topic} آخر مرة — هل تريد المتابعة من هناك؟",
  },
  "profile.proactive.next_step": {
    en: "Your next step is {module}. It takes about {duration}.",
    ar: "خطوتك التالية هي {module}. تستغرق حوالي {duration}.",
  },
  "profile.proactive.compass_highlight": {
    en: "One thing stood out from your Compass: {cluster} + {archetype}.",
    ar: "شيء واحد لفت الانتباه في بوصلتك: {cluster} + {archetype}.",
  },
  "profile.proactive.start_cta": { en: "Get started", ar: "ابدأ الآن" },
  "profile.proactive.inactivity_nudge": {
    en: "It's been {days} days — want to jump back in?",
    ar: "مرت {days} أيام — هل تريد العودة؟",
  },

  "profile.settings.account_label": { en: "Account", ar: "الحساب" },
  "profile.settings.sign_out": { en: "Sign out", ar: "تسجيل الخروج" },
  "profile.settings.footer": {
    en: "More assessments unlock as Tareeq grows. Your profile grows with you.",
    ar: "المزيد من التقييمات يُفتح مع نمو طريق. ملفك الشخصي ينمو معك.",
  },
  "profile.settings.language_label": { en: "Language", ar: "اللغة" },
  "profile.settings.language_en": { en: "English", ar: "الإنجليزية" },
  "profile.settings.language_ar": { en: "Arabic", ar: "العربية" },
  "profile.settings.memory_title": {
    en: "What Kai remembers",
    ar: "ما تتذكره كاي",
  },
  "profile.settings.memory_subtitle": {
    en: "Manage what Kai knows about you",
    ar: "تحكم فيما تعرفه كاي عنك",
  },

  "kai.chat.goal_prompt": {
    en: "What do you want to talk about?",
    ar: "عن ماذا تريد أن تتحدث؟",
  },
  "kai.chat.input_placeholder": {
    en: "Ask Kai anything about your future...",
    ar: "اسأل كاي أي شيء عن مستقبلك...",
  },
  "kai.chat.thinking": { en: "Kai is thinking...", ar: "كاي تفكر..." },
  "kai.chat.conversation_started": {
    en: "Conversation started",
    ar: "بدأت المحادثة",
  },
  // Contextual, time-based loading ladder (components/kai/chat/LoadingMessage.tsx).
  "kai.loading.thinking": { en: "Kai is thinking…", ar: "كاي تفكر…" },
  "kai.loading.connecting": {
    en: "Kai is connecting this to your Compass…",
    ar: "كاي تربط هذا ببوصلتك…",
  },
  "kai.loading.preparing": {
    en: "Kai is preparing an answer for you…",
    ar: "كاي تُعدّ لك إجابة…",
  },
  "kai.loading.more_thought": {
    en: "This one needs a little more thought…",
    ar: "هذه تحتاج تفكيراً أعمق قليلاً…",
  },
  "kai.loading.family_1": {
    en: "Kai is thinking about your parents' perspective…",
    ar: "كاي تفكر من وجهة نظر والديك…",
  },
  "kai.loading.family_2": {
    en: "Kai is preparing talking points…",
    ar: "كاي تُجهّز نقاط الحديث…",
  },
  "kai.loading.family_3": {
    en: "Kai is drafting your conversation…",
    ar: "كاي تصيغ محادثتك…",
  },
  "kai.loading.plan_1": {
    en: "Kai is building your next steps…",
    ar: "كاي تبني خطواتك التالية…",
  },
  "kai.loading.plan_2": {
    en: "Kai is organizing your week…",
    ar: "كاي تنظّم أسبوعك…",
  },
  "kai.loading.plan_3": {
    en: "Kai is turning ideas into actions…",
    ar: "كاي تحوّل الأفكار إلى خطوات…",
  },
  "kai.loading.rec_1": {
    en: "Kai is gathering ideas that fit your profile…",
    ar: "كاي تجمع أفكاراً تناسب ملفك…",
  },
  "kai.loading.rec_2": {
    en: "Kai is looking for examples…",
    ar: "كاي تبحث عن أمثلة…",
  },
  "kai.loading.rec_3": {
    en: "Kai is selecting what suits you best…",
    ar: "كاي تختار ما يناسبك أكثر…",
  },
  "kai.chat.subtitle": {
    en: "Your AI Career Coach",
    ar: "مدربتك المهنية بالذكاء الاصطناعي",
  },
  "kai.chat.suggested_next": { en: "Suggested next", ar: "اقتراحات للمتابعة" },
  "kai.chat.signed_out": {
    en: "Sign in to talk with Kai.",
    ar: "سجّل الدخول للتحدث مع كاي.",
  },
  "kai.chat.signed_out_cta": { en: "Sign in", ar: "تسجيل الدخول" },
  "kai.chat.no_assessment": {
    en: "I'll know much more after your Career Compass.",
    ar: "سأعرف أكثر بكثير بعد بوصلتك المهنية.",
  },

  "kai.memory.resume_cta": {
    en: "Continue where we left off",
    ar: "تابع من حيث توقفنا",
  },
  "kai.memory.goal_saved": { en: "Saved to memory", ar: "تم الحفظ في الذاكرة" },
  "kai.memory.section_title": {
    en: "What Kai knows about you",
    ar: "ما تعرفه كاي عنك",
  },
  "kai.memory.section_subtitle": {
    en: "Built from your conversations. You're always in control.",
    ar: "مبني من محادثاتك. أنت دائماً المتحكم.",
  },
  "kai.memory.empty": {
    en: "Kai hasn't learned anything about you yet — the more you talk, the more personal this gets.",
    ar: "لم تتعلم كاي شيئاً عنك بعد — كلما تحدثتما أكثر، أصبح هذا أكثر خصوصية.",
  },
  "kai.memory.forget_item": { en: "Forget this", ar: "انسَ هذا" },
  "kai.memory.clear_all": {
    en: "Clear all Kai memories",
    ar: "امسح كل ذكريات كاي",
  },
  "kai.memory.clear_confirm_title": {
    en: "Clear everything Kai remembers?",
    ar: "مسح كل ما تتذكره كاي؟",
  },
  "kai.memory.clear_confirm_body": {
    en: "This can't be undone. Kai will get to know you again from scratch.",
    ar: "لا يمكن التراجع عن هذا. ستتعرف عليك كاي من جديد.",
  },
  "kai.memory.clear_confirm_cta": {
    en: "Yes, clear it all",
    ar: "نعم، امسح الكل",
  },
  "kai.memory.cancel": { en: "Cancel", ar: "إلغاء" },

  "kai.resource.type.book": { en: "Book", ar: "كتاب" },
  "kai.resource.type.course": { en: "Course", ar: "دورة" },
  "kai.resource.type.youtube_video": {
    en: "YouTube Video",
    ar: "فيديو يوتيوب",
  },
  "kai.resource.type.article": { en: "Article", ar: "مقال" },
  "kai.resource.type.podcast": { en: "Podcast", ar: "بودكاست" },
  "kai.resource.type.community": { en: "Community", ar: "مجتمع" },
  "kai.resource.type.website": { en: "Website", ar: "موقع إلكتروني" },
  "kai.resource.type.project": { en: "Project", ar: "مشروع" },
  "kai.resource.type.competition": { en: "Competition", ar: "مسابقة" },
  "kai.resource.difficulty.beginner": { en: "Beginner", ar: "مبتدئ" },
  "kai.resource.difficulty.intermediate": { en: "Intermediate", ar: "متوسط" },
  "kai.resource.difficulty.advanced": { en: "Advanced", ar: "متقدم" },
  "kai.resource.save": { en: "Save", ar: "احفظ" },
  "kai.resource.saved": { en: "Saved", ar: "محفوظ" },
  "kai.resource.add_to_plan": {
    en: "Add to Action Plan",
    ar: "أضف لخطة العمل",
  },
  "kai.resource.added_to_plan": { en: "Added to plan", ar: "أُضيف للخطة" },
  "kai.resource.search_youtube": {
    en: "Search on YouTube",
    ar: "ابحث في يوتيوب",
  },
  "kai.resource.search_web": { en: "Search online", ar: "ابحث عبر الإنترنت" },

  "kai.celebration.core_title": {
    en: "CORE Compass complete!",
    ar: "اكتملت بوصلة CORE!",
  },
  "kai.celebration.core_subtitle": {
    en: "Your AI career profile just came online.",
    ar: "ملفك المهني بالذكاء الاصطناعي أصبح جاهزاً الآن.",
  },

  "kai.panel.actions_title": {
    en: "Today's suggested actions",
    ar: "مقترحات اليوم",
  },
  "kai.panel.actions_subtitle": {
    en: "Tap one to start — Kai's full conversation is coming soon.",
    ar: "اضغط على أحدها للبدء — محادثة كاي الكاملة قادمة قريباً.",
  },
  "kai.panel.action_coming_soon": {
    en: "Kai will walk you through this in a full conversation soon. For now, this is saved to revisit.",
    ar: "ستشرح لك كاي هذا في محادثة كاملة قريباً. في الوقت الحالي، تم حفظ هذا للعودة إليه.",
  },

  "kai.action.explain_results": { en: "Explain my result", ar: "اشرح نتيجتي" },
  "kai.action.find_majors": {
    en: "Find majors that fit me",
    ar: "ابحث عن تخصصات تناسبني",
  },
  "kai.action.compare_careers": {
    en: "Compare two careers",
    ar: "قارن بين مسارين مهنيين",
  },
  "kai.action.build_plan": { en: "Build a 7-day plan", ar: "ابنِ خطة 7 أيام" },
  "kai.action.explain_to_parents": {
    en: "Help me explain this to my parents",
    ar: "ساعدني في شرح هذا لأهلي",
  },
  "kai.action.challenge_result": {
    en: "Challenge my result",
    ar: "تحدَّ نتيجتي",
  },

  "kai.panel.grounding_title": { en: "Why this?", ar: "لماذا هذا؟" },
  "kai.panel.grounding_intro": { en: "Based on:", ar: "استناداً إلى:" },
  "kai.panel.grounding.primary_cluster": {
    en: "Primary cluster",
    ar: "المسار الأساسي",
  },
  "kai.panel.grounding.archetype": { en: "Archetype", ar: "النمط" },
  "kai.panel.grounding.reward_driver": {
    en: "Reward driver",
    ar: "محرّك التحفيز",
  },
  "kai.panel.grounding.ecosystem": { en: "Ecosystem", ar: "بيئة العمل" },
  "kai.panel.grounding.confidence": { en: "Confidence", ar: "نسبة الثقة" },

  "kai.panel.coming_soon_badge": { en: "Coming soon", ar: "قريباً" },
  "kai.panel.locked.action_plans.title": {
    en: "Action Plans",
    ar: "خطط العمل",
  },
  "kai.panel.locked.action_plans.body": {
    en: "Step-by-step plans built from your result — a 7-day starter, then longer roadmaps.",
    ar: "خطط تدريجية مبنية على نتيجتك — بداية 7 أيام، ثم خطط أطول.",
  },
  "kai.panel.locked.explore.title": {
    en: "Career Explore",
    ar: "استكشاف المسارات",
  },
  "kai.panel.locked.explore.body": {
    en: "Compare careers, majors, and paths side by side with Kai.",
    ar: "قارن بين المسارات المهنية والتخصصات جنباً إلى جنب مع كاي.",
  },
  "kai.panel.locked.deep_dive.title": {
    en: "Deep Dive Interview",
    ar: "مقابلة معمّقة",
  },
  "kai.panel.locked.deep_dive.body": {
    en: "A voiced, 1-on-1 conversation with Kai that goes deeper than your Compass alone.",
    ar: "محادثة صوتية فردية مع كاي تتعمّق أكثر من بوصلتك وحدها.",
  },

  // ---- Home tab (Overview) ----
  "home.overview.empty_title": {
    en: "Your compass lives here",
    ar: "بوصلتك تعيش هنا",
  },
  "home.overview.empty_description": {
    en: "Take the CORE Compass to unlock your personalized home — career directions, next steps, and a guide who knows how you're wired.",
    ar: "خض تقييم البوصلة الأساسي لفتح صفحتك الرئيسية الشخصية — اتجاهات مهنية، خطوات قادمة، ودليل يعرف كيف أنت مُكوَّن.",
  },
  "home.overview.greeting": { en: "Hello, {name}", ar: "أهلاً، {name}" },
  "home.overview.avatar_label": { en: "Your profile", ar: "ملفك الشخصي" },
  "home.overview.paths_title": {
    en: "Paths to explore",
    ar: "مسارات للاستكشاف",
  },
  "home.overview.paths_subtitle": {
    en: "Career families your profile may thrive in.",
    ar: "مجالات مهنية قد يزدهر فيها ملفك الشخصي.",
  },
  "home.overview.clusters_title": {
    en: "Your curiosity map",
    ar: "خريطة فضولك",
  },
  "home.overview.clusters_subtitle": {
    en: "The signals that make up your compass — strongest first.",
    ar: "الإشارات التي تُكوّن بوصلتك — الأقوى أولاً.",
  },

  // ---- Explore tab ----
  "home.explore.empty_title": {
    en: "Your map lives here",
    ar: "خريطتك تعيش هنا",
  },
  "home.explore.empty_description": {
    en: "Take the CORE Compass to unlock career families, majors, and the paths your profile points toward.",
    ar: "خض تقييم البوصلة الأساسي لفتح المجالات المهنية والتخصصات والمسارات التي يشير إليها ملفك الشخصي.",
  },
  "home.explore.title": { en: "Explore", ar: "استكشف" },
  "home.explore.subtitle": {
    en: "The full map your compass points toward.",
    ar: "الخريطة الكاملة التي تشير إليها بوصلتك.",
  },

  // ---- You tab ----
  "home.you.title": { en: "You", ar: "أنت" },
  "home.you.subtitle": {
    en: "Your journey, saved, and your account.",
    ar: "رحلتك، محفوظاتك، وحسابك.",
  },
  "home.you.stages_complete": {
    en: "{completed} of {total} stages complete",
    ar: "{completed} من {total} مراحل مكتملة",
  },
  "home.you.account_label": { en: "Account", ar: "الحساب" },
  "home.you.empty_title": {
    en: "Your journey lives here",
    ar: "رحلتك تعيش هنا",
  },
  "home.you.empty_description": {
    en: "Take the CORE Compass to start unlocking modules and save your progress.",
    ar: "خض تقييم البوصلة الأساسي لتبدأ بفتح الوحدات وحفظ تقدمك.",
  },
  "home.you.signin_title": {
    en: "Sign in to save your progress",
    ar: "سجّل الدخول لحفظ تقدمك",
  },
  "home.you.signin_body": {
    en: "Enter your email and we'll send a code. Your saved assessments and profile live with your account.",
    ar: "أدخل بريدك الإلكتروني وسنرسل لك رمزاً. تقييماتك المحفوظة وملفك الشخصي مرتبطان بحسابك.",
  },
  "home.you.new_here_prefix": { en: "New here? ", ar: "جديد هنا؟ " },
  "home.you.new_here_link": {
    en: "Take the CORE Compass",
    ar: "خض تقييم البوصلة الأساسي",
  },
  "home.you.new_here_suffix": {
    en: " to create your profile.",
    ar: " لإنشاء ملفك الشخصي.",
  },

  // ---- Home feed cards (lib/home/feed.ts) ----
  "home.feed.spotlight_eyebrow": {
    en: "Career spotlight",
    ar: "أضواء على مسار مهني",
  },
  "home.feed.see_day_in_life": {
    en: "See a day in the life",
    ar: "شاهد يوماً في الحياة",
  },
  "home.feed.unlock_footer": {
    en: "Unlocks as Tareeq rolls out — the more you complete, the more your compass reveals.",
    ar: "يُفتح مع نمو طريق — كلما أكملت أكثر، كشفت بوصلتك أكثر.",
  },
  "home.feed.ask_kai_eyebrow": { en: "Ask Kai", ar: "اسأل كاي" },
  "home.feed.ask_kai_title": {
    en: "Your guide knows your compass",
    ar: "دليلك يعرف بوصلتك",
  },
  "home.feed.ask_kai_subtitle": {
    en: "Based on your Compass",
    ar: "بناءً على بوصلتك",
  },
  "home.feed.ask_kai_focus": {
    en: "Your Compass points toward {paths}.",
    ar: "بوصلتك تشير نحو {paths}.",
  },
  "home.feed.ask_kai_action_continue": {
    en: "Continue exploring",
    ar: "واصل الاستكشاف",
  },
  "home.feed.ask_kai_action_parents": {
    en: "Explain this to my parents",
    ar: "اشرح هذا لوالديّ",
  },
  "home.feed.ask_kai_action_compare": {
    en: "Compare similar paths",
    ar: "قارن مسارات مشابهة",
  },
  "home.feed.ask_kai_prompt_continue": {
    en: "Let's keep exploring my Compass results.",
    ar: "لنواصل استكشاف نتائج بوصلتي.",
  },
  "home.feed.ask_kai_prompt_parents": {
    en: "Help me explain my Compass results to my parents.",
    ar: "ساعدني في شرح نتائج بوصلتي لوالديّ.",
  },
  "home.feed.ask_kai_prompt_compare": {
    en: "Compare some similar career paths for me.",
    ar: "قارن لي بعض المسارات المهنية المشابهة.",
  },

  "home.feed.spark.curiosity.eyebrow": {
    en: "Today's spark",
    ar: "لمحة اليوم",
  },
  "home.feed.spark.curiosity.title": {
    en: "Curiosity beats certainty.",
    ar: "الفضول يتفوق على اليقين.",
  },
  "home.feed.spark.curiosity.body": {
    en: "Only about 27% of graduates work in a field tied to their major. Your compass points toward {cluster} — but it's a direction to test, not a verdict.",
    ar: "حوالي 27% فقط من الخريجين يعملون في مجال مرتبط بتخصصهم. بوصلتك تشير إلى {cluster} — لكنه اتجاه لتجربته، لا حكماً نهائياً.",
  },
  "home.feed.spark.curiosity.source": {
    en: "Federal Reserve Bank of New York",
    ar: "بنك الاحتياطي الفيدرالي في نيويورك",
  },
  "home.feed.spark.reward.eyebrow": {
    en: "A nudge from Kai",
    ar: "دفعة من كاي",
  },
  "home.feed.spark.reward.title": {
    en: "Chase what rewards you.",
    ar: "اسعَ خلف ما يكافئك.",
  },
  "home.feed.spark.reward.body": {
    en: "Your strongest reward signal is {driver}. When a path looks shiny, ask one question first: would it actually give me that?",
    ar: "أقوى إشارة مكافأة لديك هي {driver}. عندما يبدو مسار ما جذاباً، اسأل سؤالاً واحداً أولاً: هل سيمنحني هذا فعلاً؟",
  },
  "home.feed.spark.region.eyebrow": { en: "Did you know?", ar: "هل تعلم؟" },
  "home.feed.spark.region.title": {
    en: "Your generation is building the region.",
    ar: "جيلك يبني المنطقة.",
  },
  "home.feed.spark.region.body": {
    en: "MENA will add about 127 million new workers by 2035. The paths you explore now help shape what work looks like here.",
    ar: "ستضيف منطقة الشرق الأوسط وشمال أفريقيا حوالي 127 مليون عامل جديد بحلول 2035. المسارات التي تستكشفها الآن تساعد في تشكيل ملامح العمل هنا.",
  },
  "home.feed.spark.region.source": {
    en: "World Bank, 2024",
    ar: "البنك الدولي، 2024",
  },
  "home.feed.spark.intersections.title": {
    en: "The best paths sit between fields.",
    ar: "أفضل المسارات تقع بين المجالات.",
  },
  "home.feed.spark.intersections.body": {
    en: "Some of the strongest careers blend {cluster} with something unexpected. Keep one eye on the intersections, not just the obvious lane.",
    ar: "بعض أقوى المسارات المهنية تمزج {cluster} بشيء غير متوقع. راقب نقاط التقاطع، لا المسار الواضح فقط.",
  },
  "home.feed.spark.softskills.title": {
    en: "Being human is a competitive edge.",
    ar: "أن تكون إنسانياً هو ميزة تنافسية.",
  },
  "home.feed.spark.softskills.body": {
    en: "Most young workers now say soft skills matter more in the age of AI. How you work with people is part of your compass too.",
    ar: "يقول معظم العاملين الشباب الآن إن المهارات الشخصية أصبحت أهم في عصر الذكاء الاصطناعي. طريقة تعاملك مع الناس جزء من بوصلتك أيضاً.",
  },
  "home.feed.spark.softskills.source": {
    en: "Deloitte Gen Z Survey 2025",
    ar: "استطلاع ديلويت لجيل Z، 2025",
  },

  "home.feed.step.watch_career.label": { en: "This week", ar: "هذا الأسبوع" },
  "home.feed.step.watch_career.title": {
    en: "See a day in the life of a {career}",
    ar: "شاهد يوماً في حياة {career}",
  },
  "home.feed.step.watch_career.body": {
    en: "Ten minutes of watching beats hours of guessing. Notice what looks fun — and what doesn't.",
    ar: "عشر دقائق من المشاهدة تُغني عن ساعات من التخمين. لاحظ ما يبدو ممتعاً — وما لا يبدو كذلك.",
  },
  "home.feed.step.watch_career.cta": {
    en: "Watch on YouTube",
    ar: "شاهد على يوتيوب",
  },
  "home.feed.step.research_major.title": {
    en: "Find out what studying {major} is really like",
    ar: "اكتشف كيف تبدو دراسة {major} فعلاً",
  },
  "home.feed.step.research_major.body": {
    en: "Modules, workload, what graduates actually do. Make the major concrete before it's a decision.",
    ar: "المواد، عبء الدراسة، وما يفعله الخريجون فعلاً. اجعل التخصص ملموساً قبل أن يصبح قراراً.",
  },
  "home.feed.step.research_major.cta": { en: "Look it up", ar: "ابحث عنه" },
  "home.feed.step.tiny_project.label": { en: "Try it", ar: "جرّبه" },
  "home.feed.step.tiny_project.title": {
    en: "Spend 30 minutes on a tiny {cluster} project",
    ar: "اقضِ 30 دقيقة في مشروع صغير في {cluster}",
  },
  "home.feed.step.tiny_project.body": {
    en: "Curiosity is a muscle. A small hands-on try tells you more than any quiz about whether this lane fits.",
    ar: "الفضول عضلة. تجربة عملية صغيرة تخبرك أكثر من أي اختبار عمّا إذا كان هذا المسار يناسبك.",
  },
  "home.feed.step.tiny_project.cta": {
    en: "Ask Kai for an idea",
    ar: "اسأل كاي عن فكرة",
  },
  "home.feed.step.ask_kai.label": { en: "Talk it through", ar: "ناقشها" },
  "home.feed.step.ask_kai.title": {
    en: "Stuck on where to start?",
    ar: "محتار من أين تبدأ؟",
  },
  "home.feed.step.ask_kai.body": {
    en: "Kai knows your compass. Ask how someone wired like you usually gets into {cluster}.",
    ar: "كاي تعرف بوصلتك. اسألها كيف يدخل شخص مُكوَّن مثلك عادةً إلى {cluster}.",
  },
  "home.feed.step.ask_kai.cta": { en: "Open Kai", ar: "افتح كاي" },

  "home.feed.spotlight.why": {
    en: "A {cluster} path that tends to reward {driver} — worth a closer look before you commit to a subject route.",
    ar: "مسار في {cluster} يميل إلى مكافأة {driver} — يستحق نظرة أقرب قبل الالتزام بمسار دراسي.",
  },

  "home.feed.insight.reward_eyebrow": {
    en: "Your reward signal",
    ar: "إشارة مكافأتك",
  },
  "home.feed.insight.reward_body": {
    en: "This is what makes a path worth staying with. Use it as a filter: does this {cluster} option actually feed it?",
    ar: "هذا ما يجعل المسار يستحق الاستمرار فيه. استخدمه كفلتر: هل يُغذّي هذا الخيار في {cluster} هذه الحاجة فعلاً؟",
  },
  "home.feed.insight.style_eyebrow": { en: "How you work", ar: "كيف تعمل" },
  "home.feed.insight.style_body": {
    en: "This is the rhythm that tends to feel natural to you day-to-day. Look for environments that match it, not fight it.",
    ar: "هذا هو الإيقاع الذي يبدو طبيعياً لك يومياً. ابحث عن بيئات تتماشى معه، لا تصارعه.",
  },
  "home.feed.insight.ecosystem_eyebrow": {
    en: "Where you thrive",
    ar: "أين تزدهر",
  },
  "home.feed.insight.ecosystem_body": {
    en: "Team shape, independence, and energy level. It's a quiet but powerful way to compare schools, internships, and first jobs.",
    ar: "شكل الفريق، الاستقلالية، ومستوى الطاقة. إنها طريقة هادئة لكنها قوية لمقارنة المدارس والتدريبات والوظائف الأولى.",
  },

  "home.feed.intersection.multi_curious": {
    en: "Your signals point between fields",
    ar: "إشاراتك تشير بين المجالات",
  },
  "home.feed.intersection.less_obvious": {
    en: "Less obvious paths worth a look",
    ar: "مسارات أقل وضوحاً تستحق نظرة",
  },

  // ---- Home hero / progress / tab bar / tiles ----
  "home.hero.eyebrow": { en: "Your compass points to", ar: "بوصلتك تشير إلى" },
  "home.hero.confidence": {
    en: "{label} signal · {percent}%",
    ar: "إشارة {label} · {percent}%",
  },
  "home.hero.view_report": { en: "View report", ar: "عرض التقرير" },
  "home.hero.view_report_aria": {
    en: "View your full report",
    ar: "عرض تقريرك الكامل",
  },

  "home.progress.stages": {
    en: "{completed} of {total} stages",
    ar: "{completed} من {total} مراحل",
  },
  "home.progress.next": { en: "Next: {module}", ar: "التالي: {module}" },

  "home.tab.overview": { en: "Overview", ar: "نظرة عامة" },
  "home.tab.kai": { en: "Kai", ar: "كاي" },
  "home.tab.nav_label": { en: "Primary", ar: "التنقل الرئيسي" },

  "home.placeholder.coming_soon_suffix": {
    en: " · Coming soon",
    ar: " · قريباً",
  },
  "home.placeholder.back_to_overview": {
    en: "Back to Overview",
    ar: "العودة إلى النظرة العامة",
  },

  "home.empty.start_cta": { en: "Start your compass", ar: "ابدأ بوصلتك" },

  "home.tile.career_path": { en: "Career path", ar: "مسار مهني" },
  "home.tile.day_in_life": { en: "Day in the life", ar: "يوم في الحياة" },

  // ---- Kai chat starter prompts (lib/kai/starter-prompts.ts) ----
  "kai.starters.explore_cluster": {
    en: "How do I get started exploring {cluster}?",
    ar: "كيف أبدأ باستكشاف {cluster}؟",
  },
  "kai.starters.career_day": {
    en: "What does a {career} actually do day-to-day?",
    ar: "ماذا يفعل {career} فعلاً يومياً؟",
  },
  "kai.starters.major_study": {
    en: "What's it like studying {major}?",
    ar: "كيف تبدو دراسة {major}؟",
  },

  // ---- Kai chat message blocks (components/kai/chat/*.tsx) ----
  "kai.chat.action_plan_fallback": { en: "Your plan", ar: "خطتك" },
  "kai.chat.comparing_label": { en: "Comparing", ar: "مقارنة" },

  // ---- Kai memory categories (lib/kai/memory/memory-view.ts) ----
  "kai.memory.category.career_interest": {
    en: "Career interests",
    ar: "اهتماماتك المهنية",
  },
  "kai.memory.category.learning_style": {
    en: "Preferred learning style",
    ar: "أسلوب التعلم المفضل",
  },
  "kai.memory.category.goal": { en: "Goals", ar: "الأهداف" },
  "kai.memory.category.question_topic": {
    en: "Questions asked about",
    ar: "أسئلة طرحتها عن",
  },
  "kai.memory.category.conversation_preference": {
    en: "Conversation preferences",
    ar: "تفضيلات المحادثة",
  },
  "kai.memory.category.assessment_history": {
    en: "Assessment history",
    ar: "سجل التقييمات",
  },
  "kai.memory.category.recommendation": {
    en: "Recent recommendations",
    ar: "توصيات حديثة",
  },

  // ---- Journey module names (lib/profile/journey.ts) — small, fixed set ----
  "journey.module.core_compass": { en: "CORE Compass", ar: "بوصلة CORE" },
  "journey.module.deep_dive": {
    en: "Deep Dive Interview",
    ar: "مقابلة معمّقة",
  },
  "journey.module.skills_audit": { en: "Skills Audit", ar: "تدقيق المهارات" },
  "journey.module.career_pulse": {
    en: "Career Pulse",
    ar: "نبض المسار المهني",
  },

  // ---- Email OTP sign-in (components/auth/OtpSignIn.tsx) ----
  "auth.otp.invalid_email": {
    en: "Enter a valid email address.",
    ar: "أدخل بريداً إلكترونياً صالحاً.",
  },
  "auth.otp.send_failed": {
    en: "Couldn't send the code. Please try again.",
    ar: "تعذّر إرسال الرمز. حاول مرة أخرى.",
  },
  "auth.otp.invalid_code_length": {
    en: "Enter the code from your email.",
    ar: "أدخل الرمز من بريدك الإلكتروني.",
  },
  "auth.otp.verify_failed": {
    en: "That code is invalid or has expired.",
    ar: "هذا الرمز غير صالح أو منتهي الصلاحية.",
  },
  "auth.otp.email_label": { en: "Email address", ar: "البريد الإلكتروني" },
  "auth.otp.sending": { en: "Sending…", ar: "جارٍ الإرسال…" },
  "auth.otp.send_cta": { en: "Email me a code", ar: "أرسل لي رمزاً" },
  "auth.otp.code_label": { en: "Verification code", ar: "رمز التحقق" },
  "auth.otp.code_sent_to": {
    en: "We emailed a code to {email}.",
    ar: "أرسلنا رمزاً إلى {email}.",
  },
  "auth.otp.verifying": { en: "Verifying…", ar: "جارٍ التحقق…" },
  "auth.otp.signin_cta": { en: "Sign in", ar: "تسجيل الدخول" },
  "auth.otp.use_different_email": {
    en: "Use a different email",
    ar: "استخدم بريداً إلكترونياً آخر",
  },

  // ---- Report: confidence tiers (lib/scoring/types.ts ConfidenceLabel) — 3 fixed values ----
  "report.confidence.high": { en: "High", ar: "مرتفعة" },
  "report.confidence.moderate": { en: "Moderate", ar: "متوسطة" },
  "report.confidence.low": { en: "Low", ar: "منخفضة" },

  // ---- Report: archetype names (lib/scoring/types.ts ArchetypeName) — 5 fixed values ----
  "report.archetype.precisionist": { en: "Precisionist", ar: "المتقن" },
  "report.archetype.coordinator": { en: "Coordinator", ar: "المنسّق" },
  "report.archetype.explorer": { en: "Explorer", ar: "المستكشف" },
  "report.archetype.catalyst": { en: "Catalyst", ar: "المحفّز" },
  "report.archetype.adaptive": { en: "Adaptive", ar: "المتكيّف" },

  // ---- Report: ecosystem fit names (lib/results/types.ts EcosystemFitName) — 4 fixed values ----
  "report.ecosystem.high_energy_team": {
    en: "High-Energy Team Player",
    ar: "لاعب فريق عالي الطاقة",
  },
  "report.ecosystem.structured_team": {
    en: "Structured Team Player",
    ar: "لاعب فريق منظّم",
  },
  "report.ecosystem.solo_sprinter": {
    en: "Solo Sprinter",
    ar: "منفرد سريع الانطلاق",
  },
  "report.ecosystem.solo_specialist": {
    en: "Solo Specialist",
    ar: "متخصص منفرد",
  },

  // ---- Report: reward driver names (lib/scoring/types.ts DriverCode) — 5 fixed values ----
  "report.driver.recognition": { en: "Recognition", ar: "التقدير" },
  "report.driver.impact": { en: "Impact", ar: "الأثر" },
  "report.driver.autonomy": { en: "Autonomy", ar: "الاستقلالية" },
  "report.driver.mastery": { en: "Mastery", ar: "الإتقان" },
  "report.driver.stability": { en: "Stability", ar: "الاستقرار" },

  // ---- Report: cluster labels + taglines (lib/results/cluster-visuals.ts) — 8 fixed clusters ----
  "report.cluster.tech.label": { en: "Technology", ar: "التقنية" },
  "report.cluster.tech.tagline": {
    en: "Building systems. Solving problems. Creating tools.",
    ar: "بناء الأنظمة. حل المشكلات. صناعة الأدوات.",
  },
  "report.cluster.eng.label": { en: "Engineering", ar: "الهندسة" },
  "report.cluster.eng.tagline": {
    en: "Designing structures. Testing ideas. Making things work.",
    ar: "تصميم الهياكل. اختبار الأفكار. جعل الأشياء تعمل.",
  },
  "report.cluster.sci.label": {
    en: "Science and Data",
    ar: "العلوم والبيانات",
  },
  "report.cluster.sci.tagline": {
    en: "Following evidence. Finding patterns. Explaining the unknown.",
    ar: "تتبّع الأدلة. اكتشاف الأنماط. تفسير المجهول.",
  },
  "report.cluster.art.label": { en: "Arts and Media", ar: "الفنون والإعلام" },
  "report.cluster.art.tagline": {
    en: "Shaping stories. Designing meaning. Moving people.",
    ar: "صياغة القصص. تصميم المعنى. التأثير في الناس.",
  },
  "report.cluster.bus.label": { en: "Business", ar: "الأعمال" },
  "report.cluster.bus.tagline": {
    en: "Reading markets. Building value. Creating momentum.",
    ar: "قراءة الأسواق. بناء القيمة. خلق الزخم.",
  },
  "report.cluster.law.label": {
    en: "Law and Diplomacy",
    ar: "القانون والدبلوماسية",
  },
  "report.cluster.law.tagline": {
    en: "Clarifying rules. Negotiating power. Protecting fairness.",
    ar: "توضيح القواعد. التفاوض على القوة. حماية العدالة.",
  },
  "report.cluster.ppl.label": {
    en: "People and Psychology",
    ar: "الناس وعلم النفس",
  },
  "report.cluster.ppl.tagline": {
    en: "Understanding people. Building trust. Helping systems heal.",
    ar: "فهم الناس. بناء الثقة. المساعدة على شفاء الأنظمة.",
  },
  "report.cluster.env.label": { en: "Environment", ar: "البيئة" },
  "report.cluster.env.tagline": {
    en: "Reading ecosystems. Protecting resources. Designing resilience.",
    ar: "قراءة الأنظمة البيئية. حماية الموارد. تصميم المرونة.",
  },

  // ---- Kai chat: new coaching-framework block types (components/kai/chat/*.tsx) ----
  "kai.chat.checklist_progress": {
    en: "{done} of {total} checked",
    ar: "{done} من {total} مكتمل",
  },
  "kai.chat.family_script_label": { en: "Say this", ar: "قل هذا" },
  "kai.chat.objection_label": { en: "They might say", ar: "قد يقولون" },
  "kai.chat.response_label": { en: "You can say", ar: "يمكنك أن تقول" },
  "kai.chat.reflection_eyebrow": {
    en: "A question worth sitting with",
    ar: "سؤال يستحق التفكير",
  },
  "kai.chat.recommendation_label": { en: "Recommendation", ar: "التوصية" },
  "kai.chat.action_plan_save": { en: "Save plan", ar: "احفظ الخطة" },
  "kai.chat.action_plan_start": { en: "Start plan", ar: "ابدأ الخطة" },
  "kai.chat.action_plan_saved": {
    en: "Saved to your plans",
    ar: "تم الحفظ في خططك",
  },
  "kai.chat.empty_conversation": {
    en: "Getting things ready — say hello, or ask Kai anything about your future.",
    ar: "نجهّز كل شيء — قل مرحباً، أو اسأل كاي عن أي شيء يخص مستقبلك.",
  },

  // ---- Kai plans screens (app/(app)/kai/plans/*) ----
  "kai.plans.title": { en: "Your plans", ar: "خططك" },
  "kai.plans.subtitle": {
    en: "Saved action plans from your conversations with Kai.",
    ar: "خطط العمل المحفوظة من محادثاتك مع كاي.",
  },
  "kai.plans.empty_title": { en: "No plans yet", ar: "لا توجد خطط بعد" },
  "kai.plans.empty_description": {
    en: "Ask Kai for a plan — like a 7-day study plan or your next steps — and save it here to track your progress.",
    ar: "اطلب من كاي خطة — مثل خطة دراسة لمدة 7 أيام أو خطواتك التالية — واحفظها هنا لتتبع تقدمك.",
  },
  "kai.plans.empty_cta": { en: "Talk to Kai", ar: "تحدث إلى كاي" },
  "kai.plans.progress": {
    en: "{completed} of {total} tasks",
    ar: "{completed} من {total} مهام",
  },
  "kai.plans.task_status.not_started": { en: "Not started", ar: "لم تبدأ" },
  "kai.plans.task_status.in_progress": { en: "In progress", ar: "قيد التنفيذ" },
  "kai.plans.task_status.completed": { en: "Completed", ar: "مكتملة" },
  "kai.plans.delete_plan": { en: "Delete plan", ar: "حذف الخطة" },
  "kai.plans.delete_confirm": {
    en: "Delete this plan? This can't be undone.",
    ar: "حذف هذه الخطة؟ لا يمكن التراجع عن هذا.",
  },
  "kai.plans.not_found": {
    en: "This plan no longer exists.",
    ar: "هذه الخطة لم تعد موجودة.",
  },

  // ---- Results screen (components/assessment/ResultsScreen.tsx) ----
  "results.hero.chip": { en: "Curiosity Compass", ar: "بوصلة الفضول" },
  "results.hero.badge": { en: "CORE v4", ar: "كور v4" },
  "results.hero.eyebrow": { en: "Curiosity signal", ar: "إشارة الفضول" },
  "results.hero.subtitle": {
    en: "Your answers point to a high curiosity for this territory. Use it as a direction to explore, not a final prescription.",
    ar: "تشير إجاباتك إلى فضول مرتفع تجاه هذا المجال. استخدمه كاتجاه للاستكشاف، لا كوصفة نهائية.",
  },
  "results.stat.signal_label": { en: "Signal", ar: "الإشارة" },
  "results.stat.signal_value": { en: "High curiosity", ar: "فضول مرتفع" },
  "results.stat.confidence_label": { en: "Confidence", ar: "مستوى الثقة" },
  "results.stat.style_label": { en: "Style", ar: "الأسلوب" },
  "results.stat.style_meta": { en: "Work mode", ar: "نمط العمل" },
  "results.kai_read.eyebrow": { en: "Kai’s read", ar: "قراءة كاي" },
  "results.kai_read.title": {
    en: "A direction to test, not a box to live inside.",
    ar: "اتجاه لتجربته، لا صندوق تعيش بداخله.",
  },
  "results.core.eyebrow": { en: "Tap each box", ar: "اضغط على كل مربع" },
  "results.core.title": {
    en: "What the four CORE signals mean",
    ar: "ماذا تعني إشارات CORE الأربع",
  },
  "results.core.curiosities_label": { en: "Curiosities", ar: "الفضول" },
  "results.core.curiosities_body": {
    en: "This is what keeps pulling your attention. It is why the compass starts with {cluster}, while the full score map below still shows every cluster signal.",
    ar: "هذا ما يستمر في جذب انتباهك. لهذا تبدأ البوصلة بـ{cluster}، بينما تُظهر خريطة النتائج الكاملة أدناه كل إشارات الفئات.",
  },
  "results.core.operations_label": { en: "Operations", ar: "طريقة العمل" },
  "results.core.operations_body": {
    en: "This describes how you tend to approach work: the pace, structure, and problem-solving rhythm that may make a path feel natural day to day.",
    ar: "هذا يصف الطريقة التي تميل بها للتعامل مع العمل: الوتيرة، والتنظيم، وإيقاع حل المشكلات الذي قد يجعل مساراً ما يبدو طبيعياً في حياتك اليومية.",
  },
  "results.core.rewards_label": { en: "Rewards", ar: "المكافآت" },
  "results.core.rewards_body": {
    en: "This is what makes a path worth staying with. Use it to judge whether a career only looks interesting, or actually gives you the reward you need to keep going.",
    ar: "هذا ما يجعل مساراً ما يستحق الاستمرار فيه. استخدمه للحكم على ما إذا كانت مهنة ما تبدو مثيرة للاهتمام فقط، أم أنها فعلاً تمنحك المكافأة التي تحتاجها لتستمر.",
  },
  "results.core.ecosystems_label": { en: "Ecosystems", ar: "بيئات العمل" },
  "results.core.ecosystems_body": {
    en: "This is the working environment signal: team shape, independence, predictability, and energy level. It helps you compare schools, internships, and first jobs.",
    ar: "هذه إشارة بيئة العمل: شكل الفريق، ومستوى الاستقلالية، وقابلية التوقع، ومستوى الطاقة. تساعدك على المقارنة بين المدارس والتدريبات والوظائف الأولى.",
  },
  "results.scores.eyebrow": {
    en: "Cluster score map",
    ar: "خريطة نقاط الفئات",
  },
  "results.scores.title": {
    en: "All 8 curiosity signals",
    ar: "كل إشارات الفضول الثماني",
  },
  "results.scores.badge": { en: "Scores", ar: "النتائج" },
  "results.scores.multi_curious": {
    en: "Multi-curious signal: {clusters}. Explore intersections before narrowing too early.",
    ar: "إشارة فضول متعدد: {clusters}. استكشف نقاط التقاطع قبل تضييق الخيارات مبكراً.",
  },
  "results.career.eyebrow": { en: "Career direction", ar: "الاتجاه المهني" },
  "results.career.title": {
    en: "Your profile may thrive in career families like…",
    ar: "قد يزدهر ملفك الشخصي في مسارات مهنية مثل…",
  },
  "results.career.explore_body": {
    en: "Explore what the work looks like before choosing the subject path.",
    ar: "استكشف كيف يبدو هذا العمل قبل اختيار المسار الدراسي.",
  },
  "results.career.day_in_life_link": {
    en: "Day in the life",
    ar: "يوم في الحياة",
  },
  "results.majors.title": {
    en: "Based on that, university majors to explore",
    ar: "بناءً على ذلك، تخصصات جامعية للاستكشاف",
  },
  "results.subjects.title": {
    en: "Then choose high-school subjects that keep those doors open",
    ar: "ثم اختر مواد ثانوية تُبقي هذه الأبواب مفتوحة",
  },
  "results.subject.priority_core": { en: "Core", ar: "أساسي" },
  "results.subject.priority_strong": { en: "Strong", ar: "قوي" },
  "results.subject.priority_useful": { en: "Useful", ar: "مفيد" },
  "results.section.landscape_title": {
    en: "Why these career families fit",
    ar: "لماذا تناسبك هذه المسارات المهنية",
  },
  "results.section.academic_title": {
    en: "How the study path connects",
    ar: "كيف يرتبط المسار الدراسي",
  },
  "results.section.non_obvious_title": {
    en: "Less obvious paths",
    ar: "مسارات أقل وضوحاً",
  },
  "results.section.non_obvious_taglist_title": {
    en: "These intersections can be surprisingly strong",
    ar: "قد تكون نقاط التقاطع هذه قوية بشكل مفاجئ",
  },
  "results.section.reality_title": { en: "Reality Check", ar: "فحص الواقع" },
  "results.video.watch_before_choosing": {
    en: "Watch before choosing",
    ar: "شاهد قبل الاختيار",
  },
  "results.section.integration_title": {
    en: "How your work style changes the path",
    ar: "كيف يُغيّر أسلوب عملك المسار",
  },
  "results.section.next_steps_title": {
    en: "Next Steps",
    ar: "الخطوات القادمة",
  },
  "results.action.share": { en: "Share result", ar: "شارك النتيجة" },
  "results.action.view_profile": {
    en: "View your profile",
    ar: "عرض ملفك الشخصي",
  },
  "results.action.save": { en: "Save", ar: "حفظ" },
  "results.action.parent_view": { en: "Parent view", ar: "عرض لولي الأمر" },
  "results.action.start_over": { en: "Start over", ar: "ابدأ من جديد" },
  "results.share.shared": { en: "Shared.", ar: "تمت المشاركة." },
  "results.share.copied": { en: "Summary copied.", ar: "تم نسخ الملخص." },
  "results.share.cancelled": {
    en: "Share cancelled.",
    ar: "تم إلغاء المشاركة.",
  },
  "results.share.text": {
    en: "My Tareeq answers point to high curiosity for {cluster}. Work style: {archetype}. Motivation: {driver}.",
    ar: "تشير إجاباتي في طريق إلى فضول مرتفع تجاه {cluster}. أسلوب العمل: {archetype}. الدافع: {driver}.",
  },
  "results.footer.generated_with": {
    en: "Generated with {model} using Tareeq’s scoring framework.",
    ar: "تم إنشاؤه باستخدام {model} ضمن إطار تقييم طريق.",
  },
  "results.footer.fallback": {
    en: "Built from Tareeq’s scoring framework. {reason}",
    ar: "تم إنشاؤه من إطار تقييم طريق. {reason}",
  },
  "results.video.day_in_life_label": {
    en: "Day in the life: {career}",
    ar: "يوم في الحياة: {career}",
  },
  "results.video.studying_label": {
    en: "What studying {major} is like",
    ar: "كيف تبدو دراسة {major}",
  },
  "results.video.less_obvious_label": {
    en: "Less obvious path: {path}",
    ar: "مسار أقل وضوحاً: {path}",
  },

  // ---- Contract screen (components/assessment/ContractScreen.tsx) ----
  "contract.eyebrow": { en: "Before we begin", ar: "قبل أن نبدأ" },
  "contract.headline_before": { en: "A quiet", ar: "" },
  "contract.headline_emphasis": { en: "contract", ar: "عقد" },
  "contract.headline_after": { en: ".", ar: " هادئ." },
  "contract.subtitle": {
    en: "Six small promises between us before the first question.",
    ar: "ست وعود صغيرة بيننا قبل السؤال الأول.",
  },
  "contract.item1.title": {
    en: "Energy over achievement",
    ar: "الطاقة قبل الإنجاز",
  },
  "contract.item1.body": {
    en: "Not what you’re good at in school — what makes time disappear.",
    ar: "ليس ما تُجيده في المدرسة — بل ما يجعل الوقت يتلاشى.",
  },
  "contract.item2.title": {
    en: "Curiosity, not distraction",
    ar: "الفضول، لا التشتت",
  },
  "contract.item2.body": {
    en: "Pick what ignites a question, not what steals an hour of scrolling.",
    ar: "اختر ما يشعل سؤالاً، لا ما يسرق ساعة من التمرير.",
  },
  "contract.item3.title": { en: "No wrong answers", ar: "لا إجابات خاطئة" },
  "contract.item3.body": {
    en: "Choosing “gaming” over “studying” tells us how your mind solves.",
    ar: "اختيار «الألعاب» على «الدراسة» يخبرنا كيف يحلّ عقلك المشكلات.",
  },
  "contract.item4.title": {
    en: "Intent beneath the habit",
    ar: "النية تحت العادة",
  },
  "contract.item4.body": {
    en: "We listen to the why behind your scroll, not the scroll itself.",
    ar: "نستمع إلى «لماذا» خلف تمريرك، لا إلى التمرير نفسه.",
  },
  "contract.item5.title": {
    en: "A cluster, not a job title",
    ar: "فئة، لا مسمى وظيفي",
  },
  "contract.item5.body": {
    en: "You won’t get “Accountant.” You’ll get a world where people like you thrive.",
    ar: "لن تحصل على «محاسب». ستحصل على عالم يزدهر فيه أشخاص مثلك.",
  },
  "contract.item6.title": {
    en: "A compass, not a GPS",
    ar: "بوصلة، لا نظام تحديد مواقع",
  },
  "contract.item6.body": {
    en: "We point the direction. The destination stays yours.",
    ar: "نحن نُشير إلى الاتجاه. الوجهة تبقى لك.",
  },
  "contract.cta": { en: "I agree, begin", ar: "أوافق، لنبدأ" },

  // ---- Assessment start screen (components/assessment/AssessmentStart.tsx) ----
  "start.eyebrow": { en: "A career compass", ar: "بوصلة مهنية" },
  "start.headline_line1": { en: "Find the work", ar: "اعثر على العمل" },
  "start.headline_line2_before": { en: "that’s been", ar: "الذي كان" },
  "start.headline_emphasis": { en: "waiting", ar: "بانتظارك" },
  "start.headline_after": { en: ".", ar: "." },
  "start.step1.title": { en: "Take the assessment", ar: "أكمل التقييم" },
  "start.step1.meta": { en: "12 min · 54 questions", ar: "12 د · 54 سؤالاً" },
  "start.step2.title": { en: "Meet your Compass", ar: "تعرّف على بوصلتك" },
  "start.step2.meta": {
    en: "Persona + four pillars",
    ar: "الشخصية + الركائز الأربع",
  },
  "start.step3.title": { en: "Walk with us", ar: "امشِ معنا" },
  "start.step3.meta": { en: "Mentors + community", ar: "مرشدون + مجتمع" },
  "start.resume_banner": {
    en: "On question {n} of {total}",
    ar: "عند السؤال {n} من {total}",
  },
  "start.resume_cta": { en: "Resume", ar: "استئناف" },
  "start.saved_banner": {
    en: "Your answers are saved.",
    ar: "تم حفظ إجاباتك.",
  },
  "start.begin_cta": { en: "Begin", ar: "ابدأ" },
  "start.resume_at_cta": { en: "Resume at {n}", ar: "استئناف عند {n}" },
  "start.start_over_cta": { en: "Start over", ar: "ابدأ من جديد" },
  "start.terms_checkbox": {
    en: "I agree to Tareeq’s platform terms and privacy notice. I can still choose separately whether my anonymized answers are used for research after the assessment.",
    ar: "أوافق على شروط منصة طريق وإشعار الخصوصية. يمكنني لاحقاً أن أختار بشكل منفصل ما إذا كانت إجاباتي المجهّلة تُستخدم في البحث بعد التقييم.",
  },
  "start.terms_error": {
    en: "Please accept Tareeq’s platform terms before starting.",
    ar: "يرجى الموافقة على شروط منصة طريق قبل البدء.",
  },
  "start.footer_note": {
    en: "~12 min · Free · Stays on your device",
    ar: "~12 د · مجاناً · يبقى على جهازك",
  },

  // ---- Registration screen (components/assessment/RegistrationScreen.tsx) ----
  "register.name_error": {
    en: "Enter the name you want on your Compass.",
    ar: "أدخل الاسم الذي تريده على بوصلتك.",
  },
  "register.email_error": {
    en: "Enter a valid email address.",
    ar: "أدخل بريداً إلكترونياً صالحاً.",
  },
  "register.send_error_fallback": {
    en: "Couldn’t send the code. Please try again.",
    ar: "تعذّر إرسال الرمز. حاول مرة أخرى.",
  },
  "register.resend_error_fallback": {
    en: "Couldn’t resend the code.",
    ar: "تعذّر إعادة إرسال الرمز.",
  },
  "register.code_length_error": {
    en: "Enter the code from your email.",
    ar: "أدخل الرمز من بريدك الإلكتروني.",
  },
  "register.verify_error_fallback": {
    en: "That code is invalid or has expired.",
    ar: "هذا الرمز غير صالح أو انتهت صلاحيته.",
  },
  "register.eyebrow": { en: "One more step", ar: "خطوة أخيرة" },
  "register.headline": { en: "Save your Compass.", ar: "احفظ بوصلتك." },
  "register.subtitle": {
    en: "Verify your email to save your Compass and build your final report. Your address is never included in the AI prompt.",
    ar: "تحقّق من بريدك الإلكتروني لحفظ بوصلتك وإنشاء تقريرك النهائي. لا يتم تضمين عنوان بريدك في طلب الذكاء الاصطناعي.",
  },
  "register.name_label": { en: "Name", ar: "الاسم" },
  "register.name_placeholder": { en: "Your name", ar: "اسمك" },
  "register.email_label": { en: "Email address", ar: "البريد الإلكتروني" },
  "register.consent_title": {
    en: "Optional research consent",
    ar: "موافقة بحثية اختيارية",
  },
  "register.consent_body": {
    en: "These are opt-in and unchecked by default. Declining will not change your result.",
    ar: "هذه خيارات اختيارية وغير مُفعّلة افتراضياً. رفضها لن يغيّر نتيجتك.",
  },
  "register.consent_minor_notice": {
    en: "Research opt-in is off because this response is marked under 18. You can still receive your Compass.",
    ar: "خيار المشاركة البحثية معطّل لأن هذه الإجابة مُصنّفة لأقل من 18 عاماً. ما زال بإمكانك الحصول على بوصلتك.",
  },
  "register.consent_general": {
    en: "Use my anonymized answers for CORE research.",
    ar: "استخدام إجاباتي المجهّلة في أبحاث CORE.",
  },
  "register.consent_followup": {
    en: "Contact me later to learn how my path is going.",
    ar: "التواصل معي لاحقاً لمعرفة كيف يسير مساري.",
  },
  "register.consent_university": {
    en: "Share anonymized insights with university partners.",
    ar: "مشاركة رؤى مجهّلة مع شركاء جامعيين.",
  },
  "register.sending": { en: "Sending…", ar: "جارٍ الإرسال…" },
  "register.send_code_cta": {
    en: "Send verification code",
    ar: "إرسال رمز التحقق",
  },
  "register.code_label": { en: "Verification code", ar: "رمز التحقق" },
  "register.code_sent_before": {
    en: "We emailed a code to",
    ar: "أرسلنا رمزاً إلى",
  },
  "register.code_sent_after": {
    en: "Enter it below to continue.",
    ar: "أدخله أدناه للمتابعة.",
  },
  "register.code_help": {
    en: "Can’t find it? Check your spam folder, or resend the code.",
    ar: "لم تجده؟ تحقق من مجلد الرسائل غير المرغوب فيها، أو أعد إرسال الرمز.",
  },
  "register.verifying": { en: "Verifying…", ar: "جارٍ التحقق…" },
  "register.verify_cta": { en: "Verify and analyze", ar: "تحقق وابدأ التحليل" },
  "register.edit_details_cta": { en: "Edit details", ar: "تعديل البيانات" },
  "register.resend_cta": { en: "Resend code", ar: "إعادة إرسال الرمز" },

  // ---- Assessment chrome header (components/assessment/AssessmentChrome.tsx) ----
  "chrome.compass_label": { en: "Compass", ar: "البوصلة" },
  "chrome.about_you": { en: "About you", ar: "عنك" },

  // ---- Analyzing screen (components/assessment/AnalyzingScreen.tsx) ----
  "analyzing.step1.title": {
    en: "Reviewing every answer",
    ar: "مراجعة كل إجابة",
  },
  "analyzing.step1.detail": {
    en: "Reading across the choices you made throughout the assessment.",
    ar: "نقرأ الاختيارات التي اتخذتها خلال التقييم.",
  },
  "analyzing.step2.title": {
    en: "Looking for repeated patterns",
    ar: "البحث عن الأنماط المتكررة",
  },
  "analyzing.step2.detail": {
    en: "Comparing what draws you in with how you prefer to work.",
    ar: "نقارن ما يجذب اهتمامك بالطريقة التي تفضّل العمل بها.",
  },
  "analyzing.step3.title": {
    en: "Connecting the signals",
    ar: "ربط الإشارات ببعضها",
  },
  "analyzing.step3.detail": {
    en: "Thinking through how your interests, motivations, and environment fit together.",
    ar: "نفكّر في كيفية تكامل اهتماماتك ودوافعك والبيئة المناسبة لك.",
  },
  "analyzing.step4.title": {
    en: "Building your personal report",
    ar: "بناء تقريرك الشخصي",
  },
  "analyzing.step4.detail": {
    en: "Turning those connections into clear, practical guidance.",
    ar: "نحوّل هذه الروابط إلى إرشادات واضحة وعملية.",
  },
  "analyzing.fallback_reason": {
    en: "Claude generation was interrupted.",
    ar: "تم مقاطعة إنشاء التقرير بواسطة Claude.",
  },
  "analyzing.status_ready": { en: "Report complete", ar: "اكتمل التقرير" },
  "analyzing.status_working": {
    en: "Working in the background",
    ar: "نعمل على تقريرك",
  },
  "analyzing.headline_working": {
    en: "We’re analyzing your answers.",
    ar: "نحلّل إجاباتك الآن.",
  },
  "analyzing.headline_ready": {
    en: "Your report is ready.",
    ar: "تقريرك أصبح جاهزاً.",
  },
  "analyzing.subtitle": {
    en: "We’re reading, comparing, and thinking through your responses before building your report.",
    ar: "نقرأ إجاباتك ونقارن بينها ونفكّر في دلالاتها قبل بناء تقريرك.",
  },
  "analyzing.subtitle_ready": {
    en: "We’ve finished connecting the patterns across your responses.",
    ar: "انتهينا من ربط الأنماط التي ظهرت في إجاباتك.",
  },
  "analyzing.ready_title": {
    en: "Analysis complete",
    ar: "اكتمل التحليل",
  },
  "analyzing.ready_detail": {
    en: "Your report is ready to open.",
    ar: "تقريرك جاهز للعرض.",
  },
  "analyzing.error_message": {
    en: "Claude was not available, so Tareeq will use the built-in guidance framework for this result.",
    ar: "لم يكن Claude متاحاً، لذا ستستخدم طريق إطار الإرشاد المدمج لهذه النتيجة.",
  },

  // Compass Constellation share card (components/results/CompassCard.tsx)
  "share_card.header_label": { en: "PATH REVEALED", ar: "تكشّف المسار" },
  "share_card.pillar.curiosity": { en: "CURIOSITY", ar: "الفضول" },
  "share_card.pillar.operations": { en: "OPERATIONS", ar: "العمل" },
  "share_card.pillar.rewards": { en: "REWARDS", ar: "الدافع" },
  "share_card.pillar.ecosystem": { en: "ECOSYSTEM", ar: "البيئة" },
  "share_card.eyebrow": {
    en: "{name}, YOUR PATH POINTS TO",
    ar: "يا {name}، طريقك يشير إلى",
  },
  "share_card.in_cluster": { en: "in {cluster}", ar: "في {cluster}" },
  "share_card.driven_by": { en: "Driven by {driver}", ar: "بدافع {driver}" },
  "share_card.footer": {
    en: "FIND YOUR TAREEQ ✦ tareeq.app",
    ar: "اكتشف طريقك ✦ tareeq.app",
  },

  // Share card modal (components/results/ShareCardModal.tsx)
  "share_card.modal.close_aria": { en: "Close", ar: "إغلاق" },
  "share_card.modal.share_cta": { en: "Share your compass", ar: "شارك بوصلتك" },
  "share_card.modal.preparing": {
    en: "Preparing image…",
    ar: "جارٍ تجهيز الصورة…",
  },
  "share_card.modal.shared_status": { en: "Shared!", ar: "تمت المشاركة!" },
  "share_card.modal.saved_status": {
    en: "Image saved and link copied.",
    ar: "تم حفظ الصورة ونسخ الرابط.",
  },
  "share_card.modal.error_status": {
    en: "Couldn't share right now. Try again.",
    ar: "تعذّرت المشاركة الآن. حاول مرة أخرى.",
  },
} as const satisfies Record<string, Entry>;

export type StringKey = keyof typeof STRINGS;

export function translate(locale: Locale, key: StringKey): string {
  const entry = STRINGS[key];
  return entry[locale] ?? entry.en ?? key;
}
