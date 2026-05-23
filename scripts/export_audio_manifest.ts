import { defaultLocale } from "../lib/content/seed";
import { getKaiNarrationManifest } from "../lib/audio/kai-narration";

function readArg(name: string) {
  const prefix = `${name}=`;
  const arg = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

const locale =
  readArg("--locale") ?? process.env.TAREEQ_AUDIO_LOCALE ?? defaultLocale;

const manifest = getKaiNarrationManifest(locale);

const missing = manifest.filter((entry) => !entry.text.trim());
if (missing.length > 0) {
  console.error(
    `Missing audio text for: ${missing.map((entry) => entry.id).join(", ")}`,
  );
  process.exit(1);
}

process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
