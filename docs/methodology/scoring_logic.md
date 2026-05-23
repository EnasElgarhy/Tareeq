# CORE Assessment Scoring Logic
**Version 1.0 | For Developer Implementation**

---

## Overview

This document defines the **deterministic scoring engine** for the CORE Assessment. Every answer produces a predictable, reproducible result. No randomness. No AI interpretation at the scoring stage. The AI guidance comes *after* scoring, not during.

---

## The 8 Career Clusters

Every user is scored across these 8 clusters. The highest-scoring cluster becomes their **primary result**.

1. **Technology** — Software, systems, AI, digital infrastructure
2. **Engineering** — Mechanical design, robotics, physical systems, building
3. **Science/Data** — Research, analysis, patterns, life sciences, quantitative thinking
4. **Arts/Media** — Storytelling, design, creative expression, communication
5. **Business** — Strategy, entrepreneurship, commerce, profit-oriented thinking
6. **Law/Diplomacy** — Governance, negotiation, policy, international relations
7. **People/Psychology** — Human behavior, wellness, community, interpersonal dynamics
8. **Environment** — Ecology, sustainability, natural systems, conservation

---

## Pillar 1: Curiosities (Questions 1-16)

**Purpose:** Identifies which career clusters genuinely interest the user.

**Scoring Method:** Direct mapping. Each answer option maps to one or more career clusters. When a user selects an answer, those clusters each receive **+1 point**.

### Question-by-Question Mapping

**Q1:** You're refreshing your feed. Which video is an immediate click?
- A → Business (+1)
- B → Engineering (+1)
- C → People/Psychology (+1)
- D → Technology (+1)

**Q2:** You're watching an investigation show. Which character's work is most interesting?
- A → Law/Diplomacy (+1)
- B → Arts/Media (+1)
- C → Science/Data (+1)
- D → People/Psychology (+1)

**Q3:** Your school adds a new "Future Skills" elective. Which one do you sign up for?
- A → Business (+1)
- B → Environment (+1)
- C → Engineering (+1)
- D → Law/Diplomacy (+1)

**Q4:** Your friends are having a long debate at lunch. Which topic pulls YOU in most?
- A → People/Psychology (+1)
- B → Environment (+1)
- C → Law/Diplomacy (+1)
- D → Technology (+1)

**Q5:** To make a school project actually interesting, what would YOU add?
- A → People/Psychology (+1)
- B → Science/Data (+1)
- C → Arts/Media (+1)
- D → Technology (+1)

**Q6:** You're helping out at a local festival. Which tent do you run?
- A → Environment (+1)
- B → Engineering (+1)
- C → Arts/Media (+1)
- D → Law/Diplomacy (+1)

**Q7:** Which news headline makes you most curious to click?
- A → Law/Diplomacy (+1)
- B → Science/Data (+1)
- C → Science/Data (+1)
- D → Arts/Media (+1)

**Q8:** You've been given a major grant. What do you build?
- A → Business (+1)
- B → Engineering (+1)
- C → Environment (+1)
- D → People/Psychology (+1)

**Q9:** A new community rule is announced that everyone hates. What's your instinct?
- A → Law/Diplomacy (+1)
- B → Technology (+1)
- C → People/Psychology (+1)
- D → Science/Data (+1)

**Q10:** A public controversy is trending online. Which angle interests you most?
- A → Law/Diplomacy (+1)
- B → Science/Data (+1)
- C → Arts/Media (+1)
- D → Business (+1)

**Q11:** Which task would you find MOST enjoyable to help someone with?
- A → Law/Diplomacy (+1)
- B → Engineering (+1)
- C → Environment (+1)
- D → Business (+1)

**Q12:** You open a news app. Which topics pull you?
- A → Law/Diplomacy (+1)
- B → Science/Data (+1)
- C → Arts/Media (+1)
- D → Business (+1)

**Q13:** You win a major international youth award. Which category?
- A → Arts/Media (+1)
- B → Business (+1)
- C → Environment (+1)
- D → Engineering (+1)

**Q14:** You have an empty studio for a month. What do you turn it into?
- A → Arts/Media (+1)
- B → Engineering (+1)
- C → Science/Data (+1)
- D → People/Psychology (+1)

**Q15:** Which skill would you download into your brain instantly?
- A → Technology (+1)
- B → Law/Diplomacy (+1)
- C → Environment (+1)
- D → Science/Data (+1)

**Q16:** You have a free week to join one exclusive masterclass. Which one?
- A → Law/Diplomacy (+1)
- B → Business (+1)
- C → Environment (+1)
- D → Arts/Media (+1)

### Pillar 1 Scoring Output

After processing all 16 questions, each cluster has a score from 0 to 16.

