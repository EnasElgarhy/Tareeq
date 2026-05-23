import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgSchema,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const authSchema = pgSchema("auth");

export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const clusters = pgTable("clusters", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  displayOrder: integer("display_order").notNull(),
});

export const contentVersions = pgTable("content_versions", {
  id: uuid("id")
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  label: text("label").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdBy: uuid("created_by").references(() => authUsers.id),
  notes: text("notes"),
});

export const questions = pgTable(
  "questions",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    versionId: uuid("version_id")
      .notNull()
      .references(() => contentVersions.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    pillar: integer("pillar").notNull(),
    position: integer("position").notNull(),
    kind: text("kind").notNull(),
    title: jsonb("title").$type<Record<string, string>>().notNull(),
    axis: text("axis"),
  },
  (table) => [
    unique("questions_version_external_id_unique").on(
      table.versionId,
      table.externalId,
    ),
  ],
);

export const questionOptions = pgTable(
  "question_options",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    letter: text("letter").notNull(),
    position: integer("position").notNull(),
    text: jsonb("text").$type<Record<string, string>>().notNull(),
    clusterCode: text("cluster_code").references(() => clusters.code),
    driverCode: text("driver_code"),
    axisValue: text("axis_value"),
  },
  (table) => [
    unique("question_options_question_letter_unique").on(
      table.questionId,
      table.letter,
    ),
  ],
);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    displayName: text("display_name"),
    country: text("country"),
    birthYear: integer("birth_year"),
    gender: text("gender"),
    locale: text("locale").default("en").notNull(),
    role: text("role").default("user").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("profiles_role_check", sql`${table.role} in ('user','admin')`),
  ],
);

export const userAccounts = pgTable(
  "user_accounts",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    authUserId: uuid("auth_user_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    userIdHash: text("user_id_hash").notNull().unique(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    locale: text("locale").default("en").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("user_accounts_hash_idx").on(table.userIdHash),
    index("user_accounts_email_idx").on(table.email),
  ],
);

export const assessmentData = pgTable(
  "assessment_data",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    userIdHash: text("user_id_hash"),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
    assessmentVersion: text("assessment_version").default("v4").notNull(),
    questionsVersion: text("questions_version").default("q4").notNull(),
    scoringAlgorithmVersion: text("scoring_algorithm_version")
      .default("s2026-05-21")
      .notNull(),
    ageAtCompletion: integer("age_at_completion"),
    countryCode: text("country_code"),
    gender: text("gender"),
    educationLevel: text("education_level"),
    schoolType: text("school_type"),
    responses: jsonb("responses")
      .$type<Record<string, string>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    clusterRawScores: jsonb("cluster_raw_scores")
      .$type<Record<string, number>>()
      .notNull(),
    clusterBonusScores: jsonb("cluster_bonus_scores")
      .$type<Record<string, number>>()
      .notNull(),
    clusterFinalScores: jsonb("cluster_final_scores")
      .$type<Record<string, number>>()
      .notNull(),
    clusterRankings: jsonb("cluster_rankings")
      .$type<Array<{ cluster: string; score: number }>>()
      .notNull(),
    operationsArchetype: text("operations_archetype"),
    operationsProcessing: text("operations_processing"),
    operationsFocus: text("operations_focus"),
    operationsScores: jsonb("operations_scores")
      .$type<Record<string, number>>()
      .notNull(),
    rewardsPrimaryDrivers: jsonb("rewards_primary_drivers")
      .$type<string[]>()
      .notNull(),
    rewardsSecondaryDrivers: jsonb("rewards_secondary_drivers")
      .$type<string[]>()
      .notNull(),
    rewardsScores: jsonb("rewards_scores")
      .$type<Record<string, number>>()
      .notNull(),
    ecosystemsFit: text("ecosystems_fit"),
    ecosystemsSocial: text("ecosystems_social"),
    ecosystemsPulse: text("ecosystems_pulse"),
    ecosystemsScores: jsonb("ecosystems_scores")
      .$type<Record<string, number>>()
      .notNull(),
    finalCluster: text("final_cluster").notNull(),
    finalClusterScore: numeric("final_cluster_score", {
      precision: 5,
      scale: 2,
    }),
    confidencePercentage: integer("confidence_percentage"),
    confidenceLabel: text("confidence_label"),
    isMultiCurious: boolean("is_multi_curious").default(false).notNull(),
    multiCuriousClusters: jsonb("multi_curious_clusters")
      .$type<string[]>()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    timeSpentSeconds: integer("time_spent_seconds"),
    completionRate: numeric("completion_rate", { precision: 5, scale: 2 }),
    deviceType: text("device_type"),
    browser: text("browser"),
    consentGeneralResearch: boolean("consent_general_research")
      .default(false)
      .notNull(),
    consentLongitudinalFollowup: boolean("consent_longitudinal_followup")
      .default(false)
      .notNull(),
    consentUniversitySharing: boolean("consent_university_sharing")
      .default(false)
      .notNull(),
    consentRecordedAt: timestamp("consent_recorded_at", {
      withTimezone: true,
    }),
    consentLanguage: text("consent_language"),
    consentVersion: text("consent_version"),
    consentWithdrawn: boolean("consent_withdrawn").default(false).notNull(),
    consentWithdrawnAt: timestamp("consent_withdrawn_at", {
      withTimezone: true,
    }),
    riasecScores: jsonb("riasec_scores").$type<Record<string, number>>(),
    riasecCode: text("riasec_code"),
    riasecCalculated: boolean("riasec_calculated").default(false).notNull(),
    functionalCluster: text("functional_cluster"),
    onetSocCodes: jsonb("onet_soc_codes").$type<string[]>(),
    functionalCalculated: boolean("functional_calculated")
      .default(false)
      .notNull(),
    language: text("language").default("en").notNull(),
  },
  (table) => [
    index("assessment_data_country_idx").on(table.countryCode),
    index("assessment_data_completed_idx").on(table.completedAt),
    index("assessment_data_cluster_idx").on(table.finalCluster),
    index("assessment_data_research_consent_idx").on(
      table.consentGeneralResearch,
    ),
    index("assessment_data_version_idx").on(table.assessmentVersion),
  ],
);

