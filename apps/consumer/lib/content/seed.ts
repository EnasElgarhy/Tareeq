export const contentVersion = {
  label: "v4",
  notes: "CORE Assessment v4 ported from prototype/index.html",
} as const;

export const defaultLocale = "en";

export const countriesMiddleEast = [
  "United Arab Emirates",
  "Saudi Arabia",
  "Egypt",
  "Jordan",
  "Lebanon",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
  "Morocco",
  "Tunisia",
  "Algeria",
  "Iraq",
  "Palestine",
  "Syria",
  "Yemen",
  "Libya",
  "Sudan",
] as const;

export const countriesRest = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "France",
  "Germany",
  "Spain",
  "Italy",
  "Netherlands",
  "Sweden",
  "Norway",
  "Denmark",
  "Turkey",
  "India",
  "Pakistan",
  "Bangladesh",
  "Indonesia",
  "Malaysia",
  "Singapore",
  "Japan",
  "South Korea",
  "China",
  "South Africa",
  "Nigeria",
  "Kenya",
  "Brazil",
  "Mexico",
  "Argentina",
  "Other",
] as const;

export const clusters = [
  {
    code: "TECH",
    name: "Technology",
    description:
      "You're drawn to systems, code, and AI — building tools that scale and rethinking how things work.",
    displayOrder: 1,
  },
  {
    code: "ENG",
    name: "Engineering",
    description:
      "You love how physical things work — machines, hardware, systems you can see and touch.",
    displayOrder: 2,
  },
  {
    code: "SCI",
    name: "Science & Data",
    description:
      "You're a pattern-hunter — math, biology, chemistry, the hidden structure behind everything.",
    displayOrder: 3,
  },
  {
    code: "ART",
    name: "Arts & Media",
    description:
      "You think in stories, visuals, and atmosphere — design, film, performance, sound.",
    displayOrder: 4,
  },
  {
    code: "BUS",
    name: "Business",
    description:
      "You see opportunity, strategy, and value — building ventures, deals, and growth engines.",
    displayOrder: 5,
  },
  {
    code: "LAW",
    name: "Law & Diplomacy",
    description:
      "You think in rules, fairness, and frameworks — debate, policy, negotiation, justice.",
    displayOrder: 6,
  },
  {
    code: "PPL",
    name: "People & Psychology",
    description:
      "You read humans well — motivation, behavior, emotions, the soft systems that move groups.",
    displayOrder: 7,
  },
  {
    code: "ENV",
    name: "Environment",
    description:
      "You're tuned to ecosystems and the natural world — conservation, life sciences, the planet.",
    displayOrder: 8,
  },
] as const;

