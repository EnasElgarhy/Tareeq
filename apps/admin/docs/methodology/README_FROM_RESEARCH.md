# CORE Assessment Implementation Package
**For Developer: Ahmed Wahba**

---

## What's in This Package

You have **2 critical documents** to implement the CORE Assessment scoring and results system:

### 1. `scoring_logic.md` (Technical Specification)
**What it is:** Complete deterministic scoring engine specification
**What to do with it:** Use this to code the backend scoring system

**This document contains:**
- Question-by-question mapping for all 40 questions
- Scoring algorithms for all 4 pillars
- Operational archetype determination logic
- Reward driver identification
- Ecosystem fit calculation
- Final career cluster determination with bonuses
- Edge cases and tie-breaking rules
- 5 validation test profiles

**Implementation checklist:**
- [ ] Build scoring functions for each pillar
- [ ] Implement bonus point system for final cluster determination
- [ ] Create unit tests for each pillar
- [ ] Test the 5 validation profiles
- [ ] Ensure JSON output matches the defined structure
- [ ] Confirm all tie-breakers work correctly

---

### 2. `results_narrative_framework.md` (Content Guidelines)
**What it is:** Framework for writing/generating the 8 career cluster result pages
**What to do with it:** Use this to write the result narratives (or feed to AI generation)

**This document contains:**
- 6-section narrative structure (Opening → Academic Path → Career Landscape → Integration → Reality Check → Next Steps)
- Content outlines for all 8 career clusters
- Voice guidelines ("Kai tone")
- Personalization matrix based on operational archetype, reward driver, ecosystem fit
- Multi-curious special case handling
- Quality checklist for each narrative

**Implementation options:**

**Option A: Write manually**
Hire a content writer to write 8 result pages (400-600 words each) following the framework. Estimated time: 2-3 days of writing.

**Option B: AI generation**
Build an AI prompt that takes:
- User's scored results (from scoring_logic.md)
- The narrative framework template
- Their specific operational archetype, reward driver, ecosystem fit

And generates a personalized 400-600 word result on the fly.

---

## Implementation Order

**Step 1: Build the scoring engine** (from scoring_logic.md)
- Code the backend
- Test with validation profiles
- Ensure output JSON is correct

**Step 2: Create the 8 base narratives** (from results_narrative_framework.md)
- Write or generate the 8 career cluster result pages
- Each should be 400-600 words
- Follow the 6-section structure
- Use the voice guidelines

**Step 3: Build the personalization layer**
- Take the base narrative for the user's primary cluster
- Insert personalized paragraphs based on their:
  - Operational archetype
  - Reward driver
  - Ecosystem fit
- This happens in **Section 4 (Integration)** of the narrative

**Step 4: Display the result**
- Show the user their primary cluster name
- Display the personalized narrative
- Include their scores/secondary info if relevant
- Provide the shareable result card

---

## Key Technical Notes

### For Scoring Engine:
- Scoring must be **deterministic** — same answers always produce same result
- No randomness, no AI interpretation at scoring stage
- Output must be JSON (structure defined in scoring_logic.md)
- Bonuses are applied AFTER Pillar 1 scoring (see Step 2 in final determination)

### For Narrative Generation:
- Narratives must be **guidance-focused**, not personality descriptions
- Voice is confident, direct, specific (see "Kai Tone" section)
- Must integrate all 4 pillars into Section 4
- Must acknowledge hard truths (see Section 5: Reality Check)

---

## Questions for the Client

Before you start coding, confirm with the client:

1. **Do we manually write the 8 narratives, or generate them with AI?**
   - Manual = hire content writer for ~2 days
   - AI = more complex to build but infinitely scalable

2. **How much personalization do we show the user?**
   - Option A: Just show them their primary cluster narrative (personalized with their archetype/driver/ecosystem)
   - Option B: Also show them their operational archetype, reward driver, ecosystem fit as separate sections
   - Option C: Show them full cluster rankings and all scores

3. **Do we need multi-language support for narratives?**
   - If yes, do we translate manually or use AI translation?

4. **What format is the shareable result card?**
   - Static image generated server-side?
   - Dynamic HTML that renders as image?
   - Instagram story template?

---

## Testing the System

Once built, test with these scenarios:

**Test 1: Clear result**
User answers show strong Technology focus (8+ questions point to Technology)
Expected: Technology as primary cluster, high confidence (50%+)

**Test 2: Distributed interests**
User answers spread evenly across 4 clusters (4 points each)
Expected: Multi-curious label, low confidence (<30%)

**Test 3: Bonuses matter**
User has Technology: 3, Science: 5, but is Explorer + Solo Sprinter (both give Technology +0.5)
Expected: Technology: 4, Science: 5 → Science wins, but Technology is close second

**Test 4: Operational archetype ties**
User answers 2-2 on both axes in Pillar 2
Expected: Tiebreakers correctly applied, one of four archetypes selected

**Test 5: Edge case — Adaptive archetype**
If all tiebreakers somehow still result in ties (shouldn't happen, but test it)
Expected: System defaults to "Adaptive" archetype (special 5th category)

---

## Timeline Estimate

Assuming full-time work:

**Backend scoring engine:** 2-3 days
- Day 1: Code Pillar 1 scoring + tests
- Day 2: Code Pillars 2-4 + final cluster determination
- Day 3: Edge cases, validation, refactoring

**Result narratives:** 2-3 days (if writing manually) OR 1 week (if building AI generation)
- Manual: 2-3 days for content writer
- AI: 3-5 days to build generation system + quality validation

**Frontend display:** 1-2 days
- Result page layout
- Shareable card generation
- User flow after completing assessment

**Total:** ~1 week for MVP (manual narratives) OR 2 weeks (AI generation)

---

## Contact

If anything is unclear or you need clarification on the logic:
- Scoring questions → check scoring_logic.md first, then ask client
- Content/voice questions → check results_narrative_framework.md first, then ask client
- Edge cases → both documents have edge case sections

---

**Good luck with the build! The logic is solid and ready to implement.**
