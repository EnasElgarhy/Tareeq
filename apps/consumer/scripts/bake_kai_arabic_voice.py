"""Record Kai's Arabic narration with the Gulf voice (docs/KAI_ARABIC_VOICE_GUIDE.md).

    python3 scripts/bake_kai_arabic_voice.py <lines.json> [id ...]

`lines.json` maps audio id -> the client's Arabic line (export it from
lib/audio/kai-narration.ts and lib/core-v2/assessment.ts). The words and
punctuation sent to the voice are the client's, unchanged: this script only
adds vowel marks so the voice reads them correctly, writes digits as words,
and rests on a sukun at each pause. Each clip is transcribed and compared with
the line; a clip whose words differ is retried, then reported.

Reads ELEVENLABS_API_KEY and GEMINI_API_KEY from .env.local (never printed).
Writes public/audio/<id>.ar.mp3. Run from apps/consumer.
"""
import base64
import json
import pathlib
import re
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(".")
OUT = ROOT / "public/audio"
VOICE_ID = "isQLuoVuANx6FjDxyasX"  # Noura, Gulf, chosen 20 Nov 2026
MODEL_ID = "eleven_v4"
SETTINGS = {"stability": 0.48, "similarity_boost": 0.84, "style": 0.28, "speed": 1}
MARKS = "ً-ْ"
ATTEMPTS = 3

# Whole phrases whose reading depends on who is doing the action.
PHRASES = {
    "مرحبًا": "مَرْحَبَا",
    "بدأت مجموعتك": "بَدَأَتْ مجموعتك",
    "شاركت مدرستك": "شارَكَتْ مدرستك",
    "أطلقت مدرستك": "أَطْلَقَتْ مدرستك",
    "تغيّرت مدينتنا": "تغيَّرَتْ مدينتنا",
    "أتيحت لك": "أُتيحَتْ لك",
    "صوّت طلاب": "صوَّتَ طلاب",
    "بدأت متجرًا": "بَدَأْتَ متجرًا",
    "تقدّم كل مجموعة": "تُقدِّمُ كل مجموعة",
    "أن تقدّم كلمة": "أن تُقدِّمَ كلمة",
    "30 يومًا": "ثلاثين يومًا",
    "وتذكّر — إنها": "وتذكَّرْ، إنها",
    "أركان وورش": "أركان وَوِرَش",
}

# Single words with more than one possible reading (keyed without marks).
WORDS = {
    "أنت": "أنتَ", "أحسنت": "أحسنْتَ", "تطوعت": "تطوَّعْتَ", "أردت": "أردْتَ",
    "كنت": "كنْتَ", "انضممت": "انضمَمْتَ", "ساعدت": "ساعدْتَ",
    "المهنية": "المِهْنيّة", "تنظم": "تُنظِّمُ", "تقيم": "تُقيمُ", "يدير": "يُديرُ",
    "تطلق": "تُطلِقُ", "طلب": "طُلِبَ", "يكلفك": "يُكلِّفُكَ", "تودعه": "تُودِّعَه",
    "تحبه": "تُحبُّه", "تحب": "تُحبُّ", "تمارس": "تُمارِسُ", "تخطط": "تُخطِّطُ",
    "تتابعه": "تُتابِعُه", "لتتابعه": "لِتُتابِعَه", "يصوت": "يُصوِّتُ", "ويصوت": "ويُصوِّتُ", "فالوجهة": "فالوِجهة",
    "لتشارك": "لِتُشارِكَ", "تبلي": "تُبْلي", "يبقيك": "يُبقيكَ", "يصبح": "يُصبِحُ",
    "يمكنك": "يُمكِنُكَ", "ويمكنك": "ويُمكِنُكَ", "يناسبك": "يُناسِبُكَ",
    "تساعدنا": "تُساعِدُنا", "تساعدني": "تُساعِدُني", "تذاكر": "تُذاكِرُ",
    "ممثل": "مُمثِّل", "مساعد": "مُساعِد", "مرشد": "مُرشِد", "بمنتج": "بِمُنتَجٍ",
    "بمهمة": "بِمَهمَّةٍ", "معرض": "مَعرِض", "لمعرض": "لِمَعرِض", "ركن": "رُكنَ",
    "مخيم": "مُخيَّم", "محمية": "مَحميّة", "سنا": "سِنًّا", "مدتها": "مُدَّتُها",
    "لمدة": "لِمُدّة", "عدة": "عِدّة", "خطة": "خُطّة", "تبرعات": "تبرُّعات",
    "حملة": "حَملة", "الحملة": "الحَملة", "الوجهة": "الوِجهة", "نمط": "نَمَطُ",
    "كاي": "كَايْ", "معلمك": "مُعلِّمُكَ", "مدربتك": "مُدَرِّبَتُكْ",
    "سأرافقك": "سَأُرافِقُكْ", "تقريرك": "تقريرُكْ",
}
# "Your" inside a phrase follows the masculine verbs of the client's lines.
SUFFIX_K = {
    "مدرستك", "صفك", "أصدقائك", "مجموعتك", "عائلتك", "لك", "مدينتك", "فراغك",
    "اهتمامك", "منك", "بنفسك", "موادك", "أقاربك", "فضولك", "يمثلك", "بوصلتك",
    "اختيارك", "لديك", "إليك",
}
LONG_ENDINGS = "اوىي"


