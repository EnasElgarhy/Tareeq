import { AVATAR_MARKS } from "@/components/brand/AvatarMarks";
import { pickAvatarBackground, pickAvatarMarkIndex } from "@/lib/profile/avatar";

/**
 * Generated fallback avatar — registration doesn't support a photo
 * upload yet, so every user gets a deterministic, illustrated symbolic
 * mark (never initials) until it does. Once uploads exist, pass
 * `photoUrl` and this renders the real photo instead; nothing else
 * about how it's used needs to change.
 */
export function UserAvatar({
  name,
  photoUrl,
  size = 26,
}: {
  name: string;
  photoUrl?: string;
  size?: number;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- tiny avatar, not worth next/image's overhead here
      <img
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  const Mark = AVATAR_MARKS[pickAvatarMarkIndex(name, AVATAR_MARKS.length)];

  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center overflow-hidden rounded-full"
      style={{ width: size, height: size, background: pickAvatarBackground(name) }}
    >
      <Mark size={Math.round(size * 0.62)} />
    </span>
  );
}
