#!/usr/bin/env python3
"""
Pre-generate narration for Tareeq. The browser only plays local files;
credentials and local model dependencies stay server-side.

Setup:
  gcloud auth application-default login
  export GOOGLE_CLOUD_PROJECT=your-project-id

Examples:
  python3 bake_audio.py
  python3 bake_audio.py --force
  python3 bake_audio.py --voice Charon --model gemini-2.5-pro-tts
  python3 bake_audio.py --provider xtts --speaker-wav nour.wav --locale ar --out-dir audio_ar
"""

import argparse
import base64
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
import wave
from pathlib import Path
from typing import Optional

API_PATH = "/v1/text:synthesize"

VALID_MODELS = [
    "gemini-3.1-flash-tts-preview",
    "gemini-2.5-flash-tts",
    "gemini-2.5-flash-lite-preview-tts",
    "gemini-2.5-pro-tts",
]

GEMINI_API_MODELS = [
    "gemini-2.5-flash-preview-tts",
    "gemini-2.5-pro-preview-tts",
]

DEFAULT_CLOUD_MODEL = "gemini-2.5-flash-tts"
DEFAULT_GEMINI_API_MODEL = "gemini-2.5-flash-preview-tts"
DEFAULT_XTTS_MODEL = "tts_models/multilingual/multi-dataset/xtts_v2"
XTTS_LANGUAGES = {
    "ar", "en", "es", "fr", "de", "it", "pt", "pl", "tr", "ru", "nl",
    "cs", "zh-cn", "ja", "hu", "ko", "hi",
}

KNOWN_VOICES = [
    "Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede",
    "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome",
    "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus",
    "Puck", "Pulcherrima", "Rasalgethi", "Sadachbia", "Sadaltager",
    "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr",
    "Zubenelgenubi",
]

DEFAULT_PROMPT = (
    "You are Nour, a warm career-discovery guide for youth in the Middle East "
    "and North Africa. Read the line in clear, friendly English with a calm "
    "coach-like tone. Keep the pace natural and easy for English learners."
)

QUESTION_PATTERN = re.compile(
    r'\{\s*id\s*:\s*"(Q[D]?\d+)"\s*,\s*title\s*:\s*"((?:[^"\\]|\\.)*)"',
    re.S,
)

EXTRA_LINES = [
    ("kai_intro",
     "Hey, I'm Nour. Think of me as a filter for all the noise. "
     "There are no wrong answers here - just pick what you would actually do, "
     "or the closest thing to it."),
    ("kai_results",
     "Nice work. Here's your Career Compass. Remember - this is a compass, "
     "not a GPS. You still get to choose the destination."),
]

_XTTS_CACHE = {}


def js_string_unescape(s: str) -> str:
    return (
        s.replace(r"\\", "\x00")
         .replace(r"\"", '"')
         .replace(r"\n", "\n")
         .replace(r"\t", "\t")
         .replace("\x00", "\\")
    )


def extract_questions(html_path: Path):
    src = html_path.read_text(encoding="utf-8")
    out = []
    seen = set()
    for m in QUESTION_PATTERN.finditer(src):
        qid, raw = m.group(1), m.group(2)
        if qid in seen:
            continue
        seen.add(qid)
        out.append((qid, js_string_unescape(raw)))
    out.extend(EXTRA_LINES)
    return out


def endpoint_for_location(location: str) -> str:
    host = "texttospeech.googleapis.com"
    if location and location != "global":
        host = f"{location}-texttospeech.googleapis.com"
    return f"https://{host}{API_PATH}"


def resolve_access_token(explicit_token: Optional[str]) -> Optional[str]:
    if explicit_token:
        return explicit_token
    env_token = (
        os.environ.get("GOOGLE_OAUTH_ACCESS_TOKEN")
        or os.environ.get("GOOGLE_ACCESS_TOKEN")
    )
    if env_token:
        return env_token

    try:
        proc = subprocess.run(
            ["gcloud", "auth", "application-default", "print-access-token"],
            check=True,
            capture_output=True,
            text=True,
            timeout=20,
        )
    except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return None
    return proc.stdout.strip() or None


