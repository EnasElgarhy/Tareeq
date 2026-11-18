"""Generate the /research page's spot icons with Gemini (one 3D object each).

    python3 scripts/generate_research_icons.py [name ...]

Reads GEMINI_API_KEY from .env.local (never printed). Writes square PNGs to
../../output/research-icons/ (originals, kept out of the site) and 256px WebPs to
public/marketing/science/icons/. Run from apps/consumer.
"""
import base64
import json
import pathlib
import sys
import urllib.error
import urllib.request

from PIL import Image

ROOT = pathlib.Path(".")
RAW = ROOT / "../../output/research-icons"
OUT = ROOT / "public/marketing/science/icons"
RAW.mkdir(parents=True, exist_ok=True)

STYLE = (
    "A single small object rendered as a soft 3D clay / storybook icon, in the same art style and lighting as "
    "the reference image (warm lamplight, gentle rim light). Palette: deep night violet #221248, lilac #C8B6F0, "
    "dawn gold #F4C660, warm cream. Centered, the object fills about 70% of the frame, three-quarter view, a soft "
    "contact shadow under it. The background is ONE flat solid colour, exactly #F4EEE3, edge to edge, no gradient, "
    "no vignette, no scenery, no border. No text, no letters, no numbers, no logos, no people."
)

ICONS = {
    "choose": "Three small rounded cards standing in a row; the middle one is lifted higher, tilted forward and glowing dawn gold, the other two are lilac.",
    "sources": "An open atlas book with three tiny job badges (a stethoscope, a gear, a paint brush) floating up out of its pages on soft light.",
    "update": "A tear-off calendar page with a circular refresh arrow curling around it and a small gold spark at its corner.",
    "coach": "A small closed report booklet with a violet cover, and a rounded gold speech bubble with three dots floating beside it.",
    "doors": "Three small arched doors standing side by side, each slightly ajar, warm gold light spilling from the gaps.",
    "limits": "A small brass balance scale, its two pans gently level, with a tiny lilac star on one pan and a tiny gold heart on the other.",
    "check": "A brass magnifying glass leaning over a small three-bar chart whose bars rise from lilac to gold, with a tiny tick above the tallest bar.",
}


def api_key() -> str:
    for line in (ROOT / ".env.local").read_text().splitlines():
        if line.startswith("GEMINI_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("GEMINI_API_KEY missing from .env.local")


def reference_part() -> dict:
    data = base64.b64encode((ROOT / "public/marketing/science/part-c.jpg").read_bytes()).decode()
    return {"inlineData": {"mimeType": "image/jpeg", "data": data}}


def generate(name: str, subject: str, key: str, ref: dict) -> None:
    body = {
        "contents": [{"role": "user", "parts": [
            {"text": "Style reference (match its rendering, not its content):"},
            ref,
            {"text": f"{STYLE}\n\nThe object: {subject}"},
        ]}],
        "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "1:1"}},
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent?key={key}"
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=240) as response:
            data = json.load(response)
    except urllib.error.HTTPError as error:
        print(f"{name}: HTTP {error.code}")
        return
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    images = [p["inlineData"] for p in parts if "inlineData" in p]
    if not images:
        print(f"{name}: no image returned")
        return
    raw_path = RAW / f"{name}.png"
    raw_path.write_bytes(base64.b64decode(images[0]["data"]))
    Image.open(raw_path).convert("RGB").resize((256, 256), Image.LANCZOS).save(OUT / f"{name}.webp", quality=86)
    print(f"{name}: ok")


if __name__ == "__main__":
    wanted = sys.argv[1:] or list(ICONS)
    key, ref = api_key(), reference_part()
    for icon in wanted:
        generate(icon, ICONS[icon], key, ref)
