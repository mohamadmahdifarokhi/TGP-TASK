/**
 * Pure game display mapper.
 *
 * Derives the human-readable category and difficulty values that the UI shows
 * for a game.
 */

import type { Game } from '../api/types';

/** The flattened, display-ready shape consumed by game cards / detail screens. */
export type DisplayGame = {
  id: string;
  title: string;
  thumbnail: string | null;
  category: string;
  difficulty: string;
};

/**
 * Extract a human-readable label from a configuration object.
 *
 * Reads the first present, string-valued display field among
 * `name` / `label` / `title`. Returns '' when the config is missing or has no
 * usable display field.
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
 * Pure function: no I/O, no mutation of the input.
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
