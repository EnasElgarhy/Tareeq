import type { CompassResult, Question } from "@/lib/scoring";
import type {
  EcosystemFitName,
  PersonalizedCompassReport,
  ResultSource,
} from "@/lib/results/types";
import type { ClusterCode, DriverCode } from "@/lib/scoring/types";
import { getLocalizedText } from "@/lib/assessment/questions";
import type { Locale } from "@/lib/i18n/locale";
import { translate } from "@/lib/i18n/strings";
import {
  getArchetypeKey,
  getDriverKey,
  getEcosystemFitKey,
} from "@/lib/results/report-labels";

type LocalizedClusterProfile = {
  name: string;
  essence: string;
  subjects: string[];
  majors: string[];
  careers: string[];
  nonObvious: string[];
  realityCheck: string;
  nextStep: string;
};

type ClusterProfile = Record<Locale, LocalizedClusterProfile>;

export const CLUSTER_PROFILES: Record<ClusterCode, ClusterProfile> = {
  TECH: {
    en: {
      name: "Technology",
      essence:
        "systems, code, digital infrastructure, and solving problems through software",
      subjects: [
        "Computer Science or IT",
        "Mathematics",
        "Further Maths if available",
        "Physics",
        "Design Technology",
      ],
      majors: [
        "Computer Science",
        "Software Engineering",
        "Data Science",
        "Artificial Intelligence",
        "Cybersecurity",
        "Information Systems",
        "Computer Engineering",
        "Applied Mathematics",
      ],
      careers: [
        "Software Engineer",
        "Data Engineer",
        "DevOps Engineer",
        "AI/ML Engineer",
        "Cybersecurity Analyst",
        "Systems Architect",
        "Technical Product Manager",
        "Site Reliability Engineer",
      ],
      nonObvious: [
        "Civic Tech",
        "Legal Tech",
        "HealthTech",
        "EdTech",
        "Climate Tech",
        "Computational Biology",
      ],
      realityCheck:
        "Technology changes fast. Continuous learning is non-negotiable, and some roles carry real burnout risk through on-call work, startup pressure, or constant tool churn.",
      nextStep:
        "Build one tiny digital thing this week: a calculator, a Notion automation, a personal website, or a script that saves you five minutes.",
    },
    ar: {
      name: "التقنية",
      essence: "الأنظمة والبرمجة والبنية التحتية الرقمية، وحل المشكلات عبر البرمجيات",
      subjects: [
        "علوم الحاسوب أو تقنية المعلومات",
        "الرياضيات",
        "الرياضيات المتقدمة إن توفرت",
        "الفيزياء",
        "تصميم التقنية",
      ],
      majors: [
        "علوم الحاسوب",
        "هندسة البرمجيات",
        "علم البيانات",
        "الذكاء الاصطناعي",
        "الأمن السيبراني",
        "نظم المعلومات",
        "هندسة الحاسوب",
        "الرياضيات التطبيقية",
      ],
      careers: [
        "مهندس برمجيات",
        "مهندس بيانات",
        "مهندس DevOps",
        "مهندس ذكاء اصطناعي / تعلم آلي",
        "محلل أمن سيبراني",
        "مهندس أنظمة",
        "مدير منتج تقني",
        "مهندس موثوقية الأنظمة",
      ],
      nonObvious: [
        "التقنية المدنية",
        "التقنية القانونية",
        "التقنية الصحية",
        "التقنية التعليمية",
        "تقنية المناخ",
        "الأحياء الحاسوبية",
      ],
      realityCheck:
        "التقنية تتغير بسرعة كبيرة. التعلّم المستمر ليس خيارًا، وبعض الأدوار تحمل خطر إرهاق حقيقيًا بسبب المناوبات أو ضغط الشركات الناشئة أو التبدّل المستمر في الأدوات.",
      nextStep:
        "ابنِ شيئًا رقميًا صغيرًا هذا الأسبوع: آلة حاسبة، أتمتة في Notion، موقعًا شخصيًا، أو سكربتًا يوفر عليك خمس دقائق.",
    },
  },
  ENG: {
    en: {
      name: "Engineering",
      essence:
        "designing, building, testing, and improving physical systems that have to work in the real world",
      subjects: [
        "Physics",
        "Mathematics",
        "Design Technology",
        "Engineering",
        "Chemistry",
      ],
      majors: [
        "Mechanical Engineering",
        "Civil Engineering",
        "Electrical Engineering",
        "Aerospace Engineering",
        "Robotics Engineering",
        "Biomedical Engineering",
        "Chemical Engineering",
        "Materials Science",
      ],
      careers: [
        "Mechanical Engineer",
        "Civil Engineer",
        "Robotics Engineer",
        "Aerospace Engineer",
        "Design Engineer",
        "Manufacturing Engineer",
        "Quality Assurance Engineer",
        "R&D Engineer",
      ],
      nonObvious: [
        "Patent Law",
        "Engineering Consulting",
        "Technical Sales",
        "Prosthetics Design",
        "Sustainability Engineering",
        "Forensic Engineering",
      ],
      realityCheck:
        "Engineering requires serious study and often professional certification. Early roles involve CAD modelling, testing, documentation, and constraints that make ideas harder than they looked on paper.",
      nextStep:
        "Take apart one everyday object in your head: a hinge, fan, bicycle, kettle, or lift. Sketch the parts and find out why each one exists.",
    },
    ar: {
      name: "الهندسة",
      essence: "تصميم وبناء واختبار وتحسين الأنظمة المادية التي يجب أن تعمل في العالم الحقيقي",
      subjects: ["الفيزياء", "الرياضيات", "تصميم التقنية", "الهندسة", "الكيمياء"],
      majors: [
        "الهندسة الميكانيكية",
        "الهندسة المدنية",
        "الهندسة الكهربائية",
        "هندسة الطيران والفضاء",
        "هندسة الروبوتات",
        "الهندسة الطبية الحيوية",
        "الهندسة الكيميائية",
        "علم المواد",
      ],
      careers: [
        "مهندس ميكانيكي",
        "مهندس مدني",
        "مهندس روبوتات",
        "مهندس طيران وفضاء",
        "مهندس تصميم",
        "مهندس تصنيع",
        "مهندس ضمان الجودة",
        "مهندس بحث وتطوير",
      ],
      nonObvious: [
        "قانون براءات الاختراع",
        "الاستشارات الهندسية",
        "المبيعات التقنية",
        "تصميم الأطراف الاصطناعية",
        "هندسة الاستدامة",
        "الهندسة الجنائية",
      ],
      realityCheck:
        "الهندسة تتطلب دراسة جادة وغالبًا ترخيصًا مهنيًا. الأدوار المبكرة تتضمن نمذجة CAD والاختبار والتوثيق، وقيودًا تجعل الأفكار أصعب مما بدت على الورق.",
      nextStep:
        "فكّك أحد الأشياء اليومية في ذهنك: مفصلة، مروحة، دراجة، غلاية، أو مصعد. ارسم الأجزاء واكتشف سبب وجود كل واحد منها.",
    },
  },
  SCI: {
    en: {
      name: "Science and Data",
      essence:
        "research, evidence, patterns, experiments, and understanding how complex systems behave",
      subjects: [
        "Biology",
        "Chemistry",
        "Physics",
        "Mathematics",
        "Statistics",
        "Computer Science",
      ],
      majors: [
        "Biology",
        "Chemistry",
        "Physics",
        "Biochemistry",
        "Neuroscience",
        "Data Science",
        "Environmental Science",
        "Genetics",
      ],
      careers: [
        "Research Scientist",
        "Data Scientist",
        "Lab Technician",
        "Clinical Research Coordinator",
        "Quantitative Analyst",
        "Epidemiologist",
        "Bioinformatics Specialist",
        "Environmental Scientist",
      ],
      nonObvious: [
        "Science Policy Advisor",
        "Technical Writer",
        "Forensic Scientist",
        "Pharmaceutical Researcher",
        "Science Journalism",
        "Quantitative Finance",
      ],
      realityCheck:
        "Research can be slow, repetitive, and competitive. Academic paths often require graduate study, while data roles expect strong statistics, coding, and evidence discipline.",
      nextStep:
        "Pick one claim you saw online this week and trace the evidence behind it. Find the original study, dataset, or source instead of stopping at the headline.",
    },
    ar: {
      name: "العلوم والبيانات",
      essence: "البحث والأدلة والأنماط والتجارب وفهم كيفية عمل الأنظمة المعقدة",
      subjects: ["الأحياء", "الكيمياء", "الفيزياء", "الرياضيات", "الإحصاء", "علوم الحاسوب"],
      majors: [
        "الأحياء",
        "الكيمياء",
        "الفيزياء",
        "الكيمياء الحيوية",
        "علم الأعصاب",
        "علم البيانات",
        "علوم البيئة",
        "علم الوراثة",
      ],
      careers: [
        "باحث علمي",
        "عالم بيانات",
        "فني مختبر",
        "منسق أبحاث سريرية",
        "محلل كمي",
        "أخصائي أوبئة",
        "أخصائي معلوماتية حيوية",
        "عالم بيئي",
      ],
      nonObvious: [
        "مستشار سياسات علمية",
        "كاتب تقني",
        "عالم أدلة جنائية",
        "باحث دوائي",
        "الصحافة العلمية",
        "التمويل الكمّي",
      ],
      realityCheck:
        "البحث العلمي قد يكون بطيئًا ومتكررًا وتنافسيًا. المسارات الأكاديمية غالبًا ما تتطلب دراسات عليا، بينما تتطلب أدوار البيانات مهارات قوية في الإحصاء والبرمجة والانضباط في التعامل مع الأدلة.",
      nextStep:
        "اختر ادعاءً رأيته على الإنترنت هذا الأسبوع وتتبّع الأدلة وراءه. ابحث عن الدراسة أو مجموعة البيانات أو المصدر الأصلي بدلًا من التوقف عند العنوان.",
    },
  },
  ART: {
    en: {
      name: "Arts and Media",
      essence:
        "storytelling, design, creative expression, communication, visual thinking, and narrative craft",
      subjects: [
        "Art or Visual Arts",
        "Design Technology",
        "Media Studies",
        "Film Studies",
        "English or Literature",
        "Drama",
        "Music",
      ],
      majors: [
        "Graphic Design",
        "Film and Television Production",
        "Journalism",
        "Creative Writing",
        "Fine Arts",
        "Digital Media",
        "Animation",
        "Photography",
      ],
      careers: [
        "Graphic Designer",
        "Film/Video Editor",
        "Copywriter",
        "Art Director",
        "UX/UI Designer",
        "Photographer",
        "Content Creator",
        "Journalist",
      ],
      nonObvious: [
        "UX Research",
        "Medical Illustration",
        "Science Communication",
        "Game Design",
        "Exhibition Curator",
        "Documentary Filmmaking",
      ],
      realityCheck:
        "Creative fields are competitive. A portfolio, network, and resilience matter as much as formal study, and early work is often freelance, contract-based, or inconsistent.",
      nextStep:
        "Make one finished piece this week and publish it somewhere small: a poster, short edit, essay, photo set, interface mockup, or explainer.",
    },
    ar: {
      name: "الفنون والإعلام",
      essence: "سرد القصص والتصميم والتعبير الإبداعي والتواصل والتفكير البصري والحرفية السردية",
      subjects: [
        "الفنون أو الفنون البصرية",
        "تصميم التقنية",
        "الدراسات الإعلامية",
        "دراسات السينما",
        "اللغة الإنجليزية أو الأدب",
        "الدراما",
        "الموسيقى",
      ],
      majors: [
        "التصميم الجرافيكي",
        "إنتاج الأفلام والتلفزيون",
        "الصحافة",
        "الكتابة الإبداعية",
        "الفنون الجميلة",
        "الإعلام الرقمي",
        "الرسوم المتحركة",
        "التصوير الفوتوغرافي",
      ],
      careers: [
        "مصمم جرافيك",
        "محرر أفلام وفيديو",
        "كاتب إعلاني",
        "مدير فني",
        "مصمم تجربة وواجهة مستخدم",
        "مصور فوتوغرافي",
        "صانع محتوى",
        "صحفي",
      ],
      nonObvious: [
        "بحوث تجربة المستخدم",
        "الرسم الطبي التوضيحي",
        "التواصل العلمي",
        "تصميم الألعاب",
        "أمين معرض",
        "صناعة الأفلام الوثائقية",
      ],
      realityCheck:
        "المجالات الإبداعية تنافسية جدًا. معرض الأعمال والشبكة المهنية والمرونة تهم بقدر الدراسة الرسمية، والعمل المبكر غالبًا ما يكون حرًا أو تعاقديًا أو غير منتظم.",
      nextStep:
        "أنجز عملًا واحدًا كاملًا هذا الأسبوع وانشره في مكان صغير: ملصق، مقطع قصير، مقالة، مجموعة صور، أو نموذج واجهة.",
    },
  },
  BUS: {
    en: {
      name: "Business",
      essence:
        "strategy, entrepreneurship, commerce, market dynamics, and practical problem-solving around money and operations",
      subjects: [
        "Mathematics",
        "Economics",
        "Business Studies",
        "Accounting",
        "Geography",
      ],
      majors: [
        "Business Administration",
        "Economics",
        "Finance",
        "Accounting",
        "Marketing",
        "Entrepreneurship",
        "International Business",
        "Supply Chain Management",
      ],
      careers: [
        "Business Analyst",
        "Marketing Manager",
        "Financial Analyst",
        "Product Manager",
        "Strategy Consultant",
        "Founder",
        "Sales Manager",
        "Operations Manager",
      ],
      nonObvious: [
        "Social Enterprise",
        "Business Development in Tech",
        "Impact Investing",
        "Sports Management",
        "Startup Operations",
        "E-commerce Strategy",
      ],
      realityCheck:
        "Business is broad. You need a specific skill stack: finance, marketing, operations, analytics, or sales. Entrepreneurship is unstable, and corporate roles can bring long hours and politics.",
      nextStep:
        "Choose one product you use every day and map how it makes money, finds customers, delivers value, and keeps costs under control.",
    },
    ar: {
      name: "الأعمال",
      essence:
        "الاستراتيجية وريادة الأعمال والتجارة وديناميكيات السوق وحل المشكلات العملية المتعلقة بالمال والعمليات",
      subjects: ["الرياضيات", "الاقتصاد", "دراسات الأعمال", "المحاسبة", "الجغرافيا"],
      majors: [
        "إدارة الأعمال",
        "الاقتصاد",
        "التمويل",
        "المحاسبة",
        "التسويق",
        "ريادة الأعمال",
        "الأعمال الدولية",
        "إدارة سلسلة التوريد",
      ],
      careers: [
        "محلل أعمال",
        "مدير تسويق",
        "محلل مالي",
        "مدير منتج",
        "مستشار استراتيجي",
        "مؤسس شركة",
        "مدير مبيعات",
        "مدير عمليات",
      ],
      nonObvious: [
        "المشاريع الاجتماعية",
        "تطوير الأعمال في التقنية",
        "الاستثمار ذو الأثر",
        "إدارة الرياضة",
        "عمليات الشركات الناشئة",
        "استراتيجية التجارة الإلكترونية",
      ],
      realityCheck:
        "مجال الأعمال واسع جدًا. تحتاج إلى مجموعة مهارات محددة: التمويل أو التسويق أو العمليات أو التحليل أو المبيعات. ريادة الأعمال غير مستقرة، والأدوار المؤسسية قد تحمل ساعات طويلة وسياسات داخلية.",
      nextStep:
        "اختر منتجًا تستخدمه يوميًا وارسم كيف يحقق الربح، ويجذب العملاء، ويقدّم القيمة، ويضبط التكاليف.",
    },
  },
  LAW: {
    en: {
      name: "Law and Diplomacy",
      essence:
        "governance, negotiation, policy, justice, international relations, and systems of rules",
      subjects: [
        "English or Literature",
        "History",
        "Government and Politics",
        "Economics",
        "Languages",
      ],
      majors: [
        "Law (LLB)",
        "Political Science",
        "International Relations",
        "Public Policy",
        "Criminology",
        "Philosophy, Politics and Economics",
        "Human Rights",
      ],
      careers: [
        "Lawyer",
        "Diplomat",
        "Policy Analyst",
        "Legal Consultant",
        "Paralegal",
        "International Relations Officer",
        "Human Rights Advocate",
        "Political Advisor",
      ],
      nonObvious: [
        "Corporate Compliance",
        "Legal Tech",
        "Mediation",
        "Immigration Law",
        "Sports Law",
        "Environmental Law",
        "NGO Policy Director",
      ],
      realityCheck:
        "Law requires extra professional qualifications after university. The field is competitive, seniority matters, and early roles can involve long hours, research, document review, and pressure.",
      nextStep:
        "Pick one public issue you care about and read two opposing arguments. Write the strongest case for each side before choosing where you stand.",
    },
    ar: {
      name: "القانون والدبلوماسية",
      essence: "الحوكمة والتفاوض والسياسات والعدالة والعلاقات الدولية وأنظمة القواعد",
      subjects: ["اللغة الإنجليزية أو الأدب", "التاريخ", "الحكومة والسياسة", "الاقتصاد", "اللغات"],
      majors: [
        "القانون (LLB)",
        "العلوم السياسية",
        "العلاقات الدولية",
        "السياسات العامة",
        "علم الجريمة",
        "الفلسفة والسياسة والاقتصاد",
        "حقوق الإنسان",
      ],
      careers: [
        "محامٍ",
        "دبلوماسي",
        "محلل سياسات",
        "مستشار قانوني",
        "مساعد قانوني",
        "موظف علاقات دولية",
        "مدافع عن حقوق الإنسان",
        "مستشار سياسي",
      ],
      nonObvious: [
        "الامتثال المؤسسي",
        "التقنية القانونية",
        "الوساطة",
        "قانون الهجرة",
        "القانون الرياضي",
        "القانون البيئي",
        "مدير سياسات في منظمة غير حكومية",
      ],
      realityCheck:
        "يتطلب القانون مؤهلات مهنية إضافية بعد الجامعة. المجال تنافسي، والأقدمية مهمة، والأدوار المبكرة قد تتضمن ساعات طويلة وبحثًا ومراجعة مستندات وضغطًا.",
      nextStep:
        "اختر قضية عامة تهمك واقرأ حجتين متعارضتين. اكتب أقوى حجة لكل جانب قبل أن تحدد موقفك.",
    },
  },
  PPL: {
    en: {
      name: "People and Psychology",
      essence:
        "human behaviour, wellbeing, education, community, interpersonal dynamics, and social systems",
      subjects: [
        "Psychology",
        "Biology",
        "Sociology",
        "English or Literature",
        "Philosophy",
      ],
      majors: [
        "Psychology",
        "Counselling",
        "Psychotherapy",
        "Social Work",
        "Human Resources",
        "Education",
        "Public Health",
        "Sociology",
      ],
      careers: [
        "Clinical Psychologist",
        "Counsellor",
        "Social Worker",
        "HR Manager",
        "Teacher",
        "Community Outreach Coordinator",
        "UX Researcher",
        "Organisational Development Consultant",
      ],
      nonObvious: [
        "User Experience Research",
        "Sports Psychology",
        "Forensic Psychology",
        "Market Research",
        "Employee Wellbeing",
        "Conflict Resolution",
      ],
      realityCheck:
        "Many psychology, counselling, and social work paths require graduate study and supervised hours. The work can be emotionally demanding, and boundaries are essential.",
      nextStep:
        "Interview one person about a decision they made recently. Ask what they wanted, what blocked them, and what helped. Listen for patterns, not advice.",
    },
    ar: {
      name: "الناس وعلم النفس",
      essence: "السلوك الإنساني والرفاهية والتعليم والمجتمع والديناميكيات الشخصية والأنظمة الاجتماعية",
      subjects: ["علم النفس", "الأحياء", "علم الاجتماع", "اللغة الإنجليزية أو الأدب", "الفلسفة"],
      majors: [
        "علم النفس",
        "الإرشاد النفسي",
        "العلاج النفسي",
        "العمل الاجتماعي",
        "الموارد البشرية",
        "التعليم",
        "الصحة العامة",
        "علم الاجتماع",
      ],
      careers: [
        "أخصائي نفسي إكلينيكي",
        "مرشد نفسي",
        "أخصائي اجتماعي",
        "مدير موارد بشرية",
        "معلم",
        "منسق توعية مجتمعية",
        "باحث تجربة مستخدم",
        "مستشار تطوير مؤسسي",
      ],
      nonObvious: [
        "بحوث تجربة المستخدم",
        "علم النفس الرياضي",
        "علم النفس الجنائي",
        "بحوث السوق",
        "رفاهية الموظفين",
        "حل النزاعات",
      ],
      realityCheck:
        "الكثير من مسارات علم النفس والإرشاد والعمل الاجتماعي تتطلب دراسات عليا وساعات تدريب تحت إشراف. العمل قد يكون مرهقًا عاطفيًا، ووضع الحدود أمر أساسي.",
      nextStep:
        "أجرِ مقابلة مع شخص حول قرار اتخذه مؤخرًا. اسأله عمّا أراده، وما الذي عرقله، وما الذي ساعده. استمع للأنماط لا للنصائح.",
    },
  },
  ENV: {
    en: {
      name: "Environment",
      essence:
        "ecology, sustainability, natural systems, conservation, climate, and planetary health",
      subjects: [
        "Biology",
        "Geography",
        "Chemistry",
        "Environmental Science",
        "Mathematics",
      ],
      majors: [
        "Environmental Science",
        "Ecology",
        "Conservation Biology",
        "Environmental Engineering",
        "Sustainability Studies",
        "Marine Biology",
        "Forestry",
        "Climate Science",
      ],
      careers: [
        "Environmental Consultant",
        "Conservation Scientist",
        "Marine Biologist",
        "Sustainability Coordinator",
        "Environmental Engineer",
        "Wildlife Biologist",
        "Climate Data Analyst",
        "Park Ranger",
      ],
      nonObvious: [
        "Corporate Sustainability",
        "Environmental Law",
        "Green Architecture",
        "Climate Finance",
        "Renewable Energy",
        "Environmental Journalism",
      ],
      realityCheck:
        "Environmental careers can involve fieldwork, lower-paying nonprofit roles, slow policy change, and emotional fatigue. Corporate sustainability pays more but can be further from direct ecological work.",
      nextStep:
        "Choose one local environmental issue and trace the system around it: who causes it, who pays the cost, who regulates it, and who is already working on it.",
    },
    ar: {
      name: "البيئة",
      essence: "علم البيئة والاستدامة والأنظمة الطبيعية والحفاظ على البيئة والمناخ وصحة الكوكب",
      subjects: ["الأحياء", "الجغرافيا", "الكيمياء", "علوم البيئة", "الرياضيات"],
      majors: [
        "علوم البيئة",
        "علم البيئة",
        "علم الأحياء لحفظ الطبيعة",
        "الهندسة البيئية",
        "دراسات الاستدامة",
        "الأحياء البحرية",
        "علوم الغابات",
        "علوم المناخ",
      ],
      careers: [
        "مستشار بيئي",
        "عالم حفظ بيئي",
        "عالم أحياء بحرية",
        "منسق استدامة",
        "مهندس بيئي",
        "عالم أحياء برية",
        "محلل بيانات مناخية",
        "حارس منتزه",
      ],
      nonObvious: [
        "الاستدامة المؤسسية",
        "القانون البيئي",
        "العمارة الخضراء",
        "تمويل المناخ",
        "الطاقة المتجددة",
        "الصحافة البيئية",
      ],
      realityCheck:
        "المهن البيئية قد تتضمن عملًا ميدانيًا وأدوارًا غير ربحية أقل أجرًا وتغييرًا بطيئًا في السياسات وإرهاقًا عاطفيًا. الاستدامة المؤسسية تدفع أكثر لكن قد تكون أبعد عن العمل البيئي المباشر.",
      nextStep:
        "اختر قضية بيئية محلية واحدة وتتبّع النظام المحيط بها: من يسببها، ومن يدفع ثمنها، ومن ينظّمها، ومن يعمل عليها بالفعل.",
    },
  },
};

