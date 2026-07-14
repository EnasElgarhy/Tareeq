export function computeKaiMouthLevel(
  timeDomainData: Uint8Array,
  previousLevel: number,
  now: number,
) {
  let sum = 0;
  let peak = 0;

  for (const value of timeDomainData) {
    const centered = (value - 128) / 128;
    const absolute = Math.abs(centered);
    sum += centered * centered;
    if (absolute > peak) peak = absolute;
  }

  const rms = Math.sqrt(sum / timeDomainData.length);
  const volume = clamp01((rms - 0.009) * 25);
  const consonantPeak = clamp01((peak - 0.045) * 5.2);

  if (volume < 0.02 && consonantPeak < 0.02) {
    return previousLevel * 0.62;
  }

  const syllablePulse =
    (Math.sin(now * 0.054) + Math.sin(now * 0.087 + 1.9) + 2) / 4;
  const target = clamp01(
    volume * 0.74 + consonantPeak * 0.18 + syllablePulse * volume * 0.34,
  );
  const attack = target > previousLevel ? 0.74 : 0.34;

  return previousLevel * (1 - attack) + target * attack;
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
