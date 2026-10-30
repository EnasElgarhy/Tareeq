import type { Locale } from "@/lib/i18n/locale";

/**
 * The science page: file 07, Part 2 (17 Oct package), plus "How we keep our
 * career list up to date" agreed on 28 Oct, placed after "Where the career
 * options come from". Arabic from the 28 Oct Arabic website text, section 6.
 * The reference list stays in English in both languages.
 */

export interface ScienceBlock {
  title: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
  builtOn?: string;
}

export interface ScienceSection {
  title: string;
  blocks: readonly ScienceBlock[];
}

export interface ScienceCopy {
  kicker: string;
  headline: string;
  line: string;
  note: string;
  sections: readonly ScienceSection[];
  referencesTitle: string;
}

const EN: ScienceCopy = {
  kicker: "The science",
  headline: "Built on research. Written for you.",
  line: "CORE draws on decades of research into how people choose careers. Here is what each part is built on, and why we made the choices we did, in plain words.",
  note: "CORE is an exploration and coaching tool, not a psychometric test. It helps you think and explore. It does not measure ability, and it does not decide for you.",
  referencesTitle: "References",
  sections: [
    {
      title: "The four parts",
      blocks: [
        {
          title: "Curiosities: built on the best-known theory of career interests",
          paragraphs: [
            "Psychologist John Holland showed that career interests fall into six broad types. Later research found that these types sit around a circle: neighbouring interests are related, and opposite ones pull apart. CORE’s eight curiosities follow that circle. We split the hands-on type into two, making things work and being active in the real world, because for young people these are usually different pulls.",
            "Each curiosity describes what draws you to an activity, not the activity itself. Four students in the same robotics club can be there for four different reasons.",
          ],
          builtOn: "Built on: Holland (1997); Prediger (1982); Rounds & Tracey (1993).",
        },
        {
          title: "Operating style: from research on how jobs are designed",
          paragraphs: [
            "Researchers who study work describe every job by the same features. Two of them are about the task itself: how much of it is set out for you, and whether it goes deep into one area or covers a range. CORE asks which way you lean, and uses it to show which jobs usually work that way.",
            "What we don’t claim: research has tested the idea that matching a person’s “style” to how they are taught improves results, and it doesn’t. So CORE doesn’t claim your operating style predicts where you will succeed. It is a way to compare options, and a question we are studying.",
          ],
          builtOn: "Built on: Morgeson & Humphrey (2006); Humphrey, Nahrgang & Morgeson (2007); Pashler et al. (2008).",
        },
        {
          title: "Rewards: from research on work values",
          paragraphs: [
            "Work values are what people want a career to give them, such as security, income, recognition or the chance to help others. Researchers have mapped these values for decades. CORE uses eight, including one we added for our region: a path your family is proud of. Whether it works as a separate value is one of the things we are studying.",
            "No value is better than another. Earning well, for example, is often about responsibility to family, not status.",
          ],
          builtOn:
            "Built on: Super (1970); Dawis & Lofquist (1984); Brown (2002); Fouad et al. (2010); Arab Youth Survey (ASDA'A BCW, 2016, 2023).",
        },
        {
          title: "Ecosystem: from research on person and environment",
          paragraphs: [
            "People tend to be more satisfied when what they want matches what their work environment offers. That evidence comes from adults already in jobs, so CORE doesn’t promise an outcome. It uses the idea to help you compare: whether you would work alongside others or on your own, and how much the setting changes from day to day.",
          ],
          builtOn: "Built on: Kristof-Brown, Zimmerman & Johnson (2005); Morgeson & Humphrey (2006).",
        },
      ],
    },
    {
      title: "How it works",
      blocks: [
        {
          title: "Why you choose instead of rate",
          paragraphs: [
            "When people rate options from 1 to 5, many things get a 5. CORE asks you to choose between options that all sound good, which shows what you put first. It also means your results compare your own options with each other, not you with other students. That is why the report has no scores or percentages.",
          ],
          builtOn: "Built on: Brown & Maydeu-Olivares (2011).",
        },
        {
          title: "Where the career options come from",
          paragraphs: [
            "Job families, example jobs and what each job usually involves come from O*NET, the US Department of Labor’s public database describing what occupations involve. The “often offers” lines use the same data on work values, together with international data on pay and on how respected occupations are. Jobs, pay and requirements can differ where you live.",
          ],
          builtOn:
            "Built on: O*NET 31.0 (National Center for O*NET Development); U.S. Bureau of Labor Statistics wage data (May 2025); Treiman (1977).",
        },
        {
          title: "How we keep our career list up to date",
          bullets: [
            "In 2026, the full list was checked against the World Economic Forum’s Future of Jobs Report 2025 and the International Labour Organization’s 2025 study of jobs affected by AI.",
            "Declining roles that aren’t relevant to the region were replaced.",
            "Roles that are changing carry a short note in your report.",
            "Kai can tell you about new roles that aren’t in the data yet, always described as emerging.",
            "The list is reviewed every year.",
          ],
        },
        {
          title: "Why a report and a coach, not a verdict",
          paragraphs: [
            "A major review of career guidance found five ingredients that make the biggest difference: written exercises, personal interpretation and feedback, information about the world of work, examples of people on different paths, and support from the people around you. CORE’s report and Kai are designed around them.",
            "Research also shows that results help more when they are talked through with the person rather than simply handed over. Kai uses a coaching approach called motivational interviewing: it asks questions, and you make the choices.",
          ],
          builtOn:
            "Built on: Brown & Ryan Krane (2000); Finn & Tonsager (1997); Hanson, Claiborn & Kerr (1997); Miller & Rollnick (2013).",
        },
        {
          title: "Why we keep doors open",
          paragraphs: [
            "Young people often rule out options early, based on what seems expected of them, before they have explored them. CORE shows several families and routes, and encourages exploring before narrowing. Decision research suggests a sequence: look broadly, explore a few options in depth, then choose. The report’s next steps follow it.",
          ],
          builtOn: "Built on: Gottfredson (1981); Gati, Krausz & Osipow (1996); Gati & Asher (2001).",
        },
      ],
    },
    {
      title: "Honest limits",
      blocks: [
        {
          title: "What CORE is, and isn’t",
          bullets: [
            "It describes your answers today, to help you explore.",
            "It isn’t a test of ability, intelligence or personality.",
            "It doesn’t predict success, grades or how happy you will be.",
            "It doesn’t compare you with other students.",
            "It doesn’t decide for you. The choice is always yours.",
          ],
        },
        {
          title: "How we check our work",
          paragraphs: [
            "Research is built into CORE from the start. With consent, we follow up with students to see whether their results stay steady over time and whether they found them useful. When the evidence says something should change, we change it.",
          ],
        },
      ],
    },
  ],
};

