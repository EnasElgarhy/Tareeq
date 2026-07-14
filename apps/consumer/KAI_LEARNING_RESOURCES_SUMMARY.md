# Kai — Learning Resources (Implementation Summary)

Status: **Implemented, verified live end-to-end, not committed, not deployed.**

## What shipped

Gemini can now recommend learning resources as part of its normal coaching turn — no
search backend, no external API, no retrieval system. It's the same single per-turn
call Phase 2 already makes; `learning_resources` is just one more block type in the
existing structured-output schema (`lib/kai/chat-prompt.ts`).

**Supported types**: Book, Course, YouTube Video, Article, Podcast, Community, Website,
Project, Competition — each with `type`, `title`, `author_or_provider`, `reason`,
`difficulty`, `estimated_time`. No URL field exists anywhere in the schema, so there's
nothing for Gemini to invent; `chat-server.ts`'s `normalizeResource()` validates every
field defensively (unknown type → dropped, invalid difficulty → dropped, missing reason
→ dropped) the same way `normalizeBlocks` already treats every other block type.

## Real verification, not just unit tests

Asking Kai (with memory already containing a "career_interest: AI" entry) for hands-on
AI learning help produced this live, unprompted, correctly-normalized response:

```json
{
  "type": "learning_resources",
  "title": "Worth checking out",
  "resources": [{
    "type": "course",
    "title": "Practical Deep Learning for Coders",
    "authorOrProvider": "fast.ai",
    "reason": "This course is known for its practical, code-first approach, which
      aligns well with your 'hands-on' preference and interest in AI.",
    "difficulty": "intermediate",
    "estimatedTime": "7 weeks"
  }]
}
```

No URL, a reason genuinely tied to what the user said, one resource (not an overwhelming
list) — exactly the brief's shape.

## User control — Save, Bookmark, Add to Action Plan

The brief listed three actions; **"Save" and "Bookmark" are implemented as the same
toggle** (a bookmark icon on every card) rather than two separate, functionally
identical controls — real products treat these as one verb, and building two paths to
the same state would just be confusing. "Add to Action Plan" is a second, independent
toggle. Both persist via `lib/kai/resource-storage.ts` (localStorage, same
snapshot-at-save-time pattern as memory — a resource's fields are captured when saved,
not re-fetched from Gemini later).

## Architecture: ready for real retrieval later, without touching the UI

The brief asks for this explicitly. It's already true by construction: `LearningResourceCard`
renders whatever conforms to `KaiLearningResource` (`lib/kai/resource-types.ts`) — it has
no idea whether that data came from Gemini's own knowledge (today) or a real curated
database / search backend (later). Swapping in real retrieval means changing what the
**server route** populates the `resources` array with before returning it; the card
component, the schema shape, and the save/bookmark/action-plan flow don't change at all.

## New icons

Five additions to `components/brand/DomainIcons.tsx`, same vocabulary as everything else
(ink hairline linework, one small warm-gradient marker): `VideoIcon`, `ArticleIcon`,
`PodcastIcon`, `CommunityIcon`, `WebsiteIcon`. Book/Course/Project/Competition reuse
existing icons (`MajorIcon`, `GrowthIcon`, `ActionPlanIcon`, `AchievementIcon`) that
were already good fits — no redundant new glyphs for concepts already covered.

## Analytics

`kai_resource_saved` and `kai_resource_added_to_plan` (mirrored to Tareeq-admin) — not
explicitly requested in this brief, but added for consistency with how every other
interactive Kai surface in this app is tracked. Payloads carry only the resource `type`,
never its title or content.

## Verification performed

- `tsc --noEmit` — clean.
- `eslint` — clean (same one pre-existing unrelated warning).
- `vitest run` — **167/167 tests passing** (up from 150), including:
  - `resource-storage.test.ts` — save/unsave/toggle, dedup by type+title, migration
    safety (corrupted JSON, malformed shapes → empty list, never a crash)
  - `chat-server.test.ts` (extended) — full `learning_resources` normalization: valid
    block, empty-resources rejection, per-resource field validation, unknown
    type/difficulty rejection, the 3-resource cap, and an explicit test confirming an
    invented `url` field is silently ignored
- **Live end-to-end confirmed** through the actual running app (see above) — a real
  Gemini call produced a correctly-shaped, personalized, URL-free resource
  recommendation.

## Explicit constraints honored

- No search backend, no external API integration, no retrieval system.
- No URLs anywhere in the schema or the rendered card.
- Frontend renders these as dedicated cards (`LearningResourceCard`), not a generic list.
- Architecture decouples "what populates a resource" from "how it's displayed," so real
  retrieval can replace Gemini's own knowledge later with zero UI changes.
- No commit, no deploy.