/** Localized cluster content, selected by locale. */
export function getClusterProfile(
  code: ClusterCode,
  locale: Locale,
): LocalizedClusterProfile {
  return CLUSTER_PROFILES[code][locale];
}

const DRIVER_COPY: Record<DriverCode, { en: string; ar: string }> = {
  REC: {
    en: "look for roles where good work becomes visible: leadership, public-facing output, published work, awards, or clear ownership",
    ar: "ابحث عن أدوار يصبح فيها العمل الجيد مرئيًا: القيادة، الظهور أمام الجمهور، الأعمال المنشورة، الجوائز، أو الملكية الواضحة",
  },
  IMP: {
    en: "look for work where you can see who benefits and how the outcome changes someone’s day",
    ar: "ابحث عن عمل يمكنك فيه رؤية من يستفيد وكيف تتغير حياته اليومية بفضل النتيجة",
  },
  AUT: {
    en: "look for paths with ownership, remote work, freelancing potential, or small teams where you control the shape of the work",
    ar: "ابحث عن مسارات فيها ملكية، أو عمل عن بُعد، أو إمكانية العمل الحر، أو فرق صغيرة تتحكم فيها بشكل العمل",
  },
  MAS: {
    en: "look for deep technical tracks, specialisation, expert mentors, and work that keeps raising the bar",
    ar: "ابحث عن مسارات تقنية عميقة، وتخصص، ومرشدين خبراء، وعمل يستمر في رفع السقف",
  },
  STA: {
    en: "look for clear career ladders, regulated industries, government paths, or organisations with predictable income and progression",
    ar: "ابحث عن سلالم وظيفية واضحة، أو صناعات منظمة، أو مسارات حكومية، أو مؤسسات ذات دخل وتقدم يمكن التنبؤ بهما",
  },
};