const AR: ScienceCopy = {
  kicker: "الأساس العلمي",
  headline: "مبني على الأبحاث. ومكتوب لك.",
  line: "يستند تقييم كور إلى عقود من الأبحاث حول كيفية اختيار الناس لمساراتهم المهنية. وفيما يلي الأساس الذي يقوم عليه كل جانب، وأسباب اختياراتنا، بكلمات بسيطة.",
  note: "تقييم كور أداة للاستكشاف والتوجيه، وليس اختبارًا نفسيًا قياسيًا. يساعدك على التفكير والاستكشاف، ولا يقيس القدرات، ولا يقرّر نيابةً عنك.",
  referencesTitle: "المراجع",
  sections: [
    {
      title: "الجوانب الأربعة",
      blocks: [
        {
          title: "ما يثير فضولك: مبني على أشهر نظرية في الاهتمامات المهنية",
          paragraphs: [
            "بيّن عالم النفس جون هولاند أن الاهتمامات المهنية تنقسم إلى ستة أنواع رئيسية. ووجدت أبحاث لاحقة أن هذه الأنواع تتوزّع على دائرة: الاهتمامات المتجاورة مترابطة، والمتقابلة متباعدة. وتتبع جوانب الفضول الثمانية في تقييم كور هذه الدائرة. وقد قسمنا النوع العملي إلى قسمين، صنع الأشياء وتشغيلها، والنشاط البدني في الميدان، لأنهما غالبًا ما يكونان دافعين مختلفين لدى الشباب.",
            "ويصف كل جانب من جوانب الفضول ما يجذبك إلى نشاط ما، لا النشاط نفسه. فأربعة طلاب في نادي الروبوتات نفسه قد يكونون هناك لأربعة أسباب مختلفة.",
          ],
          builtOn: "المراجع: هولاند (1997)؛ بريديغر (1982)؛ راوندز وتريسي (1993).",
        },
        {
          title: "طريقتك في العمل: من أبحاث تصميم الوظائف",
          paragraphs: [
            "يصف الباحثون في مجال العمل كل وظيفة بالخصائص نفسها، اثنتان منها تتعلّقان بالمهمة ذاتها: مقدار ما هو محدّد لك منها، وهل تتعمّق في مجال واحد أم تغطي نطاقًا واسعًا. ويسألك تقييم كور إلى أيّ جهة تميل، ويستخدم ذلك لإظهار المهن التي تُنجَز عادةً بهذه الطريقة.",
            "ما لا ندّعيه: اختبرت الأبحاث فكرة أن مواءمة «أسلوب» الشخص مع طريقة تعليمه تحسّن النتائج، ولم يثبت ذلك. لذلك لا يدّعي تقييم كور أن أسلوب عملك يتنبّأ بالمجال الذي ستنجح فيه، بل هو وسيلة للمقارنة بين الخيارات، وسؤال ما زلنا ندرسه.",
          ],
          builtOn: "المراجع: مورجيسون وهمفري (2006)؛ همفري وناغرانغ ومورجيسون (2007)؛ باشلر وزملاؤه (2008).",
        },
        {
          title: "ما يحفّزك: من أبحاث القيم المهنية",
          paragraphs: [
            "القيم المهنية هي ما يريده الناس من مسيرتهم المهنية، مثل الأمان والدخل والتقدير وفرصة مساعدة الآخرين. وقد رسم الباحثون خريطة هذه القيم على مدى عقود. ويستخدم تقييم كور ثمانية منها، بينها قيمة أضفناها لمنطقتنا: طريق تفخر به عائلتك. وما إذا كانت تعمل كقيمة مستقلة هو أحد الأمور التي ندرسها.",
            "لا قيمة أفضل من أخرى. فالدخل المرتفع، مثلًا، كثيرًا ما يكون مسؤولية تجاه العائلة لا سعيًا وراء المكانة.",
          ],
          builtOn:
            "المراجع: سوبر (1970)؛ داويس ولوفكويست (1984)؛ براون (2002)؛ فؤاد وزملاؤها (2010)؛ استطلاع أصداء بي سي دبليو لرأي الشباب العربي (2016، 2023).",
        },
        {
          title: "أجواء العمل: من أبحاث العلاقة بين الشخص وبيئة العمل",
          paragraphs: [
            "يميل الناس إلى الرضا أكثر حين يتّسق ما يريدونه مع ما توفّره بيئة عملهم. لكن هذه الأدلة مأخوذة من بالغين يعملون فعلًا، لذلك لا يعِد تقييم كور بنتيجة معيّنة، بل يستخدم الفكرة لمساعدتك على المقارنة: هل تفضّل العمل مع الآخرين أم بمفردك، وإلى أيّ مدى تتغيّر الأجواء من يوم لآخر.",
          ],
          builtOn: "المراجع: كريستوف-براون وزيمرمان وجونسون (2005)؛ مورجيسون وهمفري (2006).",
        },
      ],
    },
    {
      title: "كيف يعمل",
      blocks: [
        {
          title: "لماذا تختار بدل أن تقيّم",
          paragraphs: [
            "حين يقيّم الناس الخيارات من 1 إلى 5، يحصل كثير منها على 5. أما تقييم كور فيطلب منك الاختيار بين خيارات تبدو كلها جيدة، فيظهر ما تضعه أولًا. وهذا يعني أيضًا أن نتائجك تقارن خياراتك ببعضها، لا تقارنك بالطلاب الآخرين. ولهذا لا يتضمّن التقرير درجات أو نسبًا مئوية.",
          ],
          builtOn: "المراجع: براون وماييدو-أوليفاريس (2011).",
        },
        {
          title: "من أين تأتي الخيارات المهنية",
          paragraphs: [
            "تأتي مجموعات المهن وأمثلة المهن وما تتضمّنه كل مهنة عادةً من «أونت»، قاعدة البيانات العامة لوزارة العمل الأمريكية التي تصف طبيعة المهن. وتستخدم عبارات «يوفّر غالبًا» البيانات نفسها عن القيم المهنية، إلى جانب بيانات دولية عن الأجور ومدى تقدير المهن. وقد تختلف المهن والأجور والمتطلّبات في بلدك.",
          ],
          builtOn: "المراجع: أونت 31.0 (المركز الوطني لتطوير أونت)؛ مكتب إحصاءات العمل الأمريكي (مايو 2025)؛ تريمان (1977).",
        },
        {
          title: "كيف نُبقي قائمة المهن محدّثة",
          bullets: [
            "في عام 2026، رُوجعت القائمة كاملة مقارنةً بتقرير «مستقبل الوظائف 2025» الصادر عن المنتدى الاقتصادي العالمي، ودراسة منظمة العمل الدولية لعام 2025 عن الوظائف المتأثرة بالذكاء الاصطناعي.",
            "استُبدلت المهن المتراجعة التي لا تخصّ المنطقة.",
            "المهن التي تشهد تغيّرًا تحمل ملاحظة قصيرة في تقريرك.",
            "يمكن لكاي إخبارك عن مهن جديدة لم تدخل البيانات بعد، مع وصفها دائمًا بأنها مهن ناشئة.",
            "تُراجَع القائمة سنويًا.",
          ],
        },
        {
          title: "لماذا تقرير ومدرّب، لا حكم نهائي",
          paragraphs: [
            "وجدت مراجعة كبرى للتوجيه المهني خمسة عناصر تُحدث الفرق الأكبر: التمارين المكتوبة، والتفسير والتغذية الراجعة الشخصية، والمعلومات عن عالم العمل، ونماذج لأشخاص في مسارات مختلفة، ودعم المحيطين بك. وقد صُمّم تقرير كور وكاي حولها.",
            "وتُظهر الأبحاث أيضًا أن النتائج تكون أكثر فائدة حين تُناقَش مع الشخص بدل أن تُسلَّم إليه فحسب. ويستخدم كاي أسلوبًا في التوجيه يُسمّى المقابلة التحفيزية: يطرح الأسئلة، وأنت من يتّخذ القرارات.",
          ],
          builtOn: "المراجع: براون ورايان كرين (2000)؛ فين وتونساغر (1997)؛ هانسون وكليبورن وكير (1997)؛ ميلر ورولنيك (2013).",
        },
        {
          title: "لماذا نُبقي الأبواب مفتوحة",
          paragraphs: [
            "كثيرًا ما يستبعد الشباب خيارات مبكرًا بناءً على ما يبدو متوقّعًا منهم، قبل أن يستكشفوها. لذلك يعرض تقييم كور عدة مجموعات ومسارات، ويشجّع على الاستكشاف قبل التضييق. وتقترح أبحاث اتخاذ القرار تسلسلًا: النظر على نطاق واسع، ثم استكشاف عدد قليل من الخيارات بعمق، ثم الاختيار. وتتبع الخطوات التالية في التقرير هذا التسلسل.",
          ],
          builtOn: "المراجع: غوتفريدسون (1981)؛ غاتي وكراوس وأوسيبو (1996)؛ غاتي وآشر (2001).",
        },
      ],
    },
    {
      title: "حدود واضحة",
      blocks: [
        {
          title: "ما هو تقييم كور، وما ليس هو",
          bullets: [
            "يصف إجاباتك اليوم ليساعدك على الاستكشاف.",
            "ليس اختبارًا للقدرات أو الذكاء أو الشخصية.",
            "لا يتنبّأ بالنجاح أو الدرجات أو مدى رضاك مستقبلًا.",
            "لا يقارنك بالطلاب الآخرين.",
            "لا يقرّر نيابةً عنك؛ فالاختيار يبقى لك دائمًا.",
          ],
        },
        {
          title: "كيف نراجع عملنا",
          paragraphs: [
            "البحث جزء من تقييم كور منذ البداية. وبموافقة الطلاب، نتابع معهم لنعرف إن كانت نتائجهم ثابتة مع الوقت، وإن وجدوها مفيدة. وحين تشير الأدلة إلى ضرورة تغيير شيء، نغيّره.",
          ],
        },
      ],
    },
  ],
};

