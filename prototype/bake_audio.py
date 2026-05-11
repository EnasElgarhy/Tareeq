#!/usr/bin/env python3
"""
Pre-generate MP3 narration for Tareeq with Google Cloud Text-to-Speech
Gemini-TTS. The browser only plays local files; credentials stay server-side.

Setup:
  gcloud auth application-default login
  export GOOGLE_CLOUD_PROJECT=your-project-id

Examples:
  python3 bake_audio.py
  python3 bake_audio.py --force
  python3 bake_audio.py --voice Charon --model gemini-2.5-pro-tts
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

KNOWN_VOICES = [
    "Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede",
    "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome",
    "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus",
    "Puck", "Pulcherrima", "Rasalgethi", "Sadachbia", "Sadaltager",
    "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr",
    "Zubenelgenubi",
]

DEFAULT_PROMPT = (
    "You are Kai, a warm career-discovery guide for youth in the Middle East "
    "and North Africa. Read the line in clear, friendly English with a calm "
    "coach-like tone. Keep the pace natural and easy for English learners."
)

QUESTION_PATTERN = re.compile(
    r'\{\s*id\s*:\s*"(Q[D]?\d+)"\s*,\s*title\s*:\s*"((?:[^"\\]|\\.)*)"',
    re.S,
)

EXTRA_LINES = [
    ("kai_intro",
     "Hey, I'm Kai. Think of me as a filter for all the noise. "
     "There are no wrong answers here - just pick what you would actually do, "
     "or the closest thing to it."),
    ("kai_results",
     "Nice work. Here's your Career Compass. Remember - this is a compass, "
     "not a GPS. You still get to choose the destination."),
]


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


def main(argv=None) -> int:
    p = argparse.ArgumentParser(
        description="Pre-bake Gemini-TTS MP3s for the Tareeq assessment."
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
    p.add_argument("--provider", choices=["auto", "gemini-api", "cloud-tts"],
                   default="auto",
                   help="TTS provider. auto uses GEMINI_API_KEY when present, otherwise Cloud TTS OAuth.")
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
                   help="Gemini-TTS model. Defaults depend on provider.")
    p.add_argument("--language-code", default="en-US",
                   help="BCP-47 language code. Default: en-US")
    p.add_argument("--prompt", default=DEFAULT_PROMPT,
                   help="Style prompt sent with every line.")
    p.add_argument("--force", action="store_true",
                   help="Re-generate files that already exist.")
    p.add_argument("--dry-run", action="store_true",
                   help="Show what would be generated without calling the API.")
    p.add_argument("--delay", type=float, default=0.1,
                   help="Seconds to wait between API calls.")
    args = p.parse_args(argv)

    provider = args.provider
    if provider == "auto":
        provider = "gemini-api" if args.api_key else "cloud-tts"
    model = args.model or (
        DEFAULT_GEMINI_API_MODEL if provider == "gemini-api" else DEFAULT_CLOUD_MODEL
    )
    output_ext = "wav" if provider == "gemini-api" else "mp3"

    known_models = GEMINI_API_MODELS if provider == "gemini-api" else VALID_MODELS
    if model not in known_models:
        sys.stderr.write(
            f"warning: '{model}' is not in the known Gemini-TTS model list; "
            "passing it through anyway.\n"
        )
    if args.voice not in KNOWN_VOICES:
        sys.stderr.write(
            f"warning: '{args.voice}' is not in the known Gemini-TTS voice list; "
            "passing it through anyway.\n"
        )

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
    print(f"  voice       : {args.voice}")
    print(f"  language    : {args.language_code}")
    print(f"  location    : {args.location}")
    print(f"  format      : {output_ext}")
    print(f"  output dir  : {out_dir}/")
    print("  cost        : see Google Cloud Text-to-Speech Gemini-TTS pricing")
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
            else:
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
