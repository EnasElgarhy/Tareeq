"""Generate the Map My CORE sign-in email header (Kai, rooftop lantern at dawn).

Usage: python3 gen_email_header.py <consumer_dir> <out_dir> <variants>
Reads GEMINI_API_KEY from <consumer_dir>/.env.local (never printed).
"""
import base64, json, pathlib, sys, urllib.request

consumer = pathlib.Path(sys.argv[1])
out_dir = pathlib.Path(sys.argv[2])
variants = int(sys.argv[3]) if len(sys.argv) > 3 else 2
out_dir.mkdir(parents=True, exist_ok=True)

key = None
for line in (consumer / ".env.local").read_text().splitlines():
    if line.startswith("GEMINI_API_KEY="):
        key = line.split("=", 1)[1].strip().strip('"').strip("'")
if not key:
    sys.exit("GEMINI_API_KEY missing")

def ref(path, mime):
    return {"inlineData": {"mimeType": mime, "data": base64.b64encode((consumer / path).read_bytes()).decode()}}

PROMPT = """Create a wide illustration for the top of an email, in the same soft 3D storybook style as the reference images.

Character: Kai, exactly as in the reference images. Young woman, warm tan skin, dark brown curly hair in a high curly bun with a few loose curls, round dark-red glasses, small gold earrings, cream knit top, dark charcoal trousers. Nobody wears a headscarf.

Scene: Kai stands on a stone rooftop terrace at first light, seen from the waist up, on the LEFT third of the frame, turned three-quarters toward the viewer with a warm, welcoming smile. She holds up a small glowing brass lantern at shoulder height, as if lighting the way for the viewer. Behind her, a calm dawn sky that fades from soft lilac at the top to warm gold near the horizon. On the RIGHT, the sun is just rising over a distant, low Gulf city skyline with soft domes, a few slender towers and palm trees, small and hazy. Two or three birds far away. A few potted plants and a low terrace wall at the bottom edge.

Composition: very wide banner. Keep the right two thirds mostly open sky with the rising sun. Keep the bottom fifth of the image simple (the terrace wall), with no important detail there. No text, no letters, no logos, no borders.

Palette: night violet, lilac, dawn gold, warm cream. Gentle rim light from the sunrise on Kai's hair and lantern."""

body = {
    "contents": [{"role": "user", "parts": [
        {"text": "Reference image 1: Kai's exact look."},
        ref("public/kai/kai-rest-v2.webp", "image/webp"),
        {"text": "Reference image 2: Kai in a scene, for the art style and her look."},
        ref("public/marketing/hero/kai-path-sunset.png", "image/png"),
        {"text": PROMPT},
    ]}],
    "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "21:9"}},
}

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent?key={key}"
for i in range(1, variants + 1):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=240) as r:
            data = json.load(r)
    except urllib.error.HTTPError as e:
        print(f"variant {i}: HTTP {e.code} {e.read()[:300]!r}")
        continue
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    imgs = [p["inlineData"] for p in parts if "inlineData" in p]
    if not imgs:
        print(f"variant {i}: no image returned")
        continue
    ext = "png" if "png" in imgs[0]["mimeType"] else "jpg"
    path = out_dir / f"email-header-v{i}.{ext}"
    path.write_bytes(base64.b64decode(imgs[0]["data"]))
    print(f"variant {i}: {path}")
