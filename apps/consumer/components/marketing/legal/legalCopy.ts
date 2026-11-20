/**
 * Privacy Policy and Terms of Service, as supplied by The ME Project on
 * 19 November 2026 ("Map My CORE: Privacy Policy & Terms of Service").
 * The wording is the client's legal text: change it only from a new
 * document, never to tidy the phrasing. English only for now.
 */

export const LEGAL_CONTACT_EMAIL = "support@mapmycore.com";
export const LEGAL_LAST_UPDATED = "Last updated on November 19, 2026 · The ME Project";
export const LEGAL_INTRO =
  "This page explains how The ME Project (FZE) collects, uses, and protects your information when you use Map My CORE, and the terms under which you may use the service. We have written it for students and parents. If anything is unclear, write to us at support@mapmycore.com.";

export interface LegalTable {
  head: readonly string[];
  rows: ReadonlyArray<readonly string[]>;
}

/** A paragraph, a bulleted list (an item may open with a bold label), or a table. */
export type LegalBlock =
  | string
  | { items: ReadonlyArray<string | { label: string; text: string }> }
  | { table: LegalTable };

export interface LegalSection {
  id: string;
  title: string;
  blocks: readonly LegalBlock[];
}

export const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    blocks: [
      "Map My CORE is owned and operated by The ME Project (FZE), a Sole Establishment registered in the United Arab Emirates under the number 11123, licensed for software development and for educational consultancy and training on the development of personal competencies.",
      {
        items: [
          { label: "Address:", text: "Block B-B55-192, Sharjah Research Technology & Innovation Park, UAE" },
          { label: "Contact:", text: "support@mapmycore.com" },
        ],
      },
      "This policy explains what personal data Map My CORE collects from users across the Middle East and North Africa (MENA) region, why, and what rights you have over it.",
    ],
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    blocks: [
      "When you use Map My CORE, we collect:",
      {
        items: [
          "Your age range and stage of education",
          "Your Name",
          "Country of residence (for data segregation purposes) and if the person is a citizen of that country (for the purpose of segregation of data per citizenship (anonymized))",
          "Gender (used for addressing the gender correctly in Arabic language)",
          "Your email address and password (stored in protected form)",
          "Your responses to the CORE assessment",
          "What you write to Kai and Kai’s replies in text form",
          "Safeguarding alerts (In case of concern about the user’s wellbeing or safety based on what they decide to share with Kai)",
        ],
      },
      "We do not ask for your exact date of birth, ID documents, or other sensitive identifiers.",
    ],
  },
  {
    id: "how-we-use-it",
    title: "How we use it",
    blocks: [
      {
        items: [
          {
            label: "To generate your results.",
            text: "Your answers are scored against Map My CORE’s CORE model and the results are sent to the email address you provide. You decide who else, if anyone, sees your results. We do not share them automatically with school, or counselor. We do not use your answers, report or Kai conversations for advertising, and we do not show ads inside Map My CORE.",
          },
          {
            label: "To power Kai.",
            text: "If you talk to Kai, your conversation is processed using Claude API (Anthropic) so Kai can respond. Kai is an AI system guided by career-counseling frameworks — not a human counselor.",
          },
          {
            label: "For Academic research.",
            text: "The ME Project may use anonymized or aggregated assessment data for academic research into career guidance in the MENA region within partner Universities. This use is separate from generating your results, and we will ask for your explicit, separate consent before including your data in any research; ticking a general \"I agree to this policy\" box is not treated as consent for this. We do not sell your personal data, and we do not use it for targeted advertising.",
          },
        ],
      },
    ],
  },
  {
    id: "children-and-minors",
    title: "Children & minors",
    blocks: [
      "Map My CORE is intended for users 13 years of age and older. We do not currently require parental or guardian consent to create an account or take the assessment, because the information we collect (age range, email, education stage, and assessment responses) is limited, non-invasive, and does not generate any diagnosis or label. If the user is under 13, you cannot continue and nothing is saved.",
      "If you are a parent or guardian and believe your child has provided personal data to us and you'd like it reviewed or removed, contact us at the details above.",
    ],
  },
  {
    id: "how-we-process-your-data",
    title: "How we process your data",
    blocks: [
      "We don't sell or rent your data. We may share for the purpose of storage only with the service providers that make Map My CORE work which are mainly encrypted:",
      {
        table: {
          head: ["Provider", "Purpose", "Data involved"],
          rows: [
            [
              "Amazon Web Services (AWS)",
              "Encrypted hosting and storage",
              "All account and assessment data stored in European Cloud location (According to GDPR)",
            ],
            ["Claude API (Anthropic)", "Powers Kai's conversations", "Your messages to Kai"],
            ["Stripe", "Payment gateway", "Card number entry for payment"],
            ["PostHog", "Website use statistics", "Europe region (no names, no screen recording)"],
            [
              "Resend",
              "Sending receipts, parents links and email confirmation",
              "Receipts, Parents links, and account confirmation emails",
            ],
          ],
        },
      },
      "We may also disclose data if required by law.",
    ],
  },
  {
    id: "how-long-we-keep-your-data",
    title: "How long we keep your data",
    blocks: [
      "We retain your data for 5 years from your last activity on Map My CORE, after which it is deleted unless you ask us to delete it sooner.",
    ],
  },
  {
    id: "your-rights",
    title: "Your rights",
    blocks: [
      "You as a user or as a legal guardian of a user can ask us, at any time, to:",
      {
        items: [
          "Access the personal data we hold about you",
          "Correct data",
          "Restriction of processing",
          "Transfer data",
          "Delete your account and data",
          "Withdraw consent for research use of your data (if you'd previously given it)",
        ],
      },
      "Please write to us on support@mapmycore.com in the event of wishing to exercise any of your rights above as per the UAE federal laws.",
      "To do any of these, contact us at the details above.",
    ],
  },
  {
    id: "security",
    title: "Security",
    blocks: [
      "Your data is encrypted both in transit and at rest on our hosting infrastructure. No method of storing or transmitting data is 100% secure, but we take reasonable technical and organizational measures to protect your information from unauthorized access, loss, or misuse. If a breach affects your information, we will tell you and the authorities as the law requires.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies",
    blocks: [
      "We use cookies that are needed to keep you signed in and to make the platform work. With your consent we also use PostHog to count visits and see which steps people reach. You can accept or refuse these in the cookie banner and change your choice at any time from “Cookie settings” in the footer.",
    ],
  },
  {
    id: "changes-to-this-policy",
    title: "Changes to this policy",
    blocks: [
      "We may update this policy as Map My CORE grows, for example, once the platform moves from free testing to paid access, or as new features (like Kai) evolve. We'll post the updated policy here with a new \"last updated\" date, and if a change is significant, we'll make a reasonable effort to let users know directly.",
    ],
  },
];