def call_cloud_tts(*, access_token: str, project_id: str, text: str, prompt: str,
                   voice: str, model: str, language_code: str, location: str,
                   out_path: Path, timeout: int = 90) -> None:
    body = json.dumps({
        "input": {
            "prompt": prompt,
            "text": text,
        },
        "voice": {
            "languageCode": language_code,
            "name": voice,
            "model_name": model,
        },
        "audioConfig": {
            "audioEncoding": "MP3",
        },
    }).encode("utf-8")

    req = urllib.request.Request(
        endpoint_for_location(location),
        data=body,
        headers={
            "Authorization": f"Bearer {access_token}",
            "x-goog-user-project": project_id,
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=timeout) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    audio_b64 = payload.get("audioContent")
    if not audio_b64:
        raise RuntimeError("Text-to-Speech response did not include audioContent")

    data = base64.b64decode(audio_b64)
    tmp = out_path.with_suffix(out_path.suffix + ".tmp")
    tmp.write_bytes(data)
    tmp.replace(out_path)


def write_wave(out_path: Path, pcm: bytes, channels: int = 1,
               rate: int = 24000, sample_width: int = 2) -> None:
    tmp = out_path.with_suffix(out_path.suffix + ".tmp")
    with wave.open(str(tmp), "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(rate)
        wf.writeframes(pcm)
    tmp.replace(out_path)


def call_gemini_api_tts(*, api_key: str, text: str, prompt: str, voice: str,
                        model: str, out_path: Path, timeout: int = 90) -> None:
    body = json.dumps({
        "contents": [{
            "parts": [{
                "text": f"{prompt}\n\nRead exactly this line:\n{text}",
            }],
        }],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {
                        "voiceName": voice,
                    },
                },
            },
        },
        "model": model,
    }).encode("utf-8")

    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        data=body,
        headers={
            "x-goog-api-key": api_key,
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=timeout) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    try:
        audio_b64 = payload["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError("Gemini API response did not include inline audio data") from exc

    write_wave(out_path, base64.b64decode(audio_b64))


def xtts_language_code(locale_or_language: str) -> str:
    code = (locale_or_language or "en").strip().replace("_", "-").lower()
    if code.startswith("zh"):
        return "zh-cn"
    code = code.split("-", 1)[0]
    if code not in XTTS_LANGUAGES:
        raise ValueError(
            f"XTTS does not advertise support for language '{locale_or_language}'. "
            f"Use one of: {', '.join(sorted(XTTS_LANGUAGES))}"
        )
    return code


def call_xtts(*, text: str, speaker_wav: Path, model: str, language: str,
              out_path: Path) -> None:
    try:
        from TTS.api import TTS
    except ImportError as exc:
        raise RuntimeError(
            "XTTS provider requires Coqui TTS. Install it in a separate local "
            "environment with: python3 -m pip install TTS"
        ) from exc

    key = (model,)
    tts = _XTTS_CACHE.get(key)
    if tts is None:
        tts = TTS(model_name=model, progress_bar=False)
        _XTTS_CACHE[key] = tts

    tmp = out_path.with_suffix(out_path.suffix + ".tmp")
    tts.tts_to_file(
        text=text,
        speaker_wav=str(speaker_wav),
        language=language,
        file_path=str(tmp),
    )
    tmp.replace(out_path)


def main(argv=None) -> int:
    p = argparse.ArgumentParser(
        description="Pre-bake narration files for the Tareeq assessment."
    )
    p.add_argument("--project-id",
                   default=os.environ.get("GOOGLE_CLOUD_PROJECT")
                   or os.environ.get("GCLOUD_PROJECT"),
                   help="Google Cloud project id. Defaults to GOOGLE_CLOUD_PROJECT.")
    p.add_argument("--api-key",
                   default=os.environ.get("GEMINI_API_KEY")
                   or os.environ.get("GOOGLE_API_KEY"),
                   help="Gemini API key. Defaults to GEMINI_API_KEY / GOOGLE_API_KEY.")
    p.add_argument("--access-token",
                   default=os.environ.get("GOOGLE_OAUTH_ACCESS_TOKEN")
                   or os.environ.get("GOOGLE_ACCESS_TOKEN"),
                   help="OAuth access token. Defaults to env or gcloud ADC lookup.")
    p.add_argument("--provider", choices=["auto", "gemini-api", "cloud-tts", "xtts"],
                   default="auto",
                   help=("TTS provider. auto uses GEMINI_API_KEY when present, "
                         "otherwise Cloud TTS OAuth. xtts uses local Coqui XTTS-v2."))
    p.add_argument("--location",
                   default=os.environ.get("GOOGLE_CLOUD_REGION", "global"),
                   help="Cloud TTS location, e.g. global, eu, us. Default: global")
    p.add_argument("--html", default="index.html",
                   help="Path to the web app HTML. Default: index.html")
    p.add_argument("--out-dir", default="audio",
                   help="Directory to write MP3 files into. Default: audio/")
    p.add_argument("--voice", default="Kore",
                   help="Gemini-TTS prebuilt voice. Default: Kore")
    p.add_argument("--model", default=None,
                   help="TTS model. Defaults depend on provider.")
    p.add_argument("--locale", default=os.environ.get("TAREEQ_AUDIO_LOCALE"),
                   help="Content locale, e.g. en or ar. Used for provider language defaults.")
    p.add_argument("--language-code", default=None,
                   help="BCP-47/provider language code. Defaults to --locale or en-US.")
    p.add_argument("--speaker-wav",
                   default=os.environ.get("NOUR_SPEAKER_WAV")
                   or os.environ.get("XTTS_SPEAKER_WAV"),
                   help="Reference voice WAV for --provider xtts. Defaults to NOUR_SPEAKER_WAV.")
    p.add_argument("--prompt", default=DEFAULT_PROMPT,
                   help="Style prompt sent with every line.")
    p.add_argument("--force", action="store_true",
                   help="Re-generate files that already exist.")
    p.add_argument("--dry-run", action="store_true",
                   help="Show what would be generated without calling the API.")
    p.add_argument("--delay", type=float, default=0.1,
                   help="Seconds to wait between API calls.")
    args = p.parse_args(argv)
    args.language_code = args.language_code or args.locale or "en-US"

    provider = args.provider
    if provider == "auto":
        provider = "gemini-api" if args.api_key else "cloud-tts"
    if args.model:
        model = args.model
    elif provider == "gemini-api":
        model = DEFAULT_GEMINI_API_MODEL
    elif provider == "xtts":
        model = DEFAULT_XTTS_MODEL
    else:
        model = DEFAULT_CLOUD_MODEL
    output_ext = "wav" if provider in ("gemini-api", "xtts") else "mp3"

    known_models = None
    if provider == "gemini-api":
        known_models = GEMINI_API_MODELS
    elif provider == "cloud-tts":
        known_models = VALID_MODELS
    if known_models is not None and model not in known_models:
        sys.stderr.write(
            f"warning: '{model}' is not in the known Gemini-TTS model list; "
            "passing it through anyway.\n"
        )
    if provider in ("gemini-api", "cloud-tts") and args.voice not in KNOWN_VOICES:
        sys.stderr.write(
            f"warning: '{args.voice}' is not in the known Gemini-TTS voice list; "
            "passing it through anyway.\n"
        )

    xtts_language = None
    speaker_wav = None
    if provider == "xtts":
        try:
            xtts_language = xtts_language_code(args.language_code)
        except ValueError as exc:
            sys.stderr.write(f"error: {exc}\n")
            return 2
        if args.speaker_wav:
            speaker_wav = Path(args.speaker_wav).expanduser()

    html_path = Path(args.html)
    if not html_path.exists():
        sys.stderr.write(f"error: {html_path} not found\n")
        return 2

    questions = extract_questions(html_path)
    if not questions:
        sys.stderr.write(
            f"error: no questions found in {html_path}; has the source format changed?\n"
        )
        return 1

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    total_chars = sum(len(t) for _, t in questions)
    print("tareeq - bake_audio")
    print(f"  questions   : {len(questions)}")
    print(f"  characters  : {total_chars:,}")
    print(f"  provider    : {provider}")
    print(f"  model       : {model}")
    if provider == "xtts":
        print(f"  speaker wav : {speaker_wav or '(missing)'}")
        print(f"  xtts lang   : {xtts_language}")
    else:
        print(f"  voice       : {args.voice}")
    print(f"  language    : {args.language_code}")
    print(f"  location    : {args.location}")
    print(f"  format      : {output_ext}")
    print(f"  output dir  : {out_dir}/")
    if provider == "xtts":
        print("  cost        : local compute; no per-character provider charge")
    else:
        print("  cost        : see provider TTS pricing")
    print()

    access_token = None
    if not args.dry_run:
        if provider == "gemini-api" and not args.api_key:
            sys.stderr.write(
                "error: missing --api-key (or set GEMINI_API_KEY)\n"
            )
            return 2
        if provider == "cloud-tts" and not args.project_id:
            sys.stderr.write(
                "error: missing --project-id (or set GOOGLE_CLOUD_PROJECT)\n"
            )
            return 2
        if provider == "cloud-tts":
            access_token = resolve_access_token(args.access_token)
        if provider == "cloud-tts" and not access_token:
            sys.stderr.write(
                "error: missing OAuth token. Run `gcloud auth application-default "
                "login`, or pass --access-token / GOOGLE_OAUTH_ACCESS_TOKEN.\n"
            )
            return 2
        if provider == "xtts" and not speaker_wav:
            sys.stderr.write(
                "error: missing --speaker-wav for XTTS (or set NOUR_SPEAKER_WAV)\n"
            )
            return 2
        if provider == "xtts" and not speaker_wav.exists():
            sys.stderr.write(f"error: speaker WAV not found: {speaker_wav}\n")
            return 2

    skipped = generated = failed = 0
    for i, (qid, text) in enumerate(questions, 1):
        out_path = out_dir / f"{qid}.{output_ext}"
        if out_path.exists() and not args.force:
            print(f"  [{i:>2}/{len(questions)}] {qid:<11} skip (exists)")
            skipped += 1
            continue

        action = "DRY" if args.dry_run else "-> "
        print(f"  [{i:>2}/{len(questions)}] {qid:<11} {action} {out_path} "
              f"({len(text)}c)", end="", flush=True)

        if args.dry_run:
            print()
            continue

        try:
            if provider == "gemini-api":
                call_gemini_api_tts(
                    api_key=args.api_key,
                    text=text,
                    prompt=args.prompt,
                    voice=args.voice,
                    model=model,
                    out_path=out_path,
                )
            elif provider == "cloud-tts":
                call_cloud_tts(
                    access_token=access_token,
                    project_id=args.project_id,
                    text=text,
                    prompt=args.prompt,
                    voice=args.voice,
                    model=model,
                    language_code=args.language_code,
                    location=args.location,
                    out_path=out_path,
                )
            else:
                call_xtts(
                    text=text,
                    speaker_wav=speaker_wav,
                    model=model,
                    language=xtts_language,
                    out_path=out_path,
                )
            print(" ok")
            generated += 1
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", "replace")
            print(f"\n    HTTP {e.code}: {err[:700]}")
            failed += 1
            if e.code in (401, 403):
                return 1
        except urllib.error.URLError as e:
            print(f"\n    network error: {e.reason}")
            failed += 1
        except Exception as e:
            print(f"\n    error: {e}")
            failed += 1

        if args.delay > 0:
            time.sleep(args.delay)

    print()
    print(f"  generated   : {generated}")
    print(f"  skipped     : {skipped}")
    print(f"  failed      : {failed}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
