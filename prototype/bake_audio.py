#!/usr/bin/env python3
"""
bake_audio.py — Pre-generate MP3 narration for every question in the Tareeq
web app using the OpenAI Text-to-Speech API (model: tts-1).

WHY: Embedding an OpenAI API key in client-side HTML is unsafe — anyone can
view source and steal it. Instead, run this script once with your key to
produce audio/Q1.mp3, audio/Q2.mp3, ... The web app just plays the local
files at runtime, so no key ever reaches the browser.

USAGE
-----
    # Bake everything (skips files that already exist):
    python3 bake_audio.py --api-key sk-...

    # Force re-bake (e.g. after editing question text):
    python3 bake_audio.py --api-key sk-... --force

    # Use a different voice (default: nova):
    python3 bake_audio.py --api-key sk-... --voice shimmer

    # Use the higher-quality (slower, 2x cost) tts-1-hd model:
    python3 bake_audio.py --api-key sk-... --model tts-1-hd

COST
----
The 44 questions in the current build total ~3,000 characters. At TTS-1's
rate of $15 per 1M characters that's roughly $0.05 per full bake. The
script prints an exact estimate before it starts.

REQUIREMENTS
------------
Python 3.7+. No third-party packages required (uses urllib from stdlib).
"""

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

API_URL = "https://api.openai.com/v1/audio/speech"

# These are the standard OpenAI TTS voices. Newer voices may also work.
VALID_VOICES = ["alloy", "ash", "ballad", "coral", "echo", "fable",
                "nova", "onyx", "sage", "shimmer", "verse"]

# Pattern matches `{ id:"Q1", title:"..." ...` inside the HTML's JS data blocks.
QUESTION_PATTERN = re.compile(
    r'\{\s*id\s*:\s*"(Q[D]?\d+)"\s*,\s*title\s*:\s*"((?:[^"\\]|\\.)*)"',
    re.S,
)

# Extra "narration" lines that Kai speaks outside the question flow.
# These get baked alongside the questions. Edit freely — re-run with --force.
EXTRA_LINES = [
    ("kai_intro",
     "Hey, I'm Kai. Think of me as a filter for all the noise. "
     "There are no wrong answers here — just pick what you would actually do, "
     "or the closest thing to it."),
    ("kai_results",
     "Nice work. Here's your Career Compass. Remember — this is a compass, "
     "not a GPS. You still get to choose the destination."),
]


def js_string_unescape(s: str) -> str:
    """Un-escape the small set of JS escape sequences used in the source."""
    # Order matters — protect literal backslashes first.
    return (
        s.replace(r"\\", "\x00")
         .replace(r"\"", '"')
         .replace(r"\n", "\n")
         .replace(r"\t", "\t")
         .replace("\x00", "\\")
    )


def extract_questions(html_path: Path):
    """Return [(qid, text), ...] in document order, including EXTRA_LINES."""
    src = html_path.read_text(encoding="utf-8")
    out = []
    seen = set()
    for m in QUESTION_PATTERN.finditer(src):
        qid, raw = m.group(1), m.group(2)
        if qid in seen:
            continue
        seen.add(qid)
        out.append((qid, js_string_unescape(raw)))
    # Append Kai narration lines (kai_intro.mp3, kai_results.mp3, ...).
    out.extend(EXTRA_LINES)
    return out


def call_tts(api_key: str, text: str, voice: str, model: str,
             out_path: Path, timeout: int = 60) -> None:
    """POST to OpenAI's /audio/speech endpoint and write the MP3 to disk."""
    body = json.dumps({
        "model": model,
        "input": text,
        "voice": voice,
        "response_format": "mp3",
    }).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = resp.read()
    # Write atomically: write to .tmp then rename.
    tmp = out_path.with_suffix(out_path.suffix + ".tmp")
    tmp.write_bytes(data)
    tmp.replace(out_path)


def fmt_money(n: float) -> str:
    return f"${n:.4f}" if n < 0.10 else f"${n:.2f}"


def main(argv=None) -> int:
    p = argparse.ArgumentParser(
        description="Pre-bake TTS-1 MP3s for the Tareeq assessment questions.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument("--api-key", default=os.environ.get("OPENAI_API_KEY"),
                   help="OpenAI API key. Defaults to $OPENAI_API_KEY.")
    p.add_argument("--html", default="index.html",
                   help="Path to the web app's HTML file. Default: index.html")
    p.add_argument("--out-dir", default="audio",
                   help="Directory to write MP3 files into. Default: audio/")
    p.add_argument("--voice", default="nova",
                   help=f"Voice. One of: {', '.join(VALID_VOICES)}. Default: nova")
    p.add_argument("--model", default="tts-1",
                   help="OpenAI TTS model. Default: tts-1 (cheap & fast). "
                        "Use tts-1-hd for higher quality at 2x the cost.")
    p.add_argument("--force", action="store_true",
                   help="Re-generate files that already exist.")
    p.add_argument("--dry-run", action="store_true",
                   help="Show what would be generated without calling the API.")
    p.add_argument("--delay", type=float, default=0.1,
                   help="Seconds to wait between API calls (rate-limit friendly).")
    args = p.parse_args(argv)

    if not args.api_key:
        sys.stderr.write(
            "error: missing --api-key (or set OPENAI_API_KEY env var)\n"
        )
        return 2
    if args.voice not in VALID_VOICES:
        sys.stderr.write(
            f"warning: '{args.voice}' is not in the known voice list — "
            "passing it through anyway.\n"
        )

    html_path = Path(args.html)
    if not html_path.exists():
        sys.stderr.write(f"error: {html_path} not found\n")
        return 2

    questions = extract_questions(html_path)
    if not questions:
        sys.stderr.write(
            f"error: no questions found in {html_path}. "
            "Has the source format changed?\n"
        )
        return 1

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    total_chars = sum(len(t) for _, t in questions)
    rate = 15 if args.model == "tts-1" else 30  # $/1M chars
    est_cost = total_chars / 1_000_000 * rate

    print(f"tareeq · bake_audio")
    print(f"  questions   : {len(questions)}")
    print(f"  characters  : {total_chars:,}")
    print(f"  model       : {args.model}")
    print(f"  voice       : {args.voice}")
    print(f"  output dir  : {out_dir}/")
    print(f"  est. cost   : {fmt_money(est_cost)}  (full bake)")
    print()

    skipped = generated = failed = 0
    for i, (qid, text) in enumerate(questions, 1):
        out_path = out_dir / f"{qid}.mp3"
        if out_path.exists() and not args.force:
            print(f"  [{i:>2}/{len(questions)}] {qid:<5}  skip (exists)")
            skipped += 1
            continue

        action = "DRY" if args.dry_run else "→  "
        print(f"  [{i:>2}/{len(questions)}] {qid:<5}  {action} {out_path}  "
              f"({len(text)}c)", end="", flush=True)

        if args.dry_run:
            print()
            continue

        try:
            call_tts(args.api_key, text, args.voice, args.model, out_path)
            print("  ✓")
            generated += 1
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", "replace")
            print(f"\n    HTTP {e.code}: {err[:500]}")
            failed += 1
            # 401/403 — auth issue, no point retrying anything else.
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
