import { Wordset, getNextWord, WordGeneratorConfig } from "./words-generator";

/**
 * Manages a running buffer of generated words for the typing test.
 * Mimics Monkeytype's dynamic generation during a live test.
 */
export class WordBuffer {
  private words: string[] = [];
  private wordset: Wordset;
  private config: WordGeneratorConfig;
  
  // Keep track of the last two words to prevent back-to-back repetitions
  private previousWord1: string | undefined;
  private previousWord2: string | undefined;

  constructor(wordset: Wordset, config: WordGeneratorConfig) {
    this.wordset = wordset;
    this.config = config;
  }

  /**
   * Initializes or resets the buffer with an initial batch of words.
   * @param initialSize How many words to generate immediately (e.g. 50)
   */
  public reset(initialSize: number = 50): void {
    this.words = [];
    this.previousWord1 = undefined;
    this.previousWord2 = undefined;
    this.fill(initialSize);
  }

  /**
   * Generates and appends `count` words to the internal buffer.
   */
  public fill(count: number): void {
    for (let i = 0; i < count; i++) {
      const nextWord = getNextWord(
        this.wordset,
        this.config,
        this.previousWord1,
        this.previousWord2
      );

      this.words.push(nextWord);
      
      // Shift history for anti-repetition logic
      this.previousWord2 = this.previousWord1;
      this.previousWord1 = nextWord;
    }
  }

  /**
   * Pulls the next available word from the buffer.
   * If the buffer is running low, it will automatically fetch more.
   */
  public pullWord(): string {
    if (this.words.length === 0) {
      // Emergency fill if we somehow run completely empty
      this.fill(50);
    }
    
    // Auto-fill when buffer drops below 20 words
    if (this.words.length < 20) {
      this.fill(30);
    }

    return this.words.shift() as string;
  }

  /**
   * Returns the current array of words in the buffer without modifying it.
   */
  public peekAll(): string[] {
    return [...this.words];
  }

  /**
   * Returns the number of words currently in the buffer.
   */
  public get length(): number {
    return this.words.length;
  }
}
