/**
 * Generated narration clips kept in memory, least recently used dropped
 * first, so a repeat request never pays ElevenLabs again on this instance
 * (security review, 12 Nov 2026).
 */
export function createClipCache(maxEntries: number) {
  const clips = new Map<string, ArrayBuffer>();
  return {
    get(key: string): ArrayBuffer | undefined {
      const clip = clips.get(key);
      if (clip) {
        clips.delete(key);
        clips.set(key, clip);
      }
      return clip;
    },
    set(key: string, clip: ArrayBuffer): void {
      clips.delete(key);
      clips.set(key, clip);
      if (clips.size > maxEntries) clips.delete(clips.keys().next().value as string);
    },
  };
}