const ARCHETYPE_COPY: Record<
  CompassResult["archetype"],
  { en: string; ar: string }
> = {
  Precisionist: {
    en: "You work best when the craft is clear, the standards are high, and depth matters.",
    ar: "تعمل بأفضل شكل عندما تكون الحرفة واضحة، والمعايير عالية، والعمق مهم.",
  },
  Coordinator: {
    en: "You work best when you can organise moving parts, create structure, and keep complex work calm.",
    ar: "تعمل بأفضل شكل عندما يمكنك تنظيم الأجزاء المتحركة، وخلق البنية، وإبقاء العمل المعقد هادئًا.",
  },
  Explorer: {
    en: "You work best when you can learn by doing, investigate, prototype, and go deep through direct contact with the problem.",
    ar: "تعمل بأفضل شكل عندما تتعلم بالممارسة، وتستكشف، وتجرّب، وتتعمق عبر التواصل المباشر مع المشكلة.",
  },
  Catalyst: {
    en: "You work best when you can connect ideas quickly, move across domains, and create momentum with other people.",
    ar: "تعمل بأفضل شكل عندما تربط الأفكار بسرعة، وتتنقل بين المجالات، وتخلق زخمًا مع الآخرين.",
  },
  Adaptive: {
    en: "You shift between structure and flexibility depending on the context, so test environments before committing to one work style.",
    ar: "تتنقل بين البنية والمرونة حسب السياق، لذا اختبر البيئات قبل الالتزام بأسلوب عمل واحد.",
  },
};

