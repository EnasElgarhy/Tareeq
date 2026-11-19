# Kai's Arabic for the UAE and the Gulf: how to write it and how to record it

Draft, 20 November 2026. For Enas to review before any Arabic audio is re-recorded.
It covers the text Kai speaks (the intro, the encouragement lines and the question
audio), not the report wording.

## 1. Which Arabic

**Simple Modern Standard Arabic, spoken the way a Gulf presenter speaks it.**

- Standard Arabic is what students read at school, and it is understood by every
  Arabic speaker in the UAE, Emirati or not. Emirati dialect would leave out the
  many students whose families come from other Arab countries, and it has no
  agreed spelling.
- The Gulf feel comes from the **voice**, not from dialect words: a Gulf-native
  speaker, everyday greetings, and endings pronounced the spoken way (section 3).
- Keep dialect words out of the script (هلا، شلونك، وايد، حيّاك). They are warm in
  person but read as informal in a school product, and a voice model mispronounces
  them more often than standard words.

Localization guides for the Gulf make the same split: standard Arabic for
functional and educational text, a Gulf voice and tone for warmth
([Translated](https://translated.com/resources/arabic-dialect-localization-choices),
[Travod](https://travod.com/blog/gulf-arabic-localization-a-strategic-checklist-for-market-success)).

## 2. Why the voice gets words wrong

Arabic is normally written without its short vowels. A voice model has to guess
them, and research on Arabic speech systems names this as the main source of
pronunciation errors ([arXiv 2311.10771](https://arxiv.org/html/2311.10771v2),
[arXiv 2603.01622](https://arxiv.org/html/2603.01622v1)). Examples from our own
lines:

| Written | Can be read as | We mean |
| --- | --- | --- |
| مرحبا | marḥaban (formal, with a ringing "-an") or marḥaba | marḥaba |
| المهنية | al-mihaniyya or al-mihniyya | al-mihniyya (from مِهْنة) |
| مدرّبتك | mudarribatuka (to a boy) or mudarribatuki (to a girl) | depends on the student |
| اقتربت | iqtarabta (boy), iqtarabti (girl), iqtarabtu (I) | depends on the student |

So the fix is in the **script we send to the voice**, not in the voice settings.

## 3. Rules for the spoken script

The screen text stays as it is. Each spoken line gets a second, voice-only version
written to these rules.

1. **Mark what can be misread, not everything.** Always mark: doubled letters
   (shadda), the endings that change with gender (كَ / كِ، تَ / تِ), and any word
   with two possible readings (المِهْنيّة، يُصبِح). Fully marked text is safest
   but roughly doubles the character cost.
2. **Rest on a sukun at every pause.** Before a comma, a full stop or a question
   mark, the last letter takes a sukun and the grammatical ending is not
   pronounced: الأسئلةْ, not الأسئلةِ. This is how presenters speak, and it removes
   most wrong endings.
3. **Only one ending is kept at a pause: "-an" on adverbs** (معًا، جدًّا، فعلًا،
   حقًّا). Write the tanween so it is said.
4. **Greetings the way people say them.** مَرْحَبَا (marḥaba), not مَرْحَبًا.
   أَهْلًا keeps its "-an". On screen, مرحبًا is the correct spelling and stays.
5. **Ta marbuta at a pause is "-ah"**, never "-at": الشخصيّةْ.
6. **Names:** كَايْ for Kai, كُورْ for CORE. Never leave Latin letters in a spoken
   line.
7. **Numbers in words:** خمسين, not 50; ثلاثة, not 3 or ٣.
8. **Punctuation is breathing.** Use commas and full stops. No dashes: the voice
   either ignores them or stops too long.
9. **Correct hamzas** (أ، إ، آ) and no stretched letters (ـــ).

## 4. Speaking to a boy or a girl

Arabic changes with the listener. The student tells us which in the background
question "هل أنت ذكر أم أنثى؟".

- **After that question:** record every spoken line twice, one addressed to a boy
  and one to a girl, and play the matching one. The on-screen text needs the same
  two versions wherever the letters differ, not only the vowels.

  | To a boy | To a girl |
  | --- | --- |
  | اقتربتَ من النهاية | اقتربتِ من النهاية |
  | واصِلْ | واصِلي |
  | أنتَ تُبلي بلاءً حسنًا | أنتِ تُبلين بلاءً حسنًا |
  | الأقرب إليكَ | الأقرب إليكِ |

- **Before that question** (the intro): one recording has to work for both. Two
  ways, to be chosen by Enas:
  - *Spoken ending:* say "your" with a sukun, مدرّبتُكْ، تقريرُكْ. In Gulf-flavoured
    standard Arabic this is heard as neutral. Purists will hear it as informal.
  - *Reworded:* avoid "you" and "your" in the intro, for example
    «مرحبا، أنا كاي، مدرّبة مهنية شخصية. سأكون معكم خلال الأسئلة، وعندما يجهز التقرير نناقشه معًا.»
    The plural (معكم) is polite and neutral, but the tone is a little more formal.

## 5. Voice and model

- **Voice:** a Gulf-native young woman. The earlier Arabic voice
  (`TnMRj7MvjNftqf5An7lL`) has been removed from ElevenLabs, so every Arabic clip
  made with it can no longer be matched. ElevenLabs lists no Emirati-accent female
  voice; the closest are its Gulf voices. Auditioned: Salma
  (`KxMRrXEjbJ6kZ93yT3fq`), Noura (`isQLuoVuANx6FjDxyasX`), Lama
  (`ulJ49j1YlxrYnPoj5o12`).
- **Model:** Eleven v4 (released 28 September 2026) is reported to be clearly more
  accurate in Arabic, Saudi dialect in particular
  ([Origami](https://origami.sa/en/blog/elevenlabs-eleven-v4-voice-ai-arabic/),
  [ElevenLabs](https://elevenlabs.io/blog/eleven-v4)). The existing clips used
  Multilingual v2.
- **Chosen 20 November 2026:** Noura on Eleven v4. All Arabic clips for the CORE
  questions and Kai's lines were re-recorded with her, the client's wording
  unchanged, using `apps/consumer/scripts/bake_kai_arabic_voice.py`.
- **One voice and one model for every Arabic clip.** Mixing them makes Kai sound
  like two people.

## 6. Checking a recording

No model check replaces a native ear. Each new clip is listened to once by an
Arabic speaker from the Gulf before it goes live; a transcription check only
confirms that no word was dropped or changed.

## Open questions for Enas

1. Which voice is Kai in Arabic?
2. The intro: spoken ending, or reworded?
3. Approval of the girl versions of the on-screen lines.