**Example output:**
```json
{
  "Technology": 3,
  "Engineering": 2,
  "Science/Data": 5,
  "Arts/Media": 1,
  "Business": 2,
  "Law/Diplomacy": 1,
  "People/Psychology": 4,
  "Environment": 2
}
```

**Total should equal 16** (one point per question).

---

## Pillar 2: Operations (Questions 17-24)

**Purpose:** Identifies HOW the user naturally operates — their cognitive and execution style.

**Scoring Method:** Two-axis scoring produces one of four **Operational Archetypes**.

### The Two Axes

**Axis 1: Processing Style** (Questions 17-20)
- **Structured** = Prefers plans, steps, guidelines, predictability
- **Flexible** = Prefers improvisation, learning by doing, adaptability

**Axis 2: Scope of Focus** (Questions 21-24)
- **Deep** = Prefers going narrow and mastering details
- **Broad** = Prefers connecting many things and seeing big pictures

### Question-by-Question Scoring

**Q17:** Learning something new — your instinct is:
- A → Structured (+1)
- B → Flexible (+1)

**Q18:** Huge project due in two weeks. Your brain:
- A → Structured (+1)
- B → Flexible (+1)

**Q19:** Managing a group project. How do you make sure things get done?
- A → Structured (+1)
- B → Flexible (+1)

**Q20:** Using a new creative app for the first time. What do you do?
- A → Structured (+1)
- B → Flexible (+1)

**Q21:** When you get really into a topic, you tend to:
- A → Deep (+1)
- B → Broad (+1)

**Q22:** You see an interesting invention online. What catches your attention?
- A → Deep (+1)
- B → Broad (+1)

**Q23:** Free month to learn something new. You'd rather:
- A → Deep (+1)
- B → Broad (+1)

**Q24:** Movie with massive plot twist, you usually:
- A → Deep (+1)
- B → Broad (+1)

### Determining the Operational Archetype

Count the total for each axis:
- **Processing axis:** Structured score (0-4) vs Flexible score (0-4)
- **Focus axis:** Deep score (0-4) vs Broad score (0-4)

**If Structured > Flexible AND Deep > Broad** → **Precisionist**
- Likes: Clear systems, mastery, depth, technical excellence
- Example fields: Research, specialized engineering, data analysis, architecture

**If Structured > Flexible AND Broad > Deep** → **Coordinator**
- Likes: Planning, organizing, connecting pieces, project management
- Example fields: Operations, program management, event planning, systems design

**If Flexible > Structured AND Deep > Broad** → **Explorer**
- Likes: Improvising, diving deep into new things, hands-on learning
- Example fields: Startups, troubleshooting, field research, investigative work

**If Flexible > Structured AND Broad > Deep** → **Catalyst**
- Likes: Fast-moving environments, connecting people/ideas, big-picture pivots
- Example fields: Entrepreneurship, consulting, media production, diplomacy

### Tie-Breaking Rules

**If Processing axis is tied (2-2):**
Look at Q18 (project deadline question) as the tiebreaker. If they chose A (plan from day one), classify as Structured. If B (deadline pressure), classify as Flexible.

**If Focus axis is tied (2-2):**
Look at Q21 (deep vs wide topic exploration) as the tiebreaker. If A (deep into one aspect), classify as Deep. If B (read widely), classify as Broad.

### Pillar 2 Output

```json
{
  "operational_archetype": "Explorer",
  "processing_style": "Flexible",
  "scope_of_focus": "Deep"
}
```

---

## Pillar 3: Rewards (Questions 25-34)

**Purpose:** Identifies WHY the user strives for success — their core motivational drivers.

**Scoring Method:** Five motivational drivers tested through 10 forced-choice questions. Each driver appears in exactly 2 questions.

### The 5 Motivational Drivers

1. **Recognition** — Being known, respected, visible, admired
2. **Impact** — Making a tangible difference, helping others, creating change
3. **Autonomy** — Freedom, independence, control over own path
4. **Mastery** — Deep expertise, being the best, rare skills
5. **Stability** — Security, predictability, reliable income, clear path

### Question-by-Question Scoring

**Q25:** Which comment would make your work feel worth it?
- A → Recognition (+1)
- B → Impact (+1)

**Q26:** You're offered a Golden Ticket reward. Which do you grab?
- A → Recognition (+1)
- B → Autonomy (+1)

**Q27:** You're entering a contest. What's the win that matters most?
- A → Mastery (+1)
- B → Impact (+1)

**Q28:** What do you most want to be able to say about your life in 10 years?
- A → Stability (+1)
- B → Recognition (+1)

**Q29:** What would make you feel most successful at the end of a major project?
- A → Mastery (+1)
- B → Recognition (+1)

**Q30:** You're faced with a task everyone else has given up on. You keep going because:
- A → Mastery (+1)
- B → Impact (+1)

