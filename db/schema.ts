import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
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
