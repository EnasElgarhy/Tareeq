# Nour Voice References

Coqui XTTS-v2 gets a warmer, more human accent from the reference speaker
recording, not from a named preset voice. For Tareeq, record or license a
reference file named:

```bash
prototype/assets/voice/nour_warm_reference.wav
```

Recommended reference:

- 10-20 seconds of one adult mentor voice.
- Warm, calm, human, and friendly for MENA youth.
- Clear English with a soft MENA-friendly international accent.
- Quiet room, no music, no reverb, no background noise.
- WAV format, mono preferred, 16-bit PCM if possible.
- Use only a voice you have permission to clone.

Suggested read:

```text
Hey, I'm Nour. Take your time. There are no wrong answers here. Choose what feels closest to you, and I will help you turn those answers into a career compass.
```

Run:

```bash
cd prototype
python3 bake_audio.py --provider coqui --force
```
