# Kai Quality Stress Test

Generated: 2026-07-16T18:23:48.551Z

## Result

**PASS** against the current quality gate.

| Metric                         |             Result |            Gate |
| ------------------------------ | -----------------: | --------------: |
| Cases                          |   18 (9 EN / 9 AR) |              18 |
| Combined quality               |                98% |          >= 85% |
| Deterministic contract quality |               100% |   >= 90% target |
| Model-assisted rubric          |                95% |   >= 80% target |
| Intent accuracy                |               100% |            100% |
| Locale consistency             |               100% |            100% |
| Factual source coverage        |               100% |          >= 90% |
| Fallback rate                  |                 0% |              0% |
| Text-only recovery rate        |                11% |          <= 15% |
| Total latency p50 / p95        | 3007 ms / 12156 ms | p95 < 15,000 ms |
| First text p50 / p95           |   701 ms / 5465 ms |        observed |

The combined score weights deterministic contract checks at 60% and the separate rubric score at 40%. The rubric measures directness, relevance, specificity, appropriate actionability, epistemic care, and naturalness. It does not independently verify factual accuracy.

## Cases

| Case                   | Intent                  | Blocks                                   | Contract | Rubric | Combined | Total ms | Failed checks | Answer preview                                                                                                                                                                       |
| ---------------------- | ----------------------- | ---------------------------------------- | -------: | -----: | -------: | -------: | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| en-cost-spain          | fact_lookup             | source_list                              |      100 |    100 |      100 |     5122 | none          | A public bachelor's degree in Spain for an international student typically costs between €3,000 and €12,000 per year in tuition fees, with variations depending on the autonomous re |
| en-visa-spain          | fact_lookup             | source_list                              |      100 |    100 |      100 |     5040 | none          | Non-EU students planning to study in Spain for over 90 days must obtain a student visa (Type D for stays over 180 days, or a short-stay study visa for up to 180 days). Key requirem |
| en-explain-result      | explain_result          | insight_block                            |      100 |     83 |       93 |     3007 | none          | Your combination of an Explorer archetype and a Mastery driver suggests you thrive where you can navigate complex systems and solve high-stakes problems.                            |
| en-family              | family_conversation     | talking_points, checklist, family_script |      100 |     93 |       97 |     3369 | none          | Your parents likely worry about stability, so focus on the long-term professional security and global impact inherent in diplomacy.                                                  |
| en-resources           | resource_recommendation | learning_resources                       |      100 |    100 |      100 |     1554 | none          | Since you are an Explorer at heart, these resources will help you see how global systems actually function beyond the textbooks.                                                     |
| en-action-plan         | action_plan             | action_plan                              |      100 |    100 |      100 |     3062 | none          | This 7-day plan focuses on testing your interest in diplomacy through active research and networking.                                                                                |
| en-comparison          | career_comparison       | text                                     |      100 |     93 |       97 |     1431 | none          | Both paths align well with your Explorer archetype, but they demand different types of mastery. Law is about precise structural analysis, while International Relations focuses on t |
| en-university-location | university_guidance     | text                                     |      100 |     90 |       96 |     1104 | none          | Before I point you toward specific universities, where are you considering studying? The best path for Law really depends on whether you want to stay in your home region, head to t |
| en-next-step           | next_step               | text                                     |      100 |     90 |       96 |     2090 | none          | Your result points toward Law and Diplomacy, but your Explorer archetype means you should treat this as a starting point for active investigation, not a final destination. The most |
| ar-cost-spain          | fact_lookup             | source_list                              |      100 |    100 |      100 |     4169 | none          | تبلغ تكلفة البكالوريوس في جامعة حكومية في إسبانيا للطالب الدولي ما بين 1,500 و 5,000 يورو سنويًا، حيث تختلف الرسوم حسب المنطقة وجنسية الطالب (غير الاتحاد الأوروبي عادةً يدفعون أكثر |
| ar-lawyer-salary       | fact_lookup             | source_list                              |      100 |     97 |       99 |     5467 | none          | متوسط راتب المحامي في إسبانيا حاليًا يتراوح حوالي 86,493 يورو إلى 88,548 يورو سنويًا، بالإضافة إلى متوسط مكافأة قدرها 5,938 يورو. يختلف هذا الرقم بشكل كبير بناءً على الخبرة، حيث يم |
| ar-explain-result      | explain_result          | insight_block                            |      100 |     93 |       97 |     2999 | none          | تظهر نتيجتك هذا المسار لأنك تجمع بين حب الاستكشاف ورغبة عميقة في الإتقان، وهو مزيج مثالي للمجالات التي تتطلب تحليلاً دقيقاً وتفاعلاً إنسانياً.                                       |
| ar-family              | family_conversation     | talking_points, checklist, family_script |      100 |     97 |       99 |     5127 | none          | إقناع الأهل يتطلب التركيز على القيمة المهنية والفرص العالمية التي يفتحها هذا التخصص لك.                                                                                              |
| ar-resources           | resource_recommendation | learning_resources                       |      100 |     97 |       99 |     1918 | none          | بما أن اهتمامك يميل نحو الدبلوماسية، فمن الرائع أن تبدأ بفهم كيف تدار العلاقات بين الدول بعيداً عن التنظير الجامد.                                                                   |
| ar-action-plan         | action_plan             | action_plan                              |      100 |     93 |       97 |     1856 | none          | بما أنكِ تميلين إلى الإتقان وتستكشفين القانون، فهذه الخطة ستساعدكِ على فهم واقع هذا المجال بعيداً عن الكتب الأكاديمية.                                                               |
| ar-comparison          | career_comparison       | text                                     |      100 |     97 |       99 |    11607 | none          | دراسة القانون تركز على القواعد والأنظمة والتحليل المنطقي للنزاعات، بينما تركز العلاقات الدولية على السياسة العالمية والتحليل الاستراتيجي وتفاعلات الدول. إليك مقارنة سريعة لتساعدك ف |
| ar-confidence          | confidence_building     | reflection_question                      |      100 |     97 |       99 |     1432 | none          | القلق طبيعي جدًا عند التفكير في مسار يتطلب مهارات عالية مثل الدبلوماسية، لكن ملفك يشير إلى أنك تملكين الأدوات الأساسية للنجاح فيه.                                                   |
| ar-study-plan          | study_plan              | text                                     |      100 |     87 |       95 |    12156 | none          | بما أنكِ تستعدين لدراسة التاريخ، سنركز على ربط الأحداث بالسياق الدبلوماسي الذي يثير اهتمامك. إليكِ خطة لمدة أسبوعين لتركيز جهودك: 1. مراجعة الجداول الزمنية الكبرى وتقسيمها إلى حقب  |

## Diagnostics

- **en-cost-spain:** Clear, accurate, and provides helpful context regarding regional cost variations.
- **en-visa-spain:** Comprehensive and well-structured; covers essential requirements and procedural steps effectively.
- **en-explain-result:** Good synthesis of the user's archetype, though the connection to 'Law' specifically could be more detailed.
- **en-family:** Practical and empathetic advice; the script and checklist provide immediate, usable value.
- **en-resources:** Excellent selection of resources with clear justifications tailored to the user's profile.
- **en-action-plan:** Highly actionable and well-paced plan that encourages active exploration.
- **en-comparison:** Excellent conceptual comparison that effectively links the fields to the user's archetype.
- **en-university-location:** Good use of a clarifying question to narrow down a broad request.
- **en-next-step:** Provides sound strategic advice, though could be more specific with examples of 'hands-on experience'.
- **ar-cost-spain:** Very clear and informative response with realistic ranges and context.
- **ar-lawyer-salary:** Provides detailed data, though the high average figure might be misleading without clarifying it often reflects senior roles.
- **ar-explain-result:** Well-structured explanation that effectively synthesizes the user's profile with the career path.
- **ar-family:** Excellent, empathetic, and structured advice that provides actionable scripts for a sensitive topic.
- **ar-resources:** High-quality recommendations with clear reasoning, though Kissinger's book is quite advanced for a beginner.
- **ar-action-plan:** Good tasks, but the plan is labeled as 7 days while the tasks only cover a few hours of work; it lacks a daily schedule.
- **ar-comparison:** Clear and balanced comparison, providing helpful context regarding career mobility and degree recognition.
- **ar-confidence:** Supportive and professional; the reflective question is an excellent coaching technique.
- **ar-study-plan:** The advice is sound but generic; it lacks a specific day-by-day breakdown for the two-week period.

## Method

- Exercised the real local `/api/kai/chat` endpoint with a confirmed disposable Supabase account.
- Ran 18 independent prompts with concurrency 2 across factual, result explanation, family, resource, action-plan, comparison, university, confidence, next-step, and study-plan intents.
- Factual cases required provider-grounded source metadata and rejected unsolicited action plans.
- The disposable account was deleted after the run.
