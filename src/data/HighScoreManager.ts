const STORAGE_KEY = 'goto_town_highscores';
const MAX_ENTRIES = 5;

export interface HighScoreEntry {
  name: string;
  score: number; // elapsed seconds
}

export function loadHighScores(): HighScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function saveHighScores(entries: HighScoreEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // Storage unavailable
  }
}

export function isHighScore(score: number): boolean {
  const scores = loadHighScores();
  if (scores.length < MAX_ENTRIES) return true;
  return score > scores[scores.length - 1].score;
}

export function insertHighScore(name: string, score: number): HighScoreEntry[] {
  const scores = loadHighScores();
  scores.push({ name, score });
  scores.sort((a, b) => b.score - a.score);
  const trimmed = scores.slice(0, MAX_ENTRIES);
  saveHighScores(trimmed);
  return trimmed;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
