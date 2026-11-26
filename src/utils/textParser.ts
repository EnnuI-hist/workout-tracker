import type { ExerciseEntry, SetEntry } from '../types/workout.ts';

/**
 * Parses free-form workout text into structured ExerciseEntry[].
 *
 * Supported formats per line:
 *   Тяга вертикального блока: 60x10, 60x9, 60x8
 *   Тяга вертикального блока — 60×10 60×9 60×8
 *   Разгибание в блоке из-за головы - 25*12, 25*11
 *   Разгибание в блоке из-за головы 25x12, 25x11
 *   1. Жим гантелей на наклонной скамье: 20х10, 20х9
 *   Скручивания: 15, 15, 14
 *   Скручивания: 0x15, 0x15, 0x15
 */

const WEIGHT_REPS_RE = /(\d+(?:[.,]\d+)?)\s*(?:кг|kg)?\s*[xX×хХ*]\s*(\d+)/g;
const FIRST_WEIGHT_REPS_RE = /\d+(?:[.,]\d+)?\s*(?:кг|kg)?\s*[xX×хХ*]\s*\d+/;
const PURE_REPS_RE = /^\d+(?:\s*[,;/\s]\s*\d+)*$/;

export interface ParsedWorkoutResult {
  exercises: ExerciseEntry[];
  unparsedLines: string[];
  detectedNotes?: string;
}

export function parseWorkoutTextDetailed(text: string): ParsedWorkoutResult {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const exercises: ExerciseEntry[] = [];
  const unparsedLines: string[] = [];
  let detectedNotes: string | undefined;

  for (const rawLine of lines) {
    // Skip decorative dividers or copied date header lines
    if (/^[-=_*]{2,}$/.test(rawLine)) continue;
    if (rawLine.startsWith('📅')) continue;
    if (rawLine.startsWith('📝')) {
      const note = rawLine.replace(/^📝\s*/, '').trim();
      if (note) detectedNotes = note;
      continue;
    }

    // Strip optional list marker ("1. ", "1) ", "- ", "• ")
    const line = rawLine.replace(/^(?:\d+[.)]|[-•*])\s+/, '').trim();
    if (!line) continue;

    // Split on `:`, `—`, `–`, or spaced ` - ` so hyphenated words like "из-за" stay intact
    const sepMatch = line.match(/^(.+?)\s*(?::|—|–|\s-\s)\s*(.+)$/);

    let name = '';
    let setsText = '';

    if (sepMatch) {
      name = sepMatch[1].trim();
      setsText = sepMatch[2].trim();
    } else {
      const firstMatchIdx = line.search(FIRST_WEIGHT_REPS_RE);
      if (firstMatchIdx > 0) {
        name = line.slice(0, firstMatchIdx).replace(/[\s:—–-]+$/, '').trim();
        setsText = line.slice(firstMatchIdx).trim();
      }
    }

    if (!name || !setsText) {
      unparsedLines.push(rawLine);
      continue;
    }

    const sets: SetEntry[] = [];
    let match: RegExpExecArray | null;
    WEIGHT_REPS_RE.lastIndex = 0;
    while ((match = WEIGHT_REPS_RE.exec(setsText)) !== null) {
      const weight = parseFloat(match[1].replace(',', '.'));
      const reps = parseInt(match[2], 10);
      if (!Number.isNaN(weight) && weight >= 0 && !Number.isNaN(reps) && reps > 0) {
        sets.push({ weight, reps });
      }
    }

    // Support bodyweight pure-reps notation after explicit separator, e.g. "Скручивания: 15, 15, 14"
    if (sets.length === 0 && sepMatch) {
      const strippedUnits = setsText.replace(/\s*(?:повт\.?|раз|reps?)\b/gi, '').trim();
      if (PURE_REPS_RE.test(strippedUnits)) {
        const repNums = strippedUnits
          .split(/[\s,;/]+/)
          .map((n) => parseInt(n, 10))
          .filter((n) => !Number.isNaN(n) && n > 0);
        for (const reps of repNums) {
          sets.push({ weight: 0, reps });
        }
      }
    }

    if (sets.length > 0) {
      exercises.push({ name, sets });
    } else {
      unparsedLines.push(rawLine);
    }
  }

  return { exercises, unparsedLines, detectedNotes };
}

export function parseWorkoutText(text: string): ExerciseEntry[] {
  return parseWorkoutTextDetailed(text).exercises;
}

const STOP_WORDS = new Set(['на', 'в', 'во', 'из', 'за', 'из-за', 'с', 'по', 'для', 'от']);

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[()[\]«»".,:;!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeStems(value: string): string[] {
  return normalizeText(value)
    .split(/[\s-]+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w))
    .map((w) => (w.length > 5 ? w.slice(0, w.length - 2) : w.length > 4 ? w.slice(0, 4) : w));
}

function stemsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  return shorter.length >= 4 && longer.startsWith(shorter);
}

/**
 * Matches parsed exercise names to program exercise names, handling Russian inflections
 * and abbreviations (e.g. "Сгибания ног" -> "Сгибание ног", "Обратная бабочка" -> "Задние дельты на обратной бабочке").
 */
export function matchToProgramName(parsedName: string, programNames: string[]): string | null {
  const normParsed = normalizeText(parsedName);
  if (!normParsed) return null;

  // 1. Exact normalized match
  const exact = programNames.find((n) => normalizeText(n) === normParsed);
  if (exact) return exact;

  // 2. Prefix / substring match (score higher when shorter/closer in length)
  const subMatches = programNames.filter((n) => {
    const normProg = normalizeText(n);
    return normProg.includes(normParsed) || normParsed.includes(normProg);
  });
  if (subMatches.length === 1) return subMatches[0];
  if (subMatches.length > 1) {
    return [...subMatches].sort((a, b) => {
      const aStarts = normalizeText(a).startsWith(normParsed) ? 0 : 1;
      const bStarts = normalizeText(b).startsWith(normParsed) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return Math.abs(a.length - parsedName.length) - Math.abs(b.length - parsedName.length);
    })[0];
  }

  // 3. Stem token overlap
  const queryStems = tokenizeStems(parsedName);
  if (queryStems.length === 0) return null;

  let bestName: string | null = null;
  let bestScore = 0;

  for (const progName of programNames) {
    const progStems = tokenizeStems(progName);
    if (progStems.length === 0) continue;

    let hits = 0;
    for (const qs of queryStems) {
      if (progStems.some((ps) => stemsMatch(qs, ps))) hits++;
    }

    if (hits === 0) continue;
    const queryCoverage = hits / queryStems.length;
    const progCoverage = hits / progStems.length;

    // Require strong match to avoid falsely mapping completely different exercises
    if (queryCoverage >= 0.6 || (hits >= 2 && queryCoverage >= 0.5)) {
      const score = queryCoverage * 2 + progCoverage;
      if (score > bestScore) {
        bestScore = score;
        bestName = progName;
      }
    }
  }

  return bestName;
}
