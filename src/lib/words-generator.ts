/**
 * Adapted from Monkeytype's core word generation logic
 * https://github.com/monkeytypegame/monkeytype
 */

export type WordsFrequencyMode = "normal" | "zipf";

export interface WordGeneratorConfig {
  mode: WordsFrequencyMode;
  orderedByFrequency: boolean;
}

/**
 * Generates a random index based on the probability distribution of Zipf's law.
 * PMF is (1/n)/H_N, where H_N is the Harmonic number of N (dictLength).
 * H_n = ln(n + 0.5) + gamma
 */
export function zipfyRandomArrayIndex(dictLength: number): number {
  const gamma = 0.5772156649015329; // Euler-Mascheroni constant
  const H_N = Math.log(dictLength + 0.5) + gamma; // approximation of H_N
  const r = Math.random();
  /* inverse of CDF where CDF is H_n/H_N */
  const inverseCDF = Math.exp(r * H_N - gamma) - 0.5;
  return Math.floor(inverseCDF);
}

export class Wordset {
  public words: string[];
  public length: number;

  constructor(words: string[]) {
    this.words = words;
    this.length = this.words.length;
  }

  public randomWord(mode: WordsFrequencyMode): string {
    if (mode === "zipf") {
      const index = zipfyRandomArrayIndex(this.length);
      // Ensure index stays within bounds just in case of float math rounding issues
      const safeIndex = Math.max(0, Math.min(index, this.length - 1));
      return this.words[safeIndex] as string;
    } else {
      const index = Math.floor(Math.random() * this.length);
      return this.words[index] as string;
    }
  }
}

/**
 * Returns a newly picked word from the Wordset, ensuring it doesn't match
 * the immediately previous two words (to prevent annoying repetitions).
 */
export function getNextWord(
  wordset: Wordset,
  config: WordGeneratorConfig,
  previousWord1: string | undefined,
  previousWord2: string | undefined
): string {
  // If the language dictionary is ordered by frequency (like english.json),
  // we can use Zipf's law to make it feel more natural.
  const frequencyMode = config.orderedByFrequency ? config.mode : "normal";

  const prev1Raw = previousWord1?.toLowerCase();
  const prev2Raw = previousWord2?.toLowerCase();

  let randomWord = wordset.randomWord(frequencyMode);
  let regenCount = 0;
  let wordRaw = randomWord.toLowerCase();

  // Re-roll if the new word matches either of the previous two words.
  // We cap re-rolls at 100 to prevent infinite loops (e.g. if the dictionary is extremely small).
  while (
    regenCount < 100 &&
    (wordRaw === prev1Raw || wordRaw === prev2Raw)
  ) {
    regenCount++;
    randomWord = wordset.randomWord(frequencyMode);
    wordRaw = randomWord.toLowerCase();
  }

  return randomWord;
}
