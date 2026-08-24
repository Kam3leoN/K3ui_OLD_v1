import fs from 'fs';
import path from 'path';

const dir = 'assets/audio/firework';
const map = {
  lift: ['lift1.mp3', 'lift2.mp3', 'lift3.mp3'],
  burst: ['burst1.mp3', 'burst2.mp3'],
  burstSmall: ['burst-sm-1.mp3', 'burst-sm-2.mp3'],
  crackle: ['crackle1.mp3'],
  crackleSmall: ['crackle-sm-1.mp3'],
};

const out = {};
for (const [type, files] of Object.entries(map)) {
  out[type] = files.map((f) => {
    const b = fs.readFileSync(path.join(dir, f));
    return `data:audio/mpeg;base64,${b.toString('base64')}`;
  });
}

const content = `/**
 * @fileoverview Sons feux d'artifice encodés (originaux CodePen / cdpn.io/329180)
 * @description Data-URI base64 — priorité hors-ligne ; fallback URL via soundBaseUrl
 */

/** Sources audio encodées en base64 (priorité) */
export const FIREWORK_SOUND_SOURCES_BASE64 = ${JSON.stringify(out, null, 2)} as const;

/** URL de base des MP3 originaux (fallback réseau) */
export const FIREWORK_SOUND_REMOTE_BASE_URL = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/329180/';

/** URL locale des MP3 (second fallback) */
export const FIREWORK_SOUND_LOCAL_BASE_URL = 'assets/audio/firework/';

export type FireworkSoundSourceMap = Partial<Record<string, string[]>>;

/** Fichiers MP3 par type (ordre d'origine CodePen) */
export const FIREWORK_SOUND_FILES: Record<string, string[]> = ${JSON.stringify(map, null, 2)};

/**
 * Retourne les sources audio encodées (base64 intégré).
 */
export function getFireworkSoundSources(): FireworkSoundSourceMap {
  return FIREWORK_SOUND_SOURCES_BASE64;
}

/**
 * Base64 en priorité, puis URL distantes, puis chemins locaux.
 */
export function getFireworkSoundSourcesWithFallback(): FireworkSoundSourceMap {
  const result: FireworkSoundSourceMap = {};
  for (const [type, files] of Object.entries(FIREWORK_SOUND_FILES)) {
    const encoded = FIREWORK_SOUND_SOURCES_BASE64[type as keyof typeof FIREWORK_SOUND_SOURCES_BASE64] ?? [];
    const remote = files.map((file) => FIREWORK_SOUND_REMOTE_BASE_URL + file);
    const local = files.map((file) => FIREWORK_SOUND_LOCAL_BASE_URL + file);
    result[type] = [...encoded, ...remote, ...local];
  }
  return result;
}
`;

fs.writeFileSync('src/utils/effects/firework-audio.ts', content);
console.log('firework-audio.ts generated');