export function getEcosystemFit(result: CompassResult): EcosystemFitName {
  if (result.ecosystemFit) return result.ecosystemFit;

  const social =
    result.axes.social.collaborative >= result.axes.social.independent
      ? "COL"
      : "IND";
  const environment =
    result.axes.environment.dynamic >= result.axes.environment.predictable
      ? "DYN"
      : "PRE";

  if (social === "COL" && environment === "DYN")
    return "High-Energy Team Player";
  if (social === "COL" && environment === "PRE")
    return "Structured Team Player";
  if (social === "IND" && environment === "DYN") return "Solo Sprinter";
  return "Solo Specialist";
}

export function getMultiCuriousClusters(result: CompassResult) {
  if (result.multiCuriousClusters?.length) return result.multiCuriousClusters;

  const topScore = result.clusterRanked[0]?.[1] ?? 0;
  const close = result.clusterRanked.filter(
    ([, score]) => topScore - score <= 1,
  );
  return close.length >= 3 ? close.slice(0, 3).map(([code]) => code) : [];
}

export function createAnswerDigest(
  answers: Record<string, string>,
  questions: Question[],
) {
  return questions
    .filter((question) => answers[question.externalId])
    .map((question) => {
      const value = answers[question.externalId];
      const option = question.options.find((entry) => entry.letter === value);

      return {
        id: question.externalId,
        pillar: question.pillar,
        question: getLocalizedText(question.title),
        answer: option ? getLocalizedText(option.text) : value,
      };
    });
}

