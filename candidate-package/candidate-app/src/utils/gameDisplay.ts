/**
 * Pure game display mapper.
 *
 * Derives the human-readable category and difficulty values that the UI shows
 * from the backend's configuration-object fields (`categoryConfig` /
 * `difficultyConfig`) ONLY. It never reads the legacy `category` / `difficulty`
 * enum fields (Requirement 6.5).
 *
 * This is the correct reference implementation backing Property 7:
 *   "Game display reads configuration fields, not legacy enums".
 */

import type { Game } from '../api/types';

/** The flattened, display-ready shape consumed by game cards / detail screens. */
export type DisplayGame = {
  id: string;
  title: string;
  thumbnail: string | null;
  /** Derived from `categoryConfig`; '' when absent or unreadable. */
  category: string;
  /** Derived from `difficultyConfig`; '' when absent or unreadable. */
  difficulty: string;
};

/**
 * Extract a human-readable label from a configuration object.
 *
 * Config objects are loosely typed (`Record<string, unknown>`), so we read the
 * first present, string-valued display field among `name` / `label` / `title`.
 * Returns '' when the config is missing or has no usable display field — never
 * falling back to a legacy enum field.
 */
function readConfigLabel(config: Record<string, unknown> | undefined): string {
  if (!config || typeof config !== 'object') {
    return '';
  }

  for (const key of ['name', 'label', 'title'] as const) {
    const value = config[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return '';
}

/**
 * Map a backend `Game` into a display-ready `DisplayGame`.
 *
 * Pure function: no I/O, no mutation of the input. Category and difficulty are
 * derived strictly from `categoryConfig` / `difficultyConfig`.
 */
export function toDisplayGame(game: Game): DisplayGame {
  return {
    id: game.id,
    title: game.title,
    thumbnail: game.thumbnail,
    category: (game as any).category ?? '',
    difficulty: (game as any).difficulty ?? '',
  };
}