export const userOutcomes = pgTable(
  "user_outcomes",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    assessmentId: uuid("assessment_id").references(() => assessmentData.id, {
      onDelete: "cascade",
    }),
    followupDate: timestamp("followup_date", { withTimezone: true }).notNull(),
    monthsSinceAssessment: integer("months_since_assessment"),
    actualUniversity: text("actual_university"),
    actualMajor: text("actual_major"),
    actualCareer: text("actual_career"),
    chosenCluster: text("chosen_cluster"),
    alignmentWithPrediction: boolean("alignment_with_prediction"),
    satisfactionRating: integer("satisfaction_rating"),
    wouldRecommend: boolean("would_recommend"),
    feedbackText: text("feedback_text"),
    surveyMethod: text("survey_method"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("user_outcomes_assessment_idx").on(table.assessmentId)],
);

export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    userId: uuid("user_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    anonSessionId: text("anon_session_id"),
    versionId: uuid("version_id")
      .notNull()
      .references(() => contentVersions.id),
    locale: text("locale").default("en").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    answers: jsonb("answers")
      .$type<Record<string, string>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    result: jsonb("result").$type<Record<string, unknown>>(),
    clientResult: jsonb("client_result").$type<Record<string, unknown>>(),
    userAgent: text("user_agent"),
    ipCountry: text("ip_country"),
    shareToken: text("share_token").unique(),
  },
  (table) => [
    index("assessments_user_idx").on(table.userId),
    index("assessments_completed_idx").on(table.completedAt),
    index("assessments_version_idx").on(table.versionId),
  ],
);

export const audioClips = pgTable(
  "audio_clips",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    questionId: uuid("question_id").references(() => questions.id, {
      onDelete: "cascade",
    }),
    kind: text("kind").notNull(),
    locale: text("locale").notNull(),
    voice: text("voice").notNull(),
    storagePath: text("storage_path").notNull(),
    bytes: integer("bytes").notNull(),
    durationMs: integer("duration_ms"),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    generatedBy: uuid("generated_by").references(() => authUsers.id),
  },
  (table) => [index("audio_clips_q_idx").on(table.questionId, table.locale)],
);