export function buildFallbackReport({
  result,
  name,
  source = "fallback",
  fallbackReason,
  model,
  locale = "en",
}: {
  result: CompassResult;
  name?: string;
  source?: ResultSource;
  fallbackReason?: string;
  model?: string;
  locale?: Locale;
}): PersonalizedCompassReport {
  const cluster = getClusterProfile(result.topCluster, locale);
  const firstName = name?.trim().split(/\s+/)[0];
  const listSeparator = locale === "ar" ? "، " : ", ";
  const driverDisplayName = (code: DriverCode) =>
    translate(locale, getDriverKey(code));
  const balancedMotivations =
    locale === "ar" ? "دوافع متوازنة" : "Balanced motivations";
  const driverName =
    result.primaryDrivers.length > 0
      ? result.primaryDrivers.map(driverDisplayName).join(listSeparator)
      : balancedMotivations;
  const secondaryDriverName =
    result.secondaryDrivers.length > 0
      ? result.secondaryDrivers.map(driverDisplayName).join(listSeparator)
      : driverDisplayName(result.secondaryDriver);
  const ecosystemFit = getEcosystemFit(result);
  const ecosystemFitDisplay = translate(locale, getEcosystemFitKey(ecosystemFit));
  const archetypeDisplay = translate(locale, getArchetypeKey(result.archetype));
  const multiCuriousCodes = getMultiCuriousClusters(result);
  const isMultiCurious = multiCuriousCodes.length >= 3;
  const multiCuriousClusters = multiCuriousCodes.map(
    (code) => getClusterProfile(code, locale).name,
  );

  const primaryDriverCopy =
    result.primaryDrivers.length > 0
      ? DRIVER_COPY[result.primaryDriver][locale]
      : "";

  const narrativeInput: NarrativeInput = {
    firstName,
    cluster,
    isMultiCurious,
    multiCuriousClusters,
    listSeparator,
    archetype: result.archetype,
    archetypeDisplay,
    driverName,
    secondaryDriverName,
    hasPrimaryDrivers: result.primaryDrivers.length > 0,
    primaryDriverCopy,
    ecosystemFitDisplay,
  };
  const narrative =
    locale === "ar"
      ? buildArabicNarrative(narrativeInput)
      : buildEnglishNarrative(narrativeInput);

  return {
    generatedAt: new Date().toISOString(),
    source,
    model,
    fallbackReason,
    clusterCode: result.topCluster,
    clusterName: cluster.name,
    isMultiCurious,
    multiCuriousClusters,
    archetype: result.archetype,
    primaryDriver: driverName,
    secondaryDriver: secondaryDriverName,
    ecosystemFit,
    ...narrative,
    highSchoolSubjects: cluster.subjects,
    universityMajors: cluster.majors,
    careerExamples: cluster.careers,
    nonObviousPaths: cluster.nonObvious,
    score: result,
  };
}