export const SCIENCE_COPY: Record<Locale, ScienceCopy> = { en: EN, ar: AR };

export const REFERENCES: readonly string[] = [
  "ASDA'A BCW. (2016; 2023). Arab Youth Survey (8th and 15th editions). ASDA'A BCW.",
  "Brown, A., & Maydeu-Olivares, A. (2011). Item response modeling of forced-choice questionnaires. Educational and Psychological Measurement, 71(3), 460–502.",
  "Brown, D. (2002). The role of work and cultural values in occupational choice, satisfaction, and success: A theoretical statement. Journal of Counseling & Development, 80(1), 48–56.",
  "Brown, S. D., & Ryan Krane, N. E. (2000). Four (or five) sessions and a cloud of dust: Old assumptions and new observations about career counseling. In S. D. Brown & R. W. Lent (Eds.), Handbook of counseling psychology (3rd ed., pp. 740–766). Wiley.",
  "Dawis, R. V., & Lofquist, L. H. (1984). A psychological theory of work adjustment. University of Minnesota Press.",
  "Finn, S. E., & Tonsager, M. E. (1997). Information-gathering and therapeutic models of assessment: Complementary paradigms. Psychological Assessment, 9(4), 374–385.",
  "Fouad, N. A., Cotter, E. W., Fitzpatrick, M. E., Kantamneni, N., Carter, L., & Bernfeld, S. (2010). Development and validation of the Family Influence Scale. Journal of Career Assessment, 18(3), 276–291.",
  "Gati, I., & Asher, I. (2001). The PIC model for career decision making: Prescreening, in-depth exploration, and choice. In F. T. L. Leong & A. Barak (Eds.), Contemporary models in vocational psychology (pp. 7–54). Erlbaum.",
  "Gati, I., Krausz, M., & Osipow, S. H. (1996). A taxonomy of difficulties in career decision making. Journal of Counseling Psychology, 43(4), 510–526.",
  "Gottfredson, L. S. (1981). Circumscription and compromise: A developmental theory of occupational aspirations. Journal of Counseling Psychology, 28(6), 545–579.",
  "Hanson, W. E., Claiborn, C. D., & Kerr, B. (1997). Differential effects of two test-interpretation styles in counseling: A field study. Journal of Counseling Psychology, 44(4), 400–405.",
  "Holland, J. L. (1997). Making vocational choices: A theory of vocational personalities and work environments (3rd ed.). Psychological Assessment Resources.",
  "Humphrey, S. E., Nahrgang, J. D., & Morgeson, F. P. (2007). Integrating motivational, social, and contextual work design features: A meta-analytic summary and theoretical extension of the work design literature. Journal of Applied Psychology, 92(5), 1332–1356.",
  "Kristof-Brown, A. L., Zimmerman, R. D., & Johnson, E. C. (2005). Consequences of individuals' fit at work: A meta-analysis of person–job, person–organization, person–group, and person–supervisor fit. Personnel Psychology, 58(2), 281–342.",
  "Miller, W. R., & Rollnick, S. (2013). Motivational interviewing: Helping people change (3rd ed.). Guilford Press.",
  "Morgeson, F. P., & Humphrey, S. E. (2006). The Work Design Questionnaire (WDQ): Developing and validating a comprehensive measure for assessing job design and the nature of work. Journal of Applied Psychology, 91(6), 1321–1339.",
  "National Center for O*NET Development. O*NET 31.0 Database. U.S. Department of Labor, Employment and Training Administration. Used under the CC BY 4.0 licence.",
  "Pashler, H., McDaniel, M., Rohrer, D., & Bjork, R. (2008). Learning styles: Concepts and evidence. Psychological Science in the Public Interest, 9(3), 105–119.",
  "Prediger, D. J. (1982). Dimensions underlying Holland's hexagon: Missing link between interests and occupations? Journal of Vocational Behavior, 21(3), 259–287.",
  "Rounds, J., & Tracey, T. J. (1993). Prediger's dimensional representation of Holland's RIASEC circumplex. Journal of Applied Psychology, 78(6), 875–890.",
  "Super, D. E. (1970). Manual for the Work Values Inventory. Riverside.",
  "Treiman, D. J. (1977). Occupational prestige in comparative perspective. Academic Press.",
  "U.S. Bureau of Labor Statistics. Occupational Employment and Wage Statistics, May 2025.",
];
