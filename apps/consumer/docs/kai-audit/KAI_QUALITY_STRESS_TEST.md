# Kai Quality Stress Test

Generated: 2026-07-16T19:11:55.441Z

## Result

**PASS** against the current quality gate.

| Metric | Result | Gate |
| --- | ---: | ---: |
| Cases | 18 (9 EN / 9 AR) | 18 |
| Combined quality | 97% | >= 85% |
| Deterministic contract quality | 100% | >= 90% target |
| Model-assisted rubric | 92% | >= 80% target |
| Intent accuracy | 100% | 100% |
| Locale consistency | 100% | 100% |
| Factual source coverage | 100% | >= 90% |
| Fallback rate | 0% | 0% |
| Text-only recovery rate | 0% | <= 15% |
| Total latency p50 / p95 | 3333 ms / 5675 ms | p95 < 15,000 ms |
| First text p50 / p95 | 737 ms / 5674 ms | observed |

The combined score weights deterministic contract checks at 60% and the separate rubric score at 40%. The rubric measures directness, relevance, specificity, appropriate actionability, epistemic care, and naturalness. It does not independently verify factual accuracy.

## Cases

| Case | Intent | Blocks | Contract | Rubric | Combined | Total ms | Failed checks | Answer preview |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| en-cost-spain | fact_lookup | source_list | 100 | 97 | 99 | 3115 | none | A public bachelor's degree in Spain for an international student (non-EU/EEA) typically costs between €3,000 and €12,000 per academic year for tuition, with some sources indicating |
| en-visa-spain | fact_lookup | source_list | 100 | 93 | 97 | 5654 | none | To obtain a student visa for Spain, non-EU students must provide a valid passport, an official letter of acceptance from a recognized Spanish educational institution, and proof of  |
| en-explain-result | explain_result | insight_block | 100 | 60 | 84 | 2948 | none | Your result reflects a unique blend of analytical depth and a desire to navigate complex, global systems. |
| en-family | family_conversation | talking_points, checklist, family_script | 100 | 93 | 97 | 2969 | none | Your parents likely worry about the stability of a path like diplomacy, so focus your conversation on the concrete skills and global opportunities it provides. |
| en-resources | resource_recommendation | learning_resources | 100 | 97 | 99 | 1491 | none | Since you are an Explorer who thrives on mastery, these resources will give you a solid foundation in the complexities of international relations. |
| en-action-plan | action_plan | action_plan | 100 | 100 | 100 | 3336 | none | Since you are an Explorer at heart, this plan focuses on testing the reality of diplomatic work against your interest in studying abroad. |
| en-comparison | career_comparison | comparison_table | 100 | 100 | 100 | 3532 | none | Comparing Law programs in Spain and Egypt involves weighing different legal systems and international exposure. |
| en-university-location | university_guidance | text | 100 | 97 | 99 | 1634 | none | To give you a meaningful list, I need to know where you are considering studying. Are you looking at universities in your home region, or are you planning to study abroad? |
| en-next-step | next_step | text | 100 | 90 | 96 | 1617 | none | Your results highlight a clear path in Law and Diplomacy, but your Explorer archetype means you need to test this in the real world before committing. The best next step is to unlo |
| ar-cost-spain | fact_lookup | source_list | 100 | 100 | 100 | 4418 | none | تبلغ تكلفة البكالوريوس في جامعة حكومية في إسبانيا للطالب الدولي ما بين 700 يورو و6,000 يورو سنويًا، حيث تختلف الرسوم حسب المنطقة والجامعة والتخصص. أما تكاليف المعيشة التقديرية فتتر |
| ar-lawyer-salary | fact_lookup | source_list | 100 | 100 | 100 | 5675 | none | متوسط راتب المحامي في إسبانيا حاليًا يتراوح بشكل عام بين 52,000 يورو و 87,705 يورو سنويًا. تختلف هذه الأرقام بناءً على الخبرة، حيث يمكن أن يبدأ المحامي المبتدئ بحوالي 59,000 يورو،  |
| ar-explain-result | explain_result | insight_block | 100 | 63 | 85 | 3135 | none | Your score reflects a natural drive for mastery and a curiosity that thrives in complex, structured environments. |
| ar-family | family_conversation | talking_points, checklist, family_script | 100 | 97 | 99 | 3715 | none | إقناع الأهل يتطلب التركيز على القيمة العملية والمهارات التي ستكتسبينها في تخصص العلاقات الدولية. |
| ar-resources | resource_recommendation | learning_resources | 100 | 93 | 97 | 3333 | none | بما أن اهتمامك يميل نحو الدبلوماسية، فمن الرائع البدء بمصادر تبسط لك هذا العالم المعقد وتوضح طبيعة العمل فيه. |
| ar-action-plan | action_plan | action_plan | 100 | 90 | 96 | 3870 | none | بما أنكِ تميلين بطبعك المستكشف، فالقانون ليس مجرد نصوص، بل هو أداة لفهم كيف يعمل العالم؛ إليكِ خطة عملية لتبدئي رحلة الاستكشاف هذه. |
| ar-comparison | career_comparison | comparison_table | 100 | 100 | 100 | 3730 | none | سارة، كلا المسارين يغذي فضولك المستكشف، لكنهما يختلفان في التركيز اليومي وطبيعة الأثر الذي ستتركينه. |
| ar-confidence | confidence_building | reflection_question | 100 | 97 | 99 | 1662 | none | من الطبيعي تمامًا أن تشعر بهذا التردد، فمسار الدبلوماسية يتطلب مهارات متنوعة قد تبدو بعيدة المنال في البداية. دعنا ننظر إلى ما يجعلك مناسبًا لهذا المجال بناءً على ملفك الشخصي. |
| ar-study-plan | study_plan | action_plan | 100 | 93 | 97 | 4109 | none | هذه خطة عملية لمدة أسبوعين لتركيز جهودك في مادة التاريخ وتثبيت المعلومات بشكل فعال. |