**Q31:** If you started something online, which stat would you care about most?
- A → Recognition (+1)
- B → Autonomy (+1)

**Q32:** When thinking about a career path, what is your must-have?
- A → Stability (+1)
- B → Impact (+1)

**Q33:** You receive two job offers after graduating. Which is more appealing?
- A → Stability (+1)
- B → Autonomy (+1)

**Q34:** If you could design your ideal working life, what's your goal?
- A → Autonomy (+1)
- B → Mastery (+1)

### Pillar 3 Output

Each driver receives a score from 0 to 2.

**Example:**
```json
{
  "Recognition": 2,
  "Impact": 1,
  "Autonomy": 2,
  "Mastery": 0,
  "Stability": 0
}
```

**Identify Primary and Secondary drivers:**
- **Primary** = Highest score (if tied, list all tied drivers as co-primary)
- **Secondary** = Second-highest score (if exists)

**Result:**
```json
{
  "primary_driver": "Recognition, Autonomy",
  "secondary_driver": "Impact"
}
```

---

## Pillar 4: Ecosystems (Questions 35-40)

**Purpose:** Identifies WHERE the user thrives — their preferred working conditions.

**Scoring Method:** Two-axis scoring produces one of four **Ecosystem Fit** profiles.

### The Two Axes

**Axis 1: Social Battery** (Questions 35-37)
- **Collaborative** = Thrives around others, energized by interaction
- **Independent** = Thrives in quiet, energized by solo work

**Axis 2: Environmental Pulse** (Questions 38-40)
- **Dynamic** = Prefers fast-moving, unpredictable, high-energy environments
- **Predictable** = Prefers stable, planned, steady-paced environments

### Question-by-Question Scoring

**Q35:** You have to focus on something difficult for an hour. Ideal setup?
- A → Collaborative (+1)
- B → Independent (+1)

**Q36:** You need an answer from a teammate. You:
- A → Collaborative (+1)
- B → Independent (+1)

**Q37:** You're in a group making a big decision. Your comfort zone:
- A → Collaborative (+1)
- B → Independent (+1)

**Q38:** You're in a team for a pop-up event. Which phase do you enjoy more?
- A → Dynamic (+1)
- B → Predictable (+1)

**Q39:** When you picture your future workspace, what does it look like?
- A → Dynamic (+1)
- B → Predictable (+1)

**Q40:** You're organizing a weekend hangout. Your approach:
- A → Dynamic (+1)
- B → Predictable (+1)

### Determining Ecosystem Fit

Count the total for each axis:
- **Social axis:** Collaborative score (0-3) vs Independent score (0-3)
- **Pulse axis:** Dynamic score (0-3) vs Predictable score (0-3)

**If Collaborative > Independent AND Dynamic > Predictable** → **High-Energy Team Player**
- Best in: Startups, agencies, fast-paced collaborative environments

**If Collaborative > Independent AND Predictable > Dynamic** → **Structured Team Player**
- Best in: Corporate teams, academic labs, institutional settings

**If Independent > Collaborative AND Dynamic > Predictable** → **Solo Sprinter**
- Best in: Freelancing, research, remote roles with autonomy and variety

**If Independent > Collaborative AND Predictable > Dynamic** → **Solo Specialist**
- Best in: Deep technical work, independent research, focused long-term projects

### Tie-Breaking Rules