def strip_marks(text: str) -> str:
    return re.sub(f"[{MARKS}]", "", text)


def spoken(line: str) -> str:
    """The client's line with pronunciation marks; no word is added, dropped or changed."""
    for plain, marked in PHRASES.items():
        line = line.replace(plain, marked)

    def mark(match: re.Match[str]) -> str:
        word = match.group(0)
        bare = strip_marks(word)
        if bare in WORDS:
            return WORDS[bare]
        if bare in SUFFIX_K and not re.search(f"[{MARKS}]$", word):
            return word + "َ"
        return word

    line = re.sub(f"[ء-ي{MARKS}]+", mark, line)
    # Rest on a sukun before every pause: the ending is not pronounced.
    def rest(match: re.Match[str]) -> str:
        word, pause = match.group(1), match.group(2)
        bare_last = strip_marks(word)[-1]
        if bare_last in LONG_ENDINGS or word.endswith("ً"):
            return word + pause
        return re.sub(f"[{MARKS}]*$", "", word) + "ْ" + pause

    return re.sub(f"([ء-ي{MARKS}]+)(\\s*[،.؟!:»])", rest, line)


for _plain, _marked in WORDS.items():
    assert strip_marks(_marked) == _plain, f"{_plain}: marks must not change the letters"


def env() -> dict[str, str]:
    values: dict[str, str] = {}
    for raw in (ROOT / ".env.local").read_text().splitlines():
        if "=" in raw and not raw.strip().startswith("#"):
            key, value = raw.split("=", 1)
            values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def post(url: str, body: dict, headers: dict[str, str]) -> bytes:
    request = urllib.request.Request(
        url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json", **headers}
    )
    with urllib.request.urlopen(request, timeout=240) as response:
        return response.read()


def record(text: str, key: str) -> bytes:
    return post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}?output_format=mp3_44100_128",
        {"text": text, "model_id": MODEL_ID, "language_code": "ar", "voice_settings": SETTINGS},
        {"xi-api-key": key, "Accept": "audio/mpeg"},
    )


def transcribe(audio: bytes, key: str) -> str:
    body = {
        "contents": [{"role": "user", "parts": [
            {"inlineData": {"mimeType": "audio/mpeg", "data": base64.b64encode(audio).decode()}},
            {"text": "Transcribe this Arabic audio exactly as spoken, word for word, without tashkeel. "
                     'Write numbers as words. Do not correct anything. JSON: {"transcript": ""}'},
        ]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0},
    }
    data = json.loads(post(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}",
        body, {},
    ))
    return json.loads(data["candidates"][0]["content"]["parts"][-1]["text"])["transcript"]


def words(text: str) -> list[str]:
    text = strip_marks(text).replace("ـ", "")
    text = re.sub("[أإآ]", "ا", text).replace("ى", "ي").replace("ة", "ه")
    return re.sub(r"[^\w\s]", " ", text).split()


def main() -> None:
    lines: dict[str, str] = json.loads(pathlib.Path(sys.argv[1]).read_text())
    wanted = sys.argv[2:] or list(lines)
    values = env()
    eleven, gemini = values["ELEVENLABS_API_KEY"], values["GEMINI_API_KEY"]
    for audio_id in wanted:
        text = spoken(lines[audio_id])
        target = words(spoken(lines[audio_id]))
        heard: list[str] = []
        for attempt in range(1, ATTEMPTS + 1):
            try:
                audio = record(text, eleven)
                heard = words(transcribe(audio, gemini))
            except urllib.error.HTTPError as error:
                print(f"{audio_id}: HTTP {error.code}")
                continue
            if heard == target:
                break
        (OUT / f"{audio_id}.ar.mp3").write_bytes(audio)
        status = "ok" if heard == target else "CHECK " + " ".join(heard)
        print(f"{audio_id}: {status} (take {attempt})")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--print":
        for audio_id, line in json.loads(pathlib.Path(sys.argv[2]).read_text()).items():
            print(audio_id, "|", spoken(line))
    else:
        main()