export const TERMS_SECTIONS: readonly LegalSection[] = [
  {
    id: "the-service",
    title: "The service you're using",
    blocks: [
      "Map My CORE provides a self-guided career and study-direction assessment (the CORE Assessment) intended to help students and young adults in the MENA region explore career paths that they may be worth exploring based on their answers to the questions.",
    ],
  },
  {
    id: "what-map-my-core-provides",
    title: "What Map My CORE provides",
    blocks: [
      {
        items: [
          {
            label: "The CORE assessment:",
            text: "about 15 minutes, 46 questions about everyday situations and background questions, in Arabic or English.",
          },
          {
            label: "Your CORE report:",
            text: "what pulls your interest, how you like to work, what motivates you and the work settings you prefer, with job families, study fields, routes to explore and next steps.",
          },
          {
            label: "Kai, your personal career coach:",
            text: "an AI coach who has read your report, available for limited time from the date you take CORE.",
          },
        ],
      },
    ],
  },
  {
    id: "what-core-is",
    title: "What CORE is, and what it is not",
    blocks: [
      "CORE is a tool for exploring directions and making informed choices. It is not a psychometric test, an exam, a diagnosis or a clinical, psychological or educational assessment. It does not measure ability, intelligence or personality, and it does not predict success or tell you what to study or which career to choose. The choice is always yours. Information about school subjects, study fields and admission is general; always check with your school counsellor and the official websites of universities before deciding. If you are worried about your wellbeing, please speak to a qualified professional or a trusted adult.",
    ],
  },
  {
    id: "parents-and-guardians",
    title: "Parents and guardians",
    blocks: [
      "A parent or guardian who unlocks a report confirms that they are the student's parent or legal guardian and agrees to these terms and the Privacy Policy.",
      "For students aged 13 to 17, that parent or guardian can read the report. Parents and guardians remain responsible for supervising their child's use of online services. When a parent or guardian unlocks the report, a copy is sent by email to the student and to the parent or guardian. Kai conversations stay private to the student, except where we need to act on a safety concern.",
    ],
  },
  {
    id: "eligibility",
    title: "Eligibility",
    blocks: [
      "You must be at least 13 years old to use Map My CORE. By using the service, you confirm that you meet this age requirement and, where your local law requires it, that you have the necessary permission from a parent or guardian to use an online service like this one.",
    ],
  },
  {
    id: "the-use-of-kai",
    title: "The use of Kai (AI)",
    blocks: [
      "Kai is a fictional character which is designed to assist users to understand their reports in more detail. It is an AI enabled (Claude API (Anthropic)) which had been given strict rulebook and guardrails for its conversation with the users. However, it can make mistakes as per the claim of the operator of Claude (Anthropic). Parental guidance is advised for users between 13 and 17 years old.",
    ],
  },
  {
    id: "payments-and-refunds",
    title: "Payments & refunds",
    blocks: [
      "Map My CORE access is sold as a one-time purchase. Because your results are generated and delivered immediately upon completing the assessment, purchases are non-refundable once the service has been fully delivered. Except in the case of duplicate charges, technical failure, or as required by law.",
      "In some cases, you may request to re-take the assessment if you have a valid reason. Please reach Map My CORE team on the email address above to facilitate.",
    ],
  },
  {
    id: "processing-payments",
    title: "Processing payments",
    blocks: [
      "Payments are handled by Stripe. We receive the payer's name, email, the amount, the date and the last four digits of the card. We never see or store full card numbers. Data is kept as per the required UAE tax law. Prices are in UAE dirhams and include VAT for users within UAE. Users in other countries may be charged with their local currencies through Stripe payment gateway.",
    ],
  },
  {
    id: "website-use",
    title: "Website Use",
    blocks: [
      "With your consent (cookie banner): pages visited, steps of the assessment reached, the link you came from, device and browser type, and approximate country. We do not record your screen or what you type.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use & intellectual property",
    blocks: [
      "You agree to use Map My CORE honestly answering as yourself, not attempting to disrupt the service, and not reselling or redistributing your results or the assessment content. The CORE Assessment, its questions, scoring methodology, and the Map My CORE name and brand are the proprietary in property of The ME Project (FZE) intellectually or otherwise.",
    ],
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of liability",
    blocks: [
      "Map My CORE is provided \"as is.\" To the fullest extent permitted by law, The ME Project (FZE) is not liable for decisions you make based on your assessment results, or for any indirect or consequential loss arising from your use of the service. In the event of Kai detecting a risk of harm or threat to the wellbeing of a user, it shares the UAE emergency number 999 and alerts The ME Project team, who may contact the parent. To the extent the law allows, our total responsibility to you is limited to the amount you paid.",
    ],
  },
  {
    id: "governing-law",
    title: "Governing law",
    blocks: ["These terms are governed by the laws and courts of Sharjah, the United Arab Emirates."],
  },
  {
    id: "contact-us",
    title: "Contact us",
    blocks: [
      "Questions about this Privacy Policy, above listed Terms of Service, and any concerns or potential differences can be sent to support@mapmycore.com, Please contact us first, most concerns can be addressed and solved amicably.",
    ],
  },
];