**If Social axis is tied (1.5-1.5 shouldn't happen with 3 questions, but if you get creative with weighting):**
Look at Q36 (teammate communication question) as tiebreaker.

**If Pulse axis is tied (1.5-1.5):**
Look at Q38 (launch day vs build-up) as tiebreaker.

### Pillar 4 Output

```json
{
  "ecosystem_fit": "Solo Sprinter",
  "social_battery": "Independent",
  "environmental_pulse": "Dynamic"
}
```

---

## Final Career Cluster Determination

Now that all four pillars are scored, determine the user's **final career cluster** (their "Compass direction").

### Step 1: Rank the Clusters by Curiosity Score

From Pillar 1, take the 8 clusters and rank them by score (highest to lowest).

**Example:**
```
1. Science/Data: 5
2. People/Psychology: 4
3. Technology: 3
4. Engineering: 2
5. Business: 2
6. Environment: 2
7. Arts/Media: 1
8. Law/Diplomacy: 1
```

### Step 2: Apply Operational and Ecosystem Modifiers

Certain Operational Archetypes and Ecosystem profiles have **natural affinities** with certain clusters. If the user's archetype or ecosystem strongly aligns with a cluster, add **+0.5 bonus points** to that cluster.

**Operational Archetype Bonuses:**
- **Precisionist** → Science/Data (+0.5), Engineering (+0.5)
- **Coordinator** → Business (+0.5), Law/Diplomacy (+0.5)
- **Explorer** → Technology (+0.5), Environment (+0.5)
- **Catalyst** → Arts/Media (+0.5), People/Psychology (+0.5)

**Ecosystem Fit Bonuses:**
- **High-Energy Team Player** → Business (+0.5), People/Psychology (+0.5)
- **Structured Team Player** → Law/Diplomacy (+0.5), Engineering (+0.5)
- **Solo Sprinter** → Technology (+0.5), Arts/Media (+0.5)
- **Solo Specialist** → Science/Data (+0.5), Environment (+0.5)

**Apply bonuses and re-rank.**

**Example (continued):**
User is an **Explorer** (bonuses to Technology, Environment) and **Solo Sprinter** (bonuses to Technology, Arts/Media).

```
Original:
- Science/Data: 5
- People/Psychology: 4
- Technology: 3
- Environment: 2

After bonuses:
- Science/Data: 5
- Technology: 4 (3 + 0.5 + 0.5)
- People/Psychology: 4
- Environment: 2.5 (2 + 0.5)
```

### Step 3: Determine Primary Cluster

The **highest-scoring cluster after bonuses** is the user's primary career cluster.

**If there's a tie for first place:**
The tie-breaker is the **raw Pillar 1 score** (before bonuses). Whichever tied cluster had the higher raw curiosity score wins.

### Step 4: Calculate Confidence Score

The **confidence score** indicates how clear the result is. It's calculated as:

**Confidence = (Primary Score / Total Possible Points) × 100**

Where **Total Possible Points = 16** (the maximum any cluster can score in Pillar 1 before bonuses).

**Example:**
If the primary cluster is Technology with a final score of 4, then:
- Confidence = (4 / 16) × 100 = 25%

**Confidence Interpretation:**
- **40%+** = High confidence (strong, clear direction)
- **25-39%** = Moderate confidence (clear but not overwhelming)
- **Below 25%** = Low confidence (user's interests are distributed; they're multi-curious)

### Final Output

```json
{
  "primary_cluster": "Technology",
  "primary_cluster_score": 4.0,
  "confidence_percentage": 25,
  "confidence_label": "Moderate",
  "cluster_rankings": [
    {"cluster": "Science/Data", "score": 5.0},
    {"cluster": "Technology", "score": 4.0},
    {"cluster": "People/Psychology", "score": 4.0},
    {"cluster": "Environment", "score": 2.5},
    ...
  ],
  "operational_archetype": "Explorer",
  "primary_reward_driver": "Autonomy",
  "secondary_reward_driver": "Impact",
  "ecosystem_fit": "Solo Sprinter"
}
```

---

## Edge Cases & Special Rules

### Edge Case 1: Perfectly Distributed Interests

If the top 3 clusters are all within 1 point of each other after bonuses:
- Label the result as **"Multi-Curious"**
- List all 3 clusters as co-primaries
- In the narrative, frame this as: "Your interests span multiple domains. You're a connector, not a specialist."

### Edge Case 2: No Clear Reward Driver

If all 5 reward drivers scored 0 or 1 (meaning the user didn't strongly choose any):
- Label as **"Balanced"** motivations
- In the narrative: "You're motivated by a blend of factors — context and team matter more than any single driver."

### Edge Case 3: Tied Operational Archetype Axes

If both axes tied (2-2 on both):
- Use Q18 for Processing axis tiebreak
- Use Q21 for Focus axis tiebreak
- If still tied after tiebreakers (shouldn't happen), default to **"Adaptive"** archetype (not one of the four, a special fifth)

---

## Validation Tests

Before deploying, test these 5 example profiles to confirm scoring works correctly:

**Test Profile 1: Clear Technology Focus**
- Pillar 1: Selects Technology-related answers in 10+ questions
- Expected: Technology as primary cluster, confidence >60%

**Test Profile 2: Distributed Interests**
- Pillar 1: Selects evenly across 4-5 clusters (3 points each)
- Expected: Multi-Curious label, confidence <30%

**Test Profile 3: Operations Edge Case**
- Pillar 2: Answers 2-2 on both axes
- Expected: Tiebreakers applied correctly, one of the four archetypes selected

**Test Profile 4: All Stability Answers**
- Pillar 3: Selects Stability in both questions where it appears
- Expected: Stability = 2, Primary Driver = "Stability"

**Test Profile 5: Bonus Points Matter**
- Pillar 1: Technology = 3, Science = 5, User is Explorer + Solo Sprinter
- After bonuses: Technology = 4, Science = 5
- Expected: Science wins (higher raw score), but Technology should be close second

---

**End of Scoring Logic Document**

**Next Steps for Developer:**
1. Build the scoring engine following this logic exactly
2. Create unit tests for each pillar
3. Test the 5 validation profiles above
4. Ensure the output JSON matches the structure defined
5. Pass the scored results to the AI narrative generation system (see separate document)