type NarrativeInput = {
  firstName: string | undefined;
  cluster: LocalizedClusterProfile;
  isMultiCurious: boolean;
  multiCuriousClusters: string[];
  listSeparator: string;
  archetype: CompassResult["archetype"];
  archetypeDisplay: string;
  driverName: string;
  secondaryDriverName: string;
  hasPrimaryDrivers: boolean;
  primaryDriverCopy: string;
  ecosystemFitDisplay: string;
};

type Narrative = {
  headline: string;
  summary: string;
  academicPath: string;
  careerLandscape: string;
  integration: string;
  realityCheck: string;
  nextSteps: string;
};

function buildEnglishNarrative({
  firstName,
  cluster,
  isMultiCurious,
  multiCuriousClusters,
  listSeparator,
  archetype,
  archetypeDisplay,
  driverName,
  secondaryDriverName,
  hasPrimaryDrivers,
  primaryDriverCopy,
  ecosystemFitDisplay,
}: NarrativeInput): Narrative {
  const greeting = firstName ? `${firstName}, your` : "Your";
  const motivationSentence = hasPrimaryDrivers
    ? `You are primarily motivated by ${driverName}, with ${secondaryDriverName} also showing up strongly, so ${primaryDriverCopy}.`
    : "Your motivations look balanced, so context matters: judge opportunities by the team, mission, learning curve, and stability together.";

  const headline = isMultiCurious
    ? "Your curiosity compass points toward intersections"
    : `Your answers point to high curiosity for ${cluster.name}`;

  const summary = isMultiCurious
    ? `${greeting} curiosities span ${multiCuriousClusters.join(
        listSeparator,
      )}. This is not confusion; it is a signal to explore intersections where multiple fields meet.`
    : `${greeting} answers point to a high curiosity for ${cluster.essence}. This is a direction to explore, not a box to live inside.`;

  return {
    headline,
    summary,
    academicPath: `Because these career families reward ${cluster.essence}, university programs worth exploring include ${cluster.majors
      .slice(0, 5)
      .join(
        listSeparator,
      )}. To keep those doors open in high school, prioritise ${cluster.subjects
      .slice(0, 5)
      .join(
        listSeparator,
      )}. If your school uses A-Levels, Tawjihi, IB, or another track, choose the version of those subjects that gives you the strongest foundation.`,
    careerLandscape: `Your profile may thrive in career families such as ${cluster.careers
      .slice(0, 5)
      .join(
        listSeparator,
      )}. As you build skill, the path can widen into specialist, leadership, consulting, or founder tracks. Do not ignore the less obvious routes: ${cluster.nonObvious
      .slice(0, 5)
      .join(
        listSeparator,
      )}. Those intersections are often where young people find sharper opportunities than the obvious job titles.`,
    integration: `Your operational style is ${archetypeDisplay}. ${
      ARCHETYPE_COPY[archetype].en
    } ${motivationSentence} Your strongest environment signal is ${ecosystemFitDisplay}; use that when judging schools, internships, teams, and first jobs.`,
    realityCheck: `${cluster.realityCheck} Because ${driverName} is a strong reward driver for you, pay attention to whether a path actually provides that reward day to day, not just in the brochure. Before choosing, watch a few “day in the life” videos for ${cluster.careers
      .slice(0, 2)
      .join(" and ")} so you see the routine, not only the title.`,
    nextSteps: `This week: ${cluster.nextStep} This term: speak to one student, graduate, or working professional already close to this field. This year: build proof. A small project, portfolio piece, experiment, volunteer role, or shadowing day will teach you more than another hour of guessing.`,
  };
}

