#!/usr/bin/env python3
"""Apply a warmer mentor-style mastering pass to generated Kai narration.

This keeps provider credentials out of the app and works from the already baked
MP3 files. It uses macOS `afconvert` for decode/encode and Python stdlib DSP for
subtle warmth, softer highs, gentle compression, and a calmer pace.
"""

from __future__ import annotations

import argparse
import array
import math
import shutil
import subprocess
import tempfile
import wave
from pathlib import Path


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, capture_output=True, text=True)


def lowpass(values: list[float], cutoff: float, rate: int) -> list[float]:
    alpha = 1 - math.exp(-2 * math.pi * cutoff / rate)
    out: list[float] = []
    current = 0.0
    for value in values:
        current += alpha * (value - current)
        out.append(current)
    return out


def stretch(values: list[float], factor: float) -> list[float]:
    if factor == 1 or len(values) < 2:
        return values
    out_len = max(1, round(len(values) * factor))
    out: list[float] = []
    last = len(values) - 1
    for i in range(out_len):
        pos = min(last, i / factor)
        left = int(pos)
        right = min(last, left + 1)
        frac = pos - left
        out.append(values[left] * (1 - frac) + values[right] * frac)
    return out


def shape_channel(values: list[float], rate: int, pace: float) -> list[float]:
    low_mid = lowpass(values, 280, rate)
    soft_top = lowpass(values, 7200, rate)

    shaped: list[float] = []
    for original, warm, softened in zip(values, low_mid, soft_top):
        value = original * 0.82 + softened * 0.18 + warm * 0.075

        threshold = 0.46
        magnitude = abs(value)
        if magnitude > threshold:
            value = math.copysign(threshold + (magnitude - threshold) * 0.58, value)

        shaped.append(value)

    shaped = stretch(shaped, pace)
    peak = max((abs(value) for value in shaped), default=0.0)
    if peak > 0:
        gain = min(1.1, 0.93 / peak)
        shaped = [value * gain for value in shaped]
    return shaped


def read_wav(path: Path) -> tuple[int, int, list[list[float]]]:
    with wave.open(str(path), "rb") as wav:
        channels = wav.getnchannels()
        sample_width = wav.getsampwidth()
        rate = wav.getframerate()
        frames = wav.readframes(wav.getnframes())

    if sample_width != 2:
        raise RuntimeError(f"{path} must be 16-bit PCM after decode")

    samples = array.array("h")
    samples.frombytes(frames)
    if samples.itemsize != 2:
        raise RuntimeError("unexpected host sample width")

    per_channel = [[] for _ in range(channels)]
    for index, sample in enumerate(samples):
        per_channel[index % channels].append(sample / 32768)
    return rate, channels, per_channel


def write_wav(path: Path, rate: int, channels: int, per_channel: list[list[float]]) -> None:
    frame_count = min(len(channel) for channel in per_channel)
    samples = array.array("h")
    for frame_index in range(frame_count):
        for channel in range(channels):
            value = max(-1.0, min(1.0, per_channel[channel][frame_index]))
            samples.append(round(value * 32767))

    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(channels)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        wav.writeframes(samples.tobytes())


def warm_file(src: Path, out: Path, pace: float, bitrate: int) -> None:
    with tempfile.TemporaryDirectory(prefix="kai-warm-") as tmp_raw:
        tmp = Path(tmp_raw)
        decoded = tmp / "decoded.wav"
        shaped = tmp / "shaped.wav"
        encoded = tmp / "encoded.m4a"

        run(["afconvert", str(src), "-f", "WAVE", "-d", "LEI16@44100", str(decoded)])
        rate, channels, per_channel = read_wav(decoded)
        shaped_channels = [
            shape_channel(channel, rate, pace) for channel in per_channel
        ]
        write_wav(shaped, rate, channels, shaped_channels)
        run([
            "afconvert",
            str(shaped),
            "-f",
            "m4af",
            "-d",
            "aac",
            "-b",
            str(bitrate),
            str(encoded),
        ])
        out.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(encoded), str(out))


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Warm and soften generated Kai MP3 narration into M4A files."
    )
    parser.add_argument("--in-dir", default="public/audio")
    parser.add_argument("--out-dir", default="public/audio")
    parser.add_argument("--pace", type=float, default=1.045)
    parser.add_argument("--bitrate", type=int, default=128000)
    args = parser.parse_args()

    if not shutil.which("afconvert"):
        raise SystemExit("error: afconvert is required on PATH")

    in_dir = Path(args.in_dir)
    out_dir = Path(args.out_dir)
    files = sorted(
        path for path in in_dir.glob("*.mp3") if not path.name.startswith(".")
    )
    if not files:
        raise SystemExit(f"error: no MP3 files found in {in_dir}")

    print("tareeq - warm_audio")
    print(f"  input       : {in_dir}/")
    print(f"  output      : {out_dir}/")
    print(f"  files       : {len(files)}")
    print(f"  pace        : {args.pace:.3f}x duration")
    print()

    for index, src in enumerate(files, 1):
        out = out_dir / f"{src.stem}.m4a"
        print(f"  [{index:>2}/{len(files)}] {src.name:<16} -> {out.name}", flush=True)
        warm_file(src, out, args.pace, args.bitrate)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