## Diagnostics

- **en-cost-spain:** Excellent, balanced answer that acknowledges conflicting data points transparently.
- **en-visa-spain:** Very helpful and comprehensive; good handling of varying financial requirements.
- **en-explain-result:** Too vague and reliant on 'archetype' jargon rather than concrete reasoning.
- **en-family:** Practical and empathetic advice with useful, actionable scripts.
- **en-resources:** Good recommendations, though Kissinger's 'World Order' is quite dense for a 'beginner' label.
- **en-action-plan:** Well-structured, realistic, and highly actionable plan.
- **en-comparison:** Excellent structured comparison that provides clear, actionable insights into the differences between the two legal systems.
- **en-university-location:** Appropriate clarification request; it avoids guessing and prompts the user for necessary context.
- **en-next-step:** Clear and encouraging, though it relies on internal platform terminology which might be confusing without prior context.
- **ar-cost-spain:** Provides precise, helpful data with clear caveats regarding regional cost variations.
- **ar-lawyer-salary:** Very informative and well-sourced; the ranges provided are realistic for the Spanish legal market.
- **ar-explain-result:** The answer starts in English despite the question being in Arabic, which is a significant naturalness failure.
- **ar-family:** Excellent, empathetic, and structured advice that provides actionable scripts for a sensitive situation.
- **ar-resources:** Good recommendations, though Kissinger's 'Diplomacy' is quite advanced for a beginner; the tone is encouraging.
- **ar-action-plan:** The plan is well-structured, but the tasks provided only cover a few hours of work rather than a full 7-day schedule.
- **ar-comparison:** Clear, concise, and highly effective comparison table that highlights key differences for a student.
- **ar-confidence:** Excellent coaching approach; it validates the user's feelings and uses a reflective question to deepen the conversation.
- **ar-study-plan:** Good study techniques provided, but the plan lacks a day-by-day breakdown for the full 14-day duration requested.

## Method

- Exercised the real local `/api/kai/chat` endpoint with a confirmed disposable Supabase account.
- Ran 18 independent prompts with concurrency 2 across factual, result explanation, family, resource, action-plan, comparison, university, confidence, next-step, and study-plan intents.
- Factual cases required provider-grounded source metadata and rejected unsolicited action plans.
- The disposable account was deleted after the run.