function buildArabicNarrative({
  firstName,
  cluster,
  isMultiCurious,
  multiCuriousClusters,
  listSeparator,
  archetype,
  archetypeDisplay,
  driverName,
  secondaryDriverName,
  hasPrimaryDrivers,
  primaryDriverCopy,
  ecosystemFitDisplay,
}: NarrativeInput): Narrative {
  const possessive = firstName ? `إجابات ${firstName}` : "إجاباتك";
  const curiosityPossessive = firstName ? `فضول ${firstName}` : "فضولك";
  const motivationSentence = hasPrimaryDrivers
    ? `أنت مدفوع بشكل أساسي بـ${driverName}، مع ظهور ${secondaryDriverName} بقوة أيضًا، لذا ${primaryDriverCopy}.`
    : "دوافعك تبدو متوازنة، لذا يهم السياق: قيّم الفرص من خلال الفريق والمهمة ومنحنى التعلم والاستقرار معًا.";

  const headline = isMultiCurious
    ? "بوصلة فضولك تشير إلى نقاط التقاطع"
    : `إجاباتك تشير إلى فضول عالٍ تجاه ${cluster.name}`;

  const summary = isMultiCurious
    ? `${curiosityPossessive} يمتد عبر ${multiCuriousClusters.join(
        listSeparator,
      )}. هذا ليس ارتباكًا، بل إشارة لاستكشاف نقاط التقاطع حيث تلتقي عدة مجالات.`
    : `${possessive} تشير إلى فضول عالٍ تجاه ${cluster.essence}. هذا اتجاه لاستكشافه، لا صندوق للعيش بداخله.`;

  return {
    headline,
    summary,
    academicPath: `بما أن هذه المسارات المهنية تكافئ ${cluster.essence}، فإن التخصصات الجامعية الجديرة بالاستكشاف تشمل ${cluster.majors
      .slice(0, 5)
      .join(
        listSeparator,
      )}. للحفاظ على هذه الأبواب مفتوحة في المرحلة الثانوية، أعطِ الأولوية لمواد مثل ${cluster.subjects
      .slice(0, 5)
      .join(
        listSeparator,
      )}. إذا كانت مدرستك تعتمد نظام الثانوية العامة أو التوجيهي أو البكالوريا الدولية أو أي نظام آخر، اختر نسخة هذه المواد التي تمنحك أقوى أساس.`,
    careerLandscape: `قد يزدهر ملفك الشخصي في مسارات مهنية مثل ${cluster.careers
      .slice(0, 5)
      .join(
        listSeparator,
      )}. مع تطور مهاراتك، يمكن للمسار أن يتوسع نحو التخصص أو القيادة أو الاستشارات أو تأسيس مشروعك الخاص. لا تتجاهل المسارات الأقل وضوحًا: ${cluster.nonObvious
      .slice(0, 5)
      .join(
        listSeparator,
      )}. غالبًا ما تكون نقاط التقاطع هذه هي المكان الذي يجد فيه الشباب فرصًا أدق من المسميات الوظيفية الواضحة.`,
    integration: `أسلوبك التشغيلي هو ${archetypeDisplay}. ${
      ARCHETYPE_COPY[archetype].ar
    } ${motivationSentence} أقوى إشارة بيئية لديك هي ${ecosystemFitDisplay}؛ استخدم ذلك عند تقييم المدارس والتدريبات والفرق والوظائف الأولى.`,
    realityCheck: `${cluster.realityCheck} بما أن ${driverName} محرك مكافأة قوي بالنسبة لك، انتبه إلى ما إذا كان المسار يوفر فعلًا هذه المكافأة يوميًا، لا فقط في الوصف الترويجي. قبل الاختيار، شاهد بعض مقاطع "يوم في حياة" لِـ ${cluster.careers
      .slice(0, 2)
      .join(" و")} لترى الروتين الفعلي لا العنوان فقط.`,
    nextSteps: `هذا الأسبوع: ${cluster.nextStep} هذا الفصل: تحدث إلى طالب أو خريج أو محترف يعمل بالفعل قريبًا من هذا المجال. هذا العام: ابنِ دليلًا ملموسًا. مشروع صغير، أو عمل في معرض أعمالك، أو تجربة، أو عمل تطوعي، أو يوم مراقبة ميداني سيعلمك أكثر من ساعة أخرى من التخمين.`,
  };
}
