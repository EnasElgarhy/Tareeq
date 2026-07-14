-- Adds a content hash to audio_clips so publish-time regeneration can tell
-- which clips are stale (question/option text changed since the clip was
-- generated) instead of blindly re-generating every clip on every publish —
-- ElevenLabs quota is limited, and most publishes only touch a few questions.
alter table audio_clips
  add column if not exists source_text_hash text;