export const seedQuestions = [
  {
    externalId: "QD1",
    pillar: 0,
    position: 1,
    kind: "single",
    title: {
      en: "How old are you?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Under 16",
        },
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "16 or 17",
        },
      },
      {
        letter: "C",
        position: 3,
        text: {
          en: "18 or 19",
        },
      },
      {
        letter: "D",
        position: 4,
        text: {
          en: "20 or 21",
        },
      },
      {
        letter: "E",
        position: 5,
        text: {
          en: "22 or older",
        },
      },
    ],
  },
  {
    externalId: "QD2",
    pillar: 0,
    position: 2,
    kind: "select",
    title: {
      en: "Which country do you currently live in?",
    },
    options: [],
  },
  {
    externalId: "QD3",
    pillar: 0,
    position: 3,
    kind: "single",
    title: {
      en: "What is your current academic stage?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Final 2 years of high school",
        },
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Gap year or transition",
        },
      },
      {
        letter: "C",
        position: 3,
        text: {
          en: "Year 1 or 2 of university",
        },
      },
      {
        letter: "D",
        position: 4,
        text: {
          en: "Year 3+ of university",
        },
      },
      {
        letter: "E",
        position: 5,
        text: {
          en: "Not currently in formal education",
        },
      },
    ],
  },
  {
    externalId: "QD4",
    pillar: 0,
    position: 4,
    kind: "single",
    title: {
      en: "How do you identify?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Female",
        },
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Male",
        },
      },
      {
        letter: "C",
        position: 3,
        text: {
          en: "Prefer not to say",
        },
      },
    ],
  },
  {
    externalId: "Q1",
    pillar: 1,
    position: 1,
    kind: "single",
    title: {
      en: "You're refreshing your feed. Which video is an immediate click?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: '"How a student turned a school project into a real product that got acquired."',
        },
        clusterCode: "BUS",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: '"Building a real-life flying suit — how the mechanics actually work."',
        },
        clusterCode: "ENG",
      },
      {
        letter: "C",
        position: 3,
        text: {
          en: "\"Why do we feel 'cringe' around certain people? The brain science explained.\"",
        },
        clusterCode: "PPL",
      },
      {
        letter: "D",
        position: 4,
        text: {
          en: '"I let an AI agent organise my entire life for a week — here\'s what happened."',
        },
        clusterCode: "TECH",
      },
    ],
  },
  {
    externalId: "Q2",
    pillar: 1,
    position: 2,
    kind: "single",
    title: {
      en: "You're watching an investigation show. Which character's work is most interesting to you?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "The lawyer finding a legal angle no one else spotted to win the case.",
        },
        clusterCode: "LAW",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "The designer creating the sets, outfits, and overall look of the show.",
        },
        clusterCode: "ART",
      },
      {
        letter: "C",
        position: 3,
        text: {
          en: "The forensic scientist using chemistry to find hidden clues.",
        },
        clusterCode: "SCI",
      },
      {
        letter: "D",
        position: 4,
        text: {
          en: "The detective working the streets, reading people, and connecting the dots.",
        },
        clusterCode: "PPL",
      },
    ],
  },
  {
    externalId: "Q3",
    pillar: 1,
    position: 3,
    kind: "single",
    title: {
      en: 'Your school adds a new "Future Skills" elective. Which one do you sign up for immediately?',
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Entrepreneurship: Building a business from scratch.",
        },
        clusterCode: "BUS",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Marine Biology Lab: Understanding ocean ecosystems.",
        },
        clusterCode: "ENV",
      },
      {
        letter: "C",
        position: 3,
        text: {
          en: "Robotics Workshop: Designing and building a working machine.",
        },
        clusterCode: "ENG",
      },
      {
        letter: "D",
        position: 4,
        text: {
          en: "Civic Leadership: Debating policy and international affairs.",
        },
        clusterCode: "LAW",
      },
    ],
  },
  {
    externalId: "Q4",
    pillar: 1,
    position: 4,
    kind: "single",
    title: {
      en: "Your friends are having a long debate at lunch. Which topic would pull YOU into the conversation the most?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Whether a new social media app is good or bad for young people.",
        },
        clusterCode: "PPL",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Whether a wealthy person should be allowed to build something huge on protected land.",
        },
        clusterCode: "ENV",
      },
      {
        letter: "C",
        position: 3,
        text: {
          en: "Whether a new government rule makes sense or not.",
        },
        clusterCode: "LAW",
      },
      {
        letter: "D",
        position: 4,
        text: {
          en: "Whether a new AI tool will take over a certain job category.",
        },
        clusterCode: "TECH",
      },
    ],
  },
  {
    externalId: "Q5",
    pillar: 1,
    position: 5,
    kind: "single",
    title: {
      en: "To make a school project actually interesting, what would YOU add?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "A way to use the info to help a real community you care about.",
        },
        clusterCode: "PPL",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "A mathematical model or simulation that predicts what happens next.",
        },
        clusterCode: "SCI",
      },
      {
        letter: "C",
        position: 3,
        text: {
          en: "Professional visuals, graphics, or a cinematic video.",
        },
        clusterCode: "ART",
      },
      {
        letter: "D",
        position: 4,
        text: {
          en: "A way to automate the boring parts so a program does the heavy lifting.",
        },
        clusterCode: "TECH",
      },
    ],
  },
  {
    externalId: "Q6",
    pillar: 1,
    position: 6,
    kind: "single",
    title: {
      en: "You're helping out at a local festival or school exhibition. Which tent do you run?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "The Green Zone — teaching people about protecting the environment.",
        },
        clusterCode: "ENV",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "The Fix-It Shop — repairing broken tech or gadgets.",
        },
        clusterCode: "ENG",
      },
      {
        letter: "C",
        position: 3,
        text: {
          en: "The Story Stage — hosting the event and introducing performers.",
        },
        clusterCode: "ART",
      },
      {
        letter: "D",
        position: 4,
        text: {
          en: "The Debate Hub — discussing ideas for the city's future.",
        },
        clusterCode: "LAW",
      },
    ],
  },
  {
    externalId: "Q7",
    pillar: 1,
    position: 7,
    kind: "single",
    title: {
      en: "Which news headline makes you most curious to click?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: '"New law passed that changes how teenagers can use social media."',
        },
        clusterCode: "LAW",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: '"Researchers identify the gene behind a major human disease."',
        },
        clusterCode: "SCI",
      },
      {
        letter: "C",
        position: 3,
        text: {
          en: '"The mathematics behind why certain songs always go viral."',
        },
        clusterCode: "SCI",
      },
      {
        letter: "D",
        position: 4,
        text: {
          en: '"New app lets anyone design their own virtual world without coding."',
        },
        clusterCode: "ART",
      },
    ],
  },
  {
    externalId: "Q8",
    pillar: 1,
    position: 8,
    kind: "single",
    title: {
      en: "You've been given a major grant to create something with positive impact on your school. What do you build?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "A student-run business or café that generates income for school activities.",
        },
        clusterCode: "BUS",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "A high-tech robotics lab for building new hardware.",
        },
        clusterCode: "ENG",
      },
      {
        letter: "C",
        position: 3,
        text: {
          en: "An outdoor garden and eco-space for students to decompress.",
        },
        clusterCode: "ENV",
      },
      {
        letter: "D",
        position: 4,
        text: {
          en: "A mental wellness centre with trained peer counsellors.",
        },
        clusterCode: "PPL",
      },
    ],
  },
  {
    externalId: "Q9",
    pillar: 1,
    position: 9,
    kind: "single",
    title: {
      en: "A new community rule is announced that everyone hates. What's your instinct?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Organise a meeting to negotiate a change with community leaders.",
        },
        clusterCode: "LAW",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Look for a smart technical workaround that makes the rule irrelevant.",
        },
        clusterCode: "TECH",
      },
      {
        letter: "C",
        position: 3,
        text: {
          en: "Check in on friends who seem most affected by the rule.",
        },
        clusterCode: "PPL",
      },
      {
        letter: "D",
        position: 4,
        text: {
          en: "Calculate and map out exactly how much time or money this rule costs everyone, so the argument has data.",
        },
        clusterCode: "SCI",
      },
    ],
  },
  {
    externalId: "Q10",
    pillar: 1,
    position: 10,
    kind: "single",
    title: {
      en: "A public controversy is trending online. Which angle of the story do YOU find most interesting?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "The debate about whether the current laws are fair or need changing.",
        },
        clusterCode: "LAW",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "The data analysis showing hidden patterns nobody noticed.",
        },
        clusterCode: "SCI",
      },
      {
        letter: "C",
        position: 3,
        text: {
          en: "The stories and visuals emerging from the people most affected.",
        },
        clusterCode: "ART",
      },
      {
        letter: "D",
        position: 4,
        text: {
          en: "The business side — who is making or losing money from this.",
        },
        clusterCode: "BUS",
      },
    ],
  },
  {
    externalId: "Q11",
    pillar: 1,
    position: 11,
    kind: "single",
    title: {
      en: "Which of these tasks would you find MOST enjoyable to help someone with, even if you'd have to learn how?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Making sense of a complicated contract or set of rules.",
        },
        clusterCode: "LAW",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Figuring out why their phone, bike, or something mechanical isn't working.",
        },
        clusterCode: "ENG",
      },
      {
        letter: "C",
        position: 3,
        text: {
          en: "Identifying a plant, bird, or animal they found.",
        },
        clusterCode: "ENV",
      },
      {
        letter: "D",
        position: 4,
        text: {
          en: "Coming up with the best strategy to win a competition or game.",
        },
        clusterCode: "BUS",
      },
    ],
  },
  {
    externalId: "Q12",
    pillar: 1,
    position: 12,
    kind: "single",
    title: {
      en: "You open a news app and only have time to read 3 articles today. Which topics pull you?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "A diplomatic standoff between two countries.",
        },
        clusterCode: "LAW",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "A medical breakthrough that could save millions.",
        },
        clusterCode: "SCI",
      },
      {
        letter: "C",
        position: 3,
        text: {
          en: "A young filmmaker whose short film just went viral.",
        },
        clusterCode: "ART",
      },
      {
        letter: "D",
        position: 4,
        text: {
          en: "An entrepreneur who built a regional business empire from nothing.",
        },
        clusterCode: "BUS",
      },
    ],
  },
  {
    externalId: "Q13",
    pillar: 1,
    position: 13,
    kind: "single",
    title: {
      en: "You win a major international youth award. Which category is it in?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "The Visionary — for the most original and beautiful design.",
        },
        clusterCode: "ART",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "The Strategist — for the most profitable innovation.",
        },
        clusterCode: "BUS",
      },
      {
        letter: "C",
        position: 3,
        text: {
          en: "The Guardian — for the most impactful environmental project.",
        },
        clusterCode: "ENV",
      },
      {
        letter: "D",
        position: 4,
        text: {
          en: "The Architect — for designing the most stable and resilient structure.",
        },
        clusterCode: "ENG",
      },
    ],
  },
  {
    externalId: "Q14",
    pillar: 1,
    position: 14,
    kind: "single",
    title: {
      en: "You have an empty studio for a month. What do you turn it into?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "A podcast or film studio to share stories and ideas.",
        },
        clusterCode: "ART",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "A Maker Space with creative tools to build physical things.",
        },
        clusterCode: "ENG",
      },
      {
        letter: "C",
        position: 3,
        text: {
          en: "A data lab to investigate a real-world mystery.",
        },
        clusterCode: "SCI",
      },
      {
        letter: "D",
        position: 4,
        text: {
          en: "A community wellness lounge for peer support and mental health.",
        },
        clusterCode: "PPL",
      },
    ],
  },
  {
    externalId: "Q15",
    pillar: 1,
    position: 15,
    kind: "single",
    title: {
      en: "Which skill would you download into your brain instantly if you could?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Coding any app or AI agent from scratch.",
        },
        clusterCode: "TECH",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Speaking any language fluently, with deep cultural understanding.",
        },
        clusterCode: "LAW",
      },
      {
        letter: "C",
        position: 3,
        text: {
          en: "Understanding exactly how any natural ecosystem works and why.",
        },
        clusterCode: "ENV",
      },
      {
        letter: "D",
        position: 4,
        text: {
          en: "Seeing meaningful patterns in massive amounts of data instantly.",
        },
        clusterCode: "SCI",
      },
    ],
  },
  {
    externalId: "Q16",
    pillar: 1,
    position: 16,
    kind: "single",
    title: {
      en: "You have a free week to join one exclusive masterclass. Which one do you pick?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "The Diplomat — learning to negotiate international agreements.",
        },
        clusterCode: "LAW",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "The Founder — building a startup from idea to first investor round.",
        },
        clusterCode: "BUS",
      },
      {
        letter: "C",
        position: 3,
        text: {
          en: "The Guardian — deep-diving into protecting endangered ecosystems.",
        },
        clusterCode: "ENV",
      },
      {
        letter: "D",
        position: 4,
        text: {
          en: "The Producer — mastering storytelling and going viral with a message.",
        },
        clusterCode: "ART",
      },
    ],
  },
  {
    externalId: "Q17",
    pillar: 2,
    position: 1,
    kind: "binary",
    title: {
      en: "You're learning something completely new — like a musical instrument, a sport, or a craft. Your instinct is:",
    },
    axis: "PROC",
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Find a structured course or tutorial and follow it step by step.",
        },
        axisValue: "STRUCT",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Jump in and start doing it, picking up the techniques as you go.",
        },
        axisValue: "FLEX",
      },
    ],
  },
  {
    externalId: "Q18",
    pillar: 2,
    position: 2,
    kind: "binary",
    title: {
      en: "You have a huge project due in two weeks. Your brain:",
    },
    axis: "PROC",
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Breaks it into small daily tasks and plans steady progress from day one.",
        },
        axisValue: "STRUCT",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Works best under deadline pressure — that's when your sharpest ideas come.",
        },
        axisValue: "FLEX",
      },
    ],
  },
  {
    externalId: "Q19",
    pillar: 2,
    position: 3,
    kind: "binary",
    title: {
      en: "You're managing a group for a school project. How do you make sure things get done?",
    },
    axis: "PROC",
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "You set deadlines and assign clear tasks to each person.",
        },
        axisValue: "STRUCT",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "You keep the goal open and let people figure out how they want to contribute.",
        },
        axisValue: "FLEX",
      },
    ],
  },
  {
    externalId: "Q20",
    pillar: 2,
    position: 4,
    kind: "binary",
    title: {
      en: "You're using a new creative app for the first time. What do you do?",
    },
    axis: "PROC",
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Look for the official guide so you don't waste time or make mistakes.",
        },
        axisValue: "STRUCT",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Ignore the guide and just start clicking around to see what happens.",
        },
        axisValue: "FLEX",
      },
    ],
  },
  {
    externalId: "Q21",
    pillar: 2,
    position: 5,
    kind: "binary",
    title: {
      en: "When you get really into a topic, you tend to:",
    },
    axis: "SCOPE",
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Go very deep into one narrow aspect until you understand it completely.",
        },
        axisValue: "DEEP",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Read widely across everything connected to it — the bigger the picture, the better.",
        },
        axisValue: "BROAD",
      },
    ],
  },
  {
    externalId: "Q22",
    pillar: 2,
    position: 6,
    kind: "binary",
    title: {
      en: "You see an interesting invention online. What catches your attention first?",
    },
    axis: "SCOPE",
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "The one clever detail that makes it work — you want to understand that one thing.",
        },
        axisValue: "DEEP",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "How the whole design fits together and what it could connect to next.",
        },
        axisValue: "BROAD",
      },
    ],
  },
  {
    externalId: "Q23",
    pillar: 2,
    position: 7,
    kind: "binary",
    title: {
      en: "You have a free month to learn something new. You'd rather:",
    },
    axis: "SCOPE",
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Become genuinely good at one skill, even if you can only do that one thing.",
        },
        axisValue: "DEEP",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Get a foundational taste of five different skills and see which one you like.",
        },
        axisValue: "BROAD",
      },
    ],
  },
  {
    externalId: "Q24",
    pillar: 2,
    position: 8,
    kind: "binary",
    title: {
      en: "Watching a movie with a massive plot twist, you usually:",
    },
    axis: "SCOPE",
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Focus on one specific clue and trace how it was hidden through the whole film.",
        },
        axisValue: "DEEP",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Look at the big picture — how all the characters and events connect to the reveal.",
        },
        axisValue: "BROAD",
      },
    ],
  },
  {
    externalId: "Q25",
    pillar: 3,
    position: 1,
    kind: "binary",
    title: {
      en: "Which comment would make your work feel worth it?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "\"Everyone's talking about this — you're the name people know now.\"",
        },
        driverCode: "REC",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: '"This helped me genuinely — you made a real difference."',
        },
        driverCode: "IMP",
      },
    ],
  },
  {
    externalId: "Q26",
    pillar: 3,
    position: 2,
    kind: "binary",
    title: {
      en: "You're offered a Golden Ticket reward. Which do you grab?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "An invitation to an exclusive event to meet highly influential people.",
        },
        driverCode: "REC",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Seed funding to turn your own idea into a real business.",
        },
        driverCode: "AUT",
      },
    ],
  },
  {
    externalId: "Q27",
    pillar: 3,
    position: 3,
    kind: "binary",
    title: {
      en: "You're entering a contest. What's the win that matters most?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Being the person who clearly knows the craft better than anyone.",
        },
        driverCode: "MAS",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Seeing your work actually used by a community to make a difference.",
        },
        driverCode: "IMP",
      },
    ],
  },
  {
    externalId: "Q28",
    pillar: 3,
    position: 4,
    kind: "binary",
    title: {
      en: "What do you most want to be able to say about your life in 10 years?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: '"My family has everything they need. Nothing is uncertain. I built something solid."',
        },
        driverCode: "STA",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: '"I shook things up. I made changes that people will remember."',
        },
        driverCode: "REC",
      },
    ],
  },
  {
    externalId: "Q29",
    pillar: 3,
    position: 5,
    kind: "binary",
    title: {
      en: "What would make you feel most successful at the end of a major project?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Knowing you've developed a rare skill very few people in the world possess.",
        },
        driverCode: "MAS",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Seeing your project become famous and respected across your city.",
        },
        driverCode: "REC",
      },
    ],
  },
  {
    externalId: "Q30",
    pillar: 3,
    position: 6,
    kind: "binary",
    title: {
      en: "You're faced with a task everyone else has given up on. You keep going because:",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "You love the feeling of cracking a code or solving what others couldn't.",
        },
        driverCode: "MAS",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "You know finishing this will genuinely help someone who is struggling.",
        },
        driverCode: "IMP",
      },
    ],
  },
  {
    externalId: "Q31",
    pillar: 3,
    position: 7,
    kind: "binary",
    title: {
      en: "If you started something online, which stat would you care about most?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "The number of people recognising your name and sharing your work.",
        },
        driverCode: "REC",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "The freedom and profit it gives you to keep building independently.",
        },
        driverCode: "AUT",
      },
    ],
  },
  {
    externalId: "Q32",
    pillar: 3,
    position: 8,
    kind: "binary",
    title: {
      en: "When thinking about a career path, what is your must-have?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "A clear, stable path where you know exactly what the next step looks like.",
        },
        driverCode: "STA",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "An open path that's unclear but could let you make a big difference.",
        },
        driverCode: "IMP",
      },
    ],
  },
  {
    externalId: "Q33",
    pillar: 3,
    position: 9,
    kind: "binary",
    title: {
      en: "You receive two job offers after graduating. Which one is more appealing?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "A well-known company with a clear promotion ladder, benefits, and a guaranteed salary.",
        },
        driverCode: "STA",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "An early-stage startup with big upside potential but no salary guarantee.",
        },
        driverCode: "AUT",
      },
    ],
  },
  {
    externalId: "Q34",
    pillar: 3,
    position: 10,
    kind: "binary",
    title: {
      en: "If you could design your ideal working life, what's your goal?",
    },
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Total freedom — work whenever and wherever, answering to no one.",
        },
        driverCode: "AUT",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Being the world's top expert in one specific field that matters.",
        },
        driverCode: "MAS",
      },
    ],
  },
  {
    externalId: "Q35",
    pillar: 4,
    position: 1,
    kind: "binary",
    title: {
      en: "You have to focus on something difficult for an hour. What's your ideal setup?",
    },
    axis: "SOC",
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "A busy café or shared space with some background energy around you.",
        },
        axisValue: "COL",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "A quiet corner with headphones where no one will walk in.",
        },
        axisValue: "IND",
      },
    ],
  },
  {
    externalId: "Q36",
    pillar: 4,
    position: 2,
    kind: "binary",
    title: {
      en: "You need an answer from a teammate on a project. You:",
    },
    axis: "SOC",
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Jump on a call or meet in person — it's easier to think together.",
        },
        axisValue: "COL",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Send a message so you can stay focused on your own work.",
        },
        axisValue: "IND",
      },
    ],
  },
  {
    externalId: "Q37",
    pillar: 4,
    position: 3,
    kind: "binary",
    title: {
      en: "You're in a group making a big decision. Your comfort zone is:",
    },
    axis: "SOC",
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Being in the middle of the discussion, hearing everyone's thoughts in real time.",
        },
        axisValue: "COL",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Stepping back to think it through on your own before committing.",
        },
        axisValue: "IND",
      },
    ],
  },
  {
    externalId: "Q38",
    pillar: 4,
    position: 4,
    kind: "binary",
    title: {
      en: "You're in a team for a pop-up event. Which phase do you enjoy more?",
    },
    axis: "ENV",
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Launch Day — fast-moving, unpredictable, all hands on deck.",
        },
        axisValue: "DYN",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Build-up weeks — steady pace, clear schedule, everything planned.",
        },
        axisValue: "PRE",
      },
    ],
  },
  {
    externalId: "Q39",
    pillar: 4,
    position: 5,
    kind: "binary",
    title: {
      en: "When you picture your future workspace, what does it look like?",
    },
    axis: "ENV",
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "High-energy and always-on, with goals that shift as opportunities appear.",
        },
        axisValue: "DYN",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Calm and focused, with clear goals that stay stable over time.",
        },
        axisValue: "PRE",
      },
    ],
  },
  {
    externalId: "Q40",
    pillar: 4,
    position: 6,
    kind: "binary",
    title: {
      en: "You're organising a weekend hangout with friends. Your approach is:",
    },
    axis: "ENV",
    options: [
      {
        letter: "A",
        position: 1,
        text: {
          en: "Go-with-the-flow — tell everyone to show up and figure it out together.",
        },
        axisValue: "DYN",
      },
      {
        letter: "B",
        position: 2,
        text: {
          en: "Plan the venue, the food, and main activities in advance so it runs smoothly.",
        },
        axisValue: "PRE",
      },
    ],
  },

  // ============================================================
  // Open-text reflection — 10 free-response questions appended
  // after the scored Q1–Q40 set. Stored as raw strings; not used
  // by the CORE scorer. Pillar 4 keeps them in the existing
  // grouping; the chrome shows them under "Reflect" instead of
  // a pillar number (see getPillarLabel).
  // ============================================================
  {
    externalId: "QT1",
    pillar: 4,
    position: 41,
    kind: "text",
    title: {
      en: "When you finish something you’re proud of, what is it usually about?",
    },
    options: [],
  },
  {
    externalId: "QT2",
    pillar: 4,
    position: 42,
    kind: "text",
    title: {
      en: "Describe a day that would feel completely worth living. What are you doing?",
    },
    options: [],
  },
  {
    externalId: "QT3",
    pillar: 4,
    position: 43,
    kind: "text",
    title: {
      en: "What’s a problem in the world that genuinely bothers you?",
    },
    options: [],
  },
  {
    externalId: "QT4",
    pillar: 4,
    position: 44,
    kind: "text",
    title: {
      en: "If you could shadow anyone for a week to learn what they do, who would it be and why?",
    },
    options: [],
  },
  {
    externalId: "QT5",
    pillar: 4,
    position: 45,
    kind: "text",
    title: {
      en: "When people compliment you, what do they most often say?",
    },
    options: [],
  },
  {
    externalId: "QT6",
    pillar: 4,
    position: 46,
    kind: "text",
    title: {
      en: "Describe a moment when time disappeared because you were so absorbed.",
    },
    options: [],
  },
  {
    externalId: "QT7",
    pillar: 4,
    position: 47,
    kind: "text",
    title: {
      en: "What do you do in your free time when no one is watching?",
    },
    options: [],
  },
  {
    externalId: "QT8",
    pillar: 4,
    position: 48,
    kind: "text",
    title: {
      en: "If you had to teach one thing for an hour, what would it be?",
    },
    options: [],
  },
  {
    externalId: "QT9",
    pillar: 4,
    position: 49,
    kind: "text",
    title: {
      en: "What kind of conversations leave you energised rather than drained?",
    },
    options: [],
  },
  {
    externalId: "QT10",
    pillar: 4,
    position: 50,
    kind: "text",
    title: {
      en: "Picture a regular Wednesday ten years from now in your best life. What does it look like?",
    },
    options: [],
  },
] as const;

export type SeedCluster = (typeof clusters)[number];
export type SeedQuestion = (typeof seedQuestions)[number];
export type SeedOption = SeedQuestion["options"][number];
