"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import type { Campaign } from "@/lib/supabase/types";
import { Sparkles } from "lucide-react";
import ResultsCharts from "@/components/results/ResultsCharts";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
interface KeystrokeRecord {
  key: string;
  timestamp: number;
  interval_ms: number;
}

interface AccuracySample {
  char_index: number;
  time_sec?: number;
  accuracy: number;
  wpm: number;
}

type CharState = "correct" | "error" | string;

interface Props {
  campaign?: Campaign;
  userId?: string;
  isPractice?: boolean;
  practiceText?: string;
  isGuest?: boolean;
  repeatNumber?: number;
  totalRepeats?: number;
}

/* ─────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────── */
// How many words to keep visible ahead of the active word
const BASE_LOOKAHEAD = 3;

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */
/* ── Seeded random helper for deterministic shuffling ── */
function seededRandom(seedStr: string) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
  }
  return function() {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export default function TypingInterface({
  campaign,
  userId,
  isPractice = false,
  practiceText = "",
  isGuest = false,
  repeatNumber = 1,
  totalRepeats = 3,
}: Props) {
  const router = useRouter();
  const rawText = campaign?.ad_text ?? "";

  /* ── Settings ── */
  const [usePunctuation, setUsePunctuation] = useState(true);
  const [useLowercase, setUseLowercase] = useState(false);
  const [mode, setMode] = useState<"jumbled" | "exact">("jumbled");
  const [timeLimit, setTimeLimit] = useState<number | null>(30);
  const [practiceTrigger, setPracticeTrigger] = useState(0);

  /* ── Full word pool (derived from settings) ── */
  const [wordPool, setWordPool] = useState<string[]>([]);
  const campaignWordCountRef = useRef(0);
  const timeLimitRef = useRef<number | null>(null);

  /* ── Visible word queue: only a sliding window of words shown ── */
  // visibleWords: the words currently rendered in the lane
  // poolIndexRef: how many words from the pool have been fed in so far
  const [visibleWords, setVisibleWords] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"focus" | "normal">("focus");
  const [activeWordIdx, setActiveWordIdx] = useState(0); // index into visibleWords
  const [charIdx, setCharIdx] = useState(0);
  const [wordCharStates, setWordCharStates] = useState<
    Record<number, CharState[]>
  >({});
  // wordHasError[wi] = true if word wi had any incorrect keystroke (including uncorrected extras).
  // Words flagged as having errors are excluded from net WPM (per Monkeytype convention).
  const [wordHasError, setWordHasError] = useState<Record<number, boolean>>({});
  const poolIndexRef = useRef(0); // how many from pool have been added to visibleWords
  const [armTrigger, setArmTrigger] = useState(0);

  /* ── Session lifecycle ── */
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [discarded, setDiscarded] = useState(false);

  /* ── Stats ── */
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const correctCharsRef = useRef(0);
  const netCorrectCharsRef = useRef(0);

  /* ── Anti-fraud refs ── */
  const keystrokesRef = useRef<KeystrokeRecord[]>([]);
  const accuracySamplesRef = useRef<AccuracySample[]>([]);
  const lastKeystrokeTimeRef = useRef(0);
  const startTimeRef = useRef(0);
  const sessionIdRef = useRef(uuidv4());
  const consecutiveErrorsRef = useRef(0);
  // Synchronous submit-once guard — immune to stale closures and render-cycle races
  const submittedRef = useRef(false);

  /* ── Sloth X position (0–100%) — always 50% (center) ── */
  const [slothX, setSlothX] = useState(50);

  const laneRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ═══════════════════════════════════════════════════════════
     SETTINGS → derive full word pool
  ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    timeLimitRef.current = timeLimit;

    let text = "";
    if (isPractice) {
      text = practiceText || rawText;
    } else {
      text = rawText;
    }

    if (mode === "jumbled") {
      const ws = text.split(/\s+/);
      const rand = seededRandom(`${campaign?.id || "practice"}-${repeatNumber}`);
      for (let i = ws.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [ws[i], ws[j]] = [ws[j], ws[i]];
      }
      text = ws.join(" ");
    }
    if (!usePunctuation) text = text.replace(/[^\w\s\d]/g, "");
    if (useLowercase) text = text.toLowerCase();
    text = text.replace(/\s+/g, " ").trim();

    const wordList = text.split(/\s+/).filter(Boolean);
    campaignWordCountRef.current = wordList.length;
    setWordPool(wordList);

    // Full reset - start with only the first window of words visible
    const initialCount = viewMode === "normal" ? Math.min(40, wordList.length) : 3;
    setVisibleWords(wordList.slice(0, initialCount));
    poolIndexRef.current = initialCount;

    setActiveWordIdx(0);
    setCharIdx(0);
    setWordCharStates({});
    setWordHasError({});
    setStarted(false);
    setCompleted(false);
    setDiscarded(false);
    setElapsedSeconds(0);
    setWpm(0);
    setAccuracy(100);
    setTotalKeystrokes(0);
    setCorrectKeystrokes(0);
    correctCharsRef.current = 0;
    netCorrectCharsRef.current = 0;
    totalKeystrokesCounterRef.current = 0;
    correctKeystrokesCounterRef.current = 0;
    keystrokesRef.current = [];
    accuracySamplesRef.current = [];
    lastKeystrokeTimeRef.current = 0;
    startTimeRef.current = 0;
    sessionIdRef.current = uuidv4();
    consecutiveErrorsRef.current = 0;
    submittedRef.current = false; // allow fresh submission after reset
    // Reset scroll
    scrollXRef.current = 0;
    if (trackRef.current) trackRef.current.style.transform = "translateX(0px)";
    setSlothX(50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usePunctuation, useLowercase, mode, rawText, isPractice, practiceTrigger, repeatNumber, viewMode]);

  useEffect(() => {
    timeLimitRef.current = timeLimit;
  }, [timeLimit]);

  /* ═══════════════════════════════════════════════════════════
     DYNAMIC LOOKAHEAD — feed more words from pool as user types
     Keeps (lookahead) words ahead of the active word visible
  ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!started) return;

    // Lookahead is 3 for focus mode, 20 for normal mode
    const lookahead = viewMode === "normal" ? 20 : BASE_LOOKAHEAD;

    // How many words ahead of active word are currently in the visible list?
    const wordsAhead = visibleWords.length - activeWordIdx;

    if (wordsAhead < lookahead && poolIndexRef.current < wordPool.length) {
      const needed = viewMode === "normal" ? 20 : lookahead - wordsAhead;
      const toAdd = wordPool.slice(
        poolIndexRef.current,
        poolIndexRef.current + needed,
      );
      if (toAdd.length > 0) {
        poolIndexRef.current += toAdd.length;
        setVisibleWords((prev) => [...prev, ...toAdd]);
        if (viewMode === "focus") {
          setArmTrigger((prev) => prev + 1);
        }
      }
    }
  }, [activeWordIdx, wpm, started, visibleWords.length, wordPool, viewMode]);

  /* ═══════════════════════════════════════════════════════════
     LANE SCROLL — keep the active word always centered in the lane
     by translating the entire track leftward as words are consumed
  ═══════════════════════════════════════════════════════════ */
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollXRef = useRef(0); // current translateX in px (negative = scrolled left)
  const scrollRafRef = useRef(0);

  useEffect(() => {
    if (completed || discarded) {
      setSlothX(50);
      return;
    }

    const animateScroll = () => {
      if (!laneRef.current || !activeWordRef.current || !trackRef.current) {
        scrollRafRef.current = requestAnimationFrame(animateScroll);
        return;
      }

      if (viewMode === "normal") {
        // Vertical scroll for normal mode
        const lineHeight = (40 * 1.5) + 10; // 60px line height + 10px row gap = 70px
        const currentOffset = activeWordRef.current.offsetTop;
        
        let targetY = 0;
        // Keep active word on the 2nd line (index 1) if we go past it
        if (currentOffset > lineHeight) {
          targetY = -(currentOffset - lineHeight);
        }

        const diff = targetY - (scrollXRef.current || 0);
        const ease = 0.1;
        const next = Math.abs(diff) < 0.3 ? targetY : (scrollXRef.current || 0) + diff * ease;
        
        scrollXRef.current = next;
        trackRef.current.style.transform = `translateY(${next}px)`;

        scrollRafRef.current = requestAnimationFrame(animateScroll);
        return;
      }

      const laneRect = laneRef.current.getBoundingClientRect();
      const wordRect = activeWordRef.current.getBoundingClientRect();

      // Target position: active word always at 20% mark
      const targetPct = 0.2;
      const targetScreenX = laneRect.left + laneRect.width * targetPct;
      const wordCenter = wordRect.left + wordRect.width / 2;

      // How far off is the word from the target? Shift track to compensate
      const delta = targetScreenX - wordCenter;

      const current = scrollXRef.current;
      const target = current + delta;

      const diff = target - current;
      const ease = Math.max(0.08, Math.min(0.22, 0.08 + (wpm / 200) * 0.14));
      const next = Math.abs(diff) < 0.3 ? target : current + diff * ease;

      scrollXRef.current = next;
      trackRef.current.style.transform = `translateX(${next}px)`;

      // Sloth exact position: sits above the LAST rendered word!
      const allWords = trackRef.current.querySelectorAll(".wl-word");
      if (poolIndexRef.current >= wordPool.length) {
        // The sloth has delivered all words. Let it sprint off the right side of the screen!
        setSlothX((prev) => Math.min(prev + (wpm > 0 ? 1.5 : 0), 150));
      } else {
        // Track the last word so the sloth is always exactly above it when it spawns!
        const lastWord = allWords[allWords.length - 1];
        if (lastWord) {
          const lastRect = lastWord.getBoundingClientRect();
          const pct =
            ((lastRect.left + lastRect.width / 2) / window.innerWidth) * 100;
          // Smooth the sloth movement to avoid jerky jumps when new words are added
          setSlothX((prev) => {
            const diff = pct - prev;
            return prev + diff * 0.15;
          });
        }
      }

      scrollRafRef.current = requestAnimationFrame(animateScroll);
    };

    cancelAnimationFrame(scrollRafRef.current);
    scrollRafRef.current = requestAnimationFrame(animateScroll);
    return () => cancelAnimationFrame(scrollRafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWordIdx, wpm, visibleWords.length, completed, discarded, viewMode]);

  /* ═══════════════════════════════════════════════════════════
     FOCUS INPUT
  ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* ═══════════════════════════════════════════════════════════
     WPM TICKER + INACTIVITY + TIME LIMIT
  ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!started || completed || discarded) return;
    const iv = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - startTimeRef.current;
      const elapsedMin = elapsedMs / 60000;
      const liveWpm =
        elapsedMin > 0
          ? Math.round(netCorrectCharsRef.current / 5 / elapsedMin)
          : 0;

      setElapsedSeconds(Math.floor(elapsedMs / 1000));
      setWpm(liveWpm);

      const secs = Math.floor(elapsedMs / 1000);
      if (timeLimitRef.current && secs >= timeLimitRef.current) {
        setCompleted(true);
        handleCompleteRef.current?.();
        return;
      }
      if (now - lastKeystrokeTimeRef.current > 15000) {
        setDiscarded(true);
        setCompleted(true);
      }
    }, 500);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, completed, discarded]);

  /* ═══════════════════════════════════════════════════════════
     SESSION SUBMIT
  ═══════════════════════════════════════════════════════════ */
  const handleCompleteRef = useRef<(() => void) | null>(null);

  const handleComplete = useCallback(
    async (
      finalTotal: number,
      finalCorrect: number,
      finalAccuracy: number,
      finalSecs: number | null,
    ) => {
      // Synchronous, race-proof guard — submittedRef is set once and never races with renders
      if (submittedRef.current) return;
      submittedRef.current = true;

      setCompleted(true);
      setSubmitting(true);

      const rawSecs = (Date.now() - startTimeRef.current) / 1000;
      const duration = finalSecs ?? Math.max(0.1, rawSecs);
      const elapsedMin = Math.max(0.001, duration / 60);
      const finalWpm =
        elapsedMin > 0
          ? Math.round(netCorrectCharsRef.current / 5 / elapsedMin)
          : 0;

      // Practice mode or guest: show inline results without saving to DB
      if (isPractice || isGuest) {
        setWpm(finalWpm);
        setAccuracy(finalAccuracy);
        setElapsedSeconds(Math.round(duration));
        setSubmitting(false);
        return;
      }

      // Real session: capture sessionId NOW before any await (ref is stable, no closure issue)
      const sessionId = sessionIdRef.current;

      // Real session: save to DB then redirect to /results/[sessionId]
      try {
        const response = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            user_id: userId,
            campaign_id: campaign?.id,
            wpm: finalWpm,
            accuracy: finalAccuracy,
            keystrokes_data: keystrokesRef.current,
            accuracy_samples: accuracySamplesRef.current,
            total_keystrokes: finalTotal,
            correct_keystrokes: finalCorrect,
            duration_seconds: Math.round(duration),
            test_mode: mode,
            time_limit: timeLimitRef.current,
            use_punctuation: usePunctuation,
            use_lowercase: useLowercase,
          }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          console.error("Session submit API error:", data.error);
          alert("Error submitting session: " + (data.error || "Please try again."));
          // Release lock on error so user could retry if needed
          submittedRef.current = false;
          setSubmitting(false);
          return;
        }

        setSubmitting(false);
        router.push(`/results/${sessionId}`);
      } catch (err) {
        console.error("Session submit network error:", err);
        alert("Network error while submitting session.");
        submittedRef.current = false;
        setSubmitting(false);
      }
    },
    // submitting/completed intentionally removed — handled by submittedRef to avoid stale closures
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaign?.id, mode, userId, usePunctuation, useLowercase, router, isPractice, isGuest],
  );

  const totalKeystrokesRef = useRef(0);
  const correctKeystrokesRef = useRef(0);
  const accuracyRef = useRef(100);

  // Live counter refs (updated on every keystroke — avoids stale useState closure in hot path)
  const totalKeystrokesCounterRef = useRef(0);
  const correctKeystrokesCounterRef = useRef(0);

  useEffect(() => {
    totalKeystrokesRef.current = totalKeystrokes;
    correctKeystrokesRef.current = correctKeystrokes;
    accuracyRef.current = accuracy;
  }, [totalKeystrokes, correctKeystrokes, accuracy]);

  const getNetCorrectCharactersCount = (
    customActiveWordStates?: string[],
    // Optionally pass the word-error map snapshot (for inside setState callbacks)
    customWordHasError?: Record<number, boolean>
  ) => {
    let count = 0;
    const errorMap = customWordHasError ?? wordHasError;

    // Completed words — only count if the word had zero errors (Monkeytype convention)
    for (let wi = 0; wi < activeWordIdx; wi++) {
      if (errorMap[wi]) continue; // skip error words entirely
      const word = visibleWords[wi];
      if (!word) continue;
      const states = wordCharStates[wi] ?? [];
      for (let ci = 0; ci < word.length; ci++) {
        if (states[ci] === "correct") count++;
      }
      // +1 for the space after a fully-correct completed word
      count++;
    }

    // Current active word — count correct chars typed so far (tentative; will be
    // excluded retroactively if the word turns out to have errors when space is pressed)
    const currentStates = customActiveWordStates ?? (wordCharStates[activeWordIdx] ?? []);
    const currentWord = visibleWords[activeWordIdx] ?? "";
    const limit = Math.min(charIdx, currentWord.length);
    for (let ci = 0; ci < limit; ci++) {
      if (currentStates[ci] === "correct") count++;
    }

    return count;
  };

  useEffect(() => {
    handleCompleteRef.current = () => {
      if (completed || submitting) return;
      const secs = Math.round((Date.now() - startTimeRef.current) / 1000);
      handleComplete(
        totalKeystrokesRef.current,
        correctKeystrokesRef.current,
        accuracyRef.current,
        secs,
      );
    };
  }, [handleComplete]);

  /* ═══════════════════════════════════════════════════════════
     KEYBOARD HANDLER
  ═══════════════════════════════════════════════════════════ */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.ctrlKey && e.key === "v") {
        e.preventDefault();
        return;
      }

      // Ignore pure modifier keys before starting
      if (
        !started &&
        (e.key === "Shift" ||
          e.key === "Control" ||
          e.key === "Alt" ||
          e.key === "Meta" ||
          e.key === "CapsLock" ||
          e.key === "Tab")
      ) {
        return;
      }

      const now = Date.now();
      const interval = lastKeystrokeTimeRef.current
        ? now - lastKeystrokeTimeRef.current
        : 0;
      lastKeystrokeTimeRef.current = now;

      if (!started) {
        // Prevent Ghost Starting: If the very first key is Space, ignore it entirely
        if (e.key === " ") return;
        setStarted(true);
        startTimeRef.current = now;
      }

      const currentWord = visibleWords[activeWordIdx];
      if (!currentWord) return;

      /* ── Backspace ── */
      if (e.key === "Backspace") {
        e.preventDefault();
        if (e.ctrlKey) {
          // Ctrl+Backspace: clear entire active word progress.
          // IMPORTANT: setCharIdx(0) is async, so we can't use charIdx inside the
          // setState updater below. Instead, manually compute net chars without the
          // current word's contribution (charIdx is effectively 0 after clear).
          setCharIdx(0);
          setWordHasError((prevErrors) => ({ ...prevErrors, [activeWordIdx]: false }));
          setWordCharStates((prev) => {
            // Recalculate net chars: only completed words that had no errors
            let count = 0;
            for (let wi = 0; wi < activeWordIdx; wi++) {
              if (wordHasError[wi]) continue;
              const word = visibleWords[wi];
              if (!word) continue;
              const states = prev[wi] ?? [];
              for (let ci = 0; ci < word.length; ci++) {
                if (states[ci] === "correct") count++;
              }
              count++; // space credit
            }
            // Current word is cleared — no contribution
            netCorrectCharsRef.current = count;
            return { ...prev, [activeWordIdx]: [] };
          });
          return;
        }
        if (charIdx > 0) {
          const newCi = charIdx - 1;
          setCharIdx(newCi);
          setWordCharStates((prev) => {
            const ws = [...(prev[activeWordIdx] ?? [])].slice(0, newCi);
            // After backspace, recheck whether the word still has any errors
            // so we can clear the dirty flag if the user corrected the last mistake
            const stillHasError = ws.some(
              (s) => s !== undefined && s !== "correct"
            );
            setWordHasError((prevErrors) => ({
              ...prevErrors,
              [activeWordIdx]: stillHasError,
            }));
            netCorrectCharsRef.current = getNetCorrectCharactersCount(
              ws,
              // Pass current wordHasError with the potentially updated flag
              { ...wordHasError, [activeWordIdx]: stillHasError }
            );
            return { ...prev, [activeWordIdx]: ws };
          });
        }
        return;
      }

      /* ── Space (Advance Word) ── */
      if (e.key === " ") {
        e.preventDefault();

        // Anti-skip: Prevent advancing the word if no characters have been typed yet
        if (charIdx === 0) return;

        // Commit word: mark remaining un-typed characters as missed/errors
        const finalWordStates = [...(wordCharStates[activeWordIdx] ?? [])];
        let missedCount = 0;
        for (let i = charIdx; i < currentWord.length; i++) {
          finalWordStates[i] = "error";
          missedCount++;
        }

        // Determine if this word has ANY error (incorrect chars already tracked + missed chars now)
        const currentWordAlreadyHadError = wordHasError[activeWordIdx] ?? false;
        const wordIsError = currentWordAlreadyHadError || missedCount > 0;

        // Update live counter refs with missed chars (missed chars are errors in accuracy)
        totalKeystrokesCounterRef.current += missedCount;
        // correctKeystrokesCounterRef does NOT increment for missed chars

        const newTotalKeystrokes = totalKeystrokesCounterRef.current;
        const newCorrectKeystrokes = correctKeystrokesCounterRef.current;
        const newAcc = newTotalKeystrokes > 0
          ? Math.round((newCorrectKeystrokes / newTotalKeystrokes) * 100)
          : 100;

        // Sync state (for display) — these are async but refs above are already updated
        setTotalKeystrokes(newTotalKeystrokes);
        setAccuracy(newAcc);

        // Commit word states and wordHasError, then recalculate net correct chars
        setWordHasError((prevErrors) => ({ ...prevErrors, [activeWordIdx]: wordIsError }));
        setWordCharStates((prev) => {
          // Build updated errorMap including the just-committed word
          const updatedErrorMap = { ...wordHasError, [activeWordIdx]: wordIsError };
          // Recalculate net chars for all completed words (activeWordIdx now included as completed)
          let count = 0;
          for (let wi = 0; wi <= activeWordIdx; wi++) {
            if (updatedErrorMap[wi]) continue; // skip error words
            const word = visibleWords[wi];
            if (!word) continue;
            const states = wi === activeWordIdx ? finalWordStates : (prev[wi] ?? []);
            for (let ci = 0; ci < word.length; ci++) {
              if (states[ci] === "correct") count++;
            }
            count++; // space credit for fully-correct completed word
          }
          netCorrectCharsRef.current = count;
          return { ...prev, [activeWordIdx]: finalWordStates };
        });

        const nextWi = activeWordIdx + 1;
        const totalTyped = poolIndexRef.current - (visibleWords.length - nextWi);

        setActiveWordIdx(nextWi);
        setCharIdx(0);

        if (totalTyped >= campaignWordCountRef.current) {
          setCompleted(true);
          const secs = (now - startTimeRef.current) / 1000;
          // Use live ref values to avoid stale closure bug on the final submit
          handleComplete(
            totalKeystrokesCounterRef.current,
            correctKeystrokesCounterRef.current,
            newAcc,
            secs,
          );
        }
        return;
      }

      /* ── Ignore non-printable ── */
      if (e.key.length !== 1) return;

      // Allow typing extra characters beyond word length up to 10 extra characters
      const isExtra = charIdx >= currentWord.length;
      if (isExtra && charIdx >= currentWord.length + 10) {
        return;
      }

      e.preventDefault();

      keystrokesRef.current.push({
        key: e.key,
        timestamp: now,
        interval_ms: interval,
      });

      const isCorrect = !isExtra && e.key === currentWord[charIdx];

      // Update live counter refs immediately — these are used in handleComplete and
      // space handler to avoid stale useState closure bugs
      totalKeystrokesCounterRef.current += 1;
      if (isCorrect) correctKeystrokesCounterRef.current += 1;

      const newTotal = totalKeystrokesCounterRef.current;
      const newCorrect = correctKeystrokesCounterRef.current;

      if (isCorrect) {
        consecutiveErrorsRef.current = 0;
      } else {
        consecutiveErrorsRef.current += 1;
        // Anti-mash detection: Discard session if typing complete gibberish
        if (consecutiveErrorsRef.current > 15) {
          setDiscarded(true);
          setCompleted(true);
          return;
        }
        // Mark word as dirty — it now has at least one error (extra chars always count as errors)
        setWordHasError((prevErrors) => ({ ...prevErrors, [activeWordIdx]: true }));
      }

      setTotalKeystrokes(newTotal);
      setCorrectKeystrokes(newCorrect);
      
      const newAcc = newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 100;
      setAccuracy(newAcc);

      setWordCharStates((prev) => {
        const ws = [...(prev[activeWordIdx] ?? [])];
        ws[charIdx] = isCorrect ? "correct" : `error_${e.key}`;
        // If incorrect, the word is now dirty — pass updated error map so WPM is accurate
        const updatedErrorMap = isCorrect
          ? wordHasError
          : { ...wordHasError, [activeWordIdx]: true };
        netCorrectCharsRef.current = getNetCorrectCharactersCount(ws, updatedErrorMap);
        return { ...prev, [activeWordIdx]: ws };
      });

      if (newTotal % 5 === 0) {
        const min = (now - startTimeRef.current) / 60000;
        // We use the updated net correct chars ref here
        accuracySamplesRef.current.push({
          char_index: newTotal,
          time_sec: Math.round((now - startTimeRef.current) / 1000),
          accuracy: newAcc,
          wpm: min > 0 ? Math.round(netCorrectCharsRef.current / 5 / min) : 0,
        });
      }

      setCharIdx(charIdx + 1);
    },
    [
      started,
      activeWordIdx,
      charIdx,
      visibleWords,
      totalKeystrokes,
      correctKeystrokes,
      handleComplete,
      wordCharStates,
      wordHasError,
    ],
  );

  /* ─── Helpers ─── */
  const formatTime = (secs: number) => {
    const display = timeLimit ? Math.max(0, timeLimit - secs) : secs;
    const m = Math.floor(display / 60);
    const s = display % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── Settings Sub-bar ── */}
      <div
        style={{
          position: "fixed",
          top: 60,
          left: 0,
          right: 0,
          zIndex: 90,
          background: "var(--paper-dark)",
          borderBottom: "2px solid var(--paper-darker)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          height: 52,
          paddingInline: 32,
        }}
      >
        {/* Punctuation */}
        <button
          disabled={started && !completed}
          onClick={() => setUsePunctuation((p) => !p)}
          style={{
            opacity: started && !completed ? 0.3 : 1,
            pointerEvents: started && !completed ? "none" : "auto",
            background: "none",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: 7,
            cursor: "pointer",
            fontFamily: "var(--font-courier)",
            fontSize: 16,
            fontWeight: 700,
            color: usePunctuation ? "var(--ink)" : "var(--ink-faint)",
            letterSpacing: "0.04em",
            transition: "color 0.15s",
          }}
        >
          punctuation
        </button>

        {/* Case */}
        <button
          disabled={started && !completed}
          onClick={() => setUseLowercase((l) => !l)}
          style={{
            opacity: started && !completed ? 0.3 : 1,
            pointerEvents: started && !completed ? "none" : "auto",
            background: "none",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: 4,
            cursor: "pointer",
            fontFamily: "var(--font-courier)",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          <span
            style={{
              color: !useLowercase ? "var(--ink)" : "var(--ink-faint)",
              transition: "color 0.15s",
            }}
          >
            A
          </span>
          <span
            style={{
              color: useLowercase ? "var(--ink)" : "var(--ink-faint)",
              transition: "color 0.15s",
            }}
          >
            a
          </span>
        </button>

        <div
          style={{ width: 1, height: 24, background: "var(--paper-darker)" }}
        />

        {/* Mode */}
        {(["jumbled", "exact"] as const).map((m) => (
          <button
            key={m}
            disabled={started && !completed}
            onClick={() => setMode(m)}
            style={{
              opacity: started && !completed ? 0.3 : 1,
              pointerEvents: started && !completed ? "none" : "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-courier)",
              fontSize: 16,
              fontWeight: 700,
              color: mode === m ? "var(--stamp-navy)" : "var(--ink-faint)",
              letterSpacing: "0.04em",
              transition: "color 0.15s",
              borderBottom:
                mode === m
                  ? "2px solid var(--stamp-navy)"
                  : "2px solid transparent",
              paddingBottom: 2,
            }}
          >
            {m}
          </button>
        ))}

        <div
          style={{ width: 1, height: 24, background: "var(--paper-darker)" }}
        />

        {/* Time limits / Mode selection */}
        {(["words", 15, 30, 60] as const).map((val) => {
          const isSelected = val === "words" ? timeLimit === null : timeLimit === val;
          return (
            <button
              key={val}
              disabled={started && !completed}
              onClick={() => setTimeLimit(val === "words" ? null : val)}
              style={{
                opacity: started && !completed ? 0.3 : 1,
                pointerEvents: started && !completed ? "none" : "auto",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-courier)",
                fontSize: 16,
                fontWeight: 700,
                color: isSelected ? "var(--stamp-navy)" : "var(--ink-faint)",
                letterSpacing: "0.04em",
                transition: "color 0.15s",
                borderBottom: isSelected
                  ? "2px solid var(--stamp-navy)"
                  : "2px solid transparent",
                paddingBottom: 2,
              }}
            >
              {val}
            </button>
          );
        })}
      </div>

      {/* ── Main area ── */}
      <div
        style={{
          display: "flex",
          flex: 1,
          width: "100%",
          height: "100%",
          position: "relative",
          flexDirection: "column",
          paddingTop: 52, // Clear the fixed settings sub-bar
        }}
      >
        {/* Enforced Repetition Progress / Practice Mode Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 48px 0 48px",
            height: 36,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                background: (isPractice || isGuest) ? "var(--paper-darker)" : "var(--stamp-navy)",
                color: (isPractice || isGuest) ? "var(--ink)" : "var(--white)",
                padding: "6px 12px",
                borderRadius: "4px",
                fontSize: 12,
                fontFamily: "var(--font-courier)",
                fontWeight: 700,
                letterSpacing: "0.05em",
                border: (isPractice || isGuest) ? "1px solid var(--paper-darker)" : "none",
              }}
            >
              {isGuest ? "GUEST MODE" : isPractice ? "PRACTICE MODE" : "AD MODE"}
            </span>
            {isPractice && (
              <span
                style={{
                  fontFamily: "var(--font-libre)",
                  fontSize: 12,
                  color: "var(--ink-light)",
                }}
              >
              </span>
            )}
            <button
              onClick={() => {
                const newMode = viewMode === "focus" ? "normal" : "focus";
                setViewMode(newMode);
                // Immediately update visible words based on new mode
                if (newMode === "normal") {
                  const toShow = Math.max(40, activeWordIdx + 20);
                  setVisibleWords(wordPool.slice(0, toShow));
                  poolIndexRef.current = Math.min(toShow, wordPool.length);
                } else {
                  const toShow = Math.max(3, activeWordIdx + 3);
                  setVisibleWords(wordPool.slice(0, toShow));
                  poolIndexRef.current = toShow;
                }
              }}
              style={{
                marginLeft: 16,
                background: "transparent",
                border: "1px solid var(--ink-faint)",
                color: "var(--ink-light)",
                padding: "4px 8px",
                borderRadius: 4,
                cursor: "pointer",
                fontFamily: "var(--font-courier)",
                fontSize: 10,
              }}
            >
              MODE: {viewMode.toUpperCase()}
            </button>
            {isGuest && (
              <a
                href="/login"
                style={{
                  marginLeft: 16,
                  background: "var(--ink)",
                  border: "none",
                  color: "var(--paper)",
                  padding: "4px 12px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontFamily: "var(--font-courier)",
                  fontSize: 11,
                  fontWeight: 700,
                  textDecoration: "none"
                }}
              >
                SIGN UP TO EARN
              </a>
            )}
          </div>

          {!isPractice && totalRepeats && (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {Array.from({ length: totalRepeats }).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background:
                      idx < repeatNumber - 1
                        ? "var(--stamp-navy)"
                        : idx === repeatNumber - 1
                          ? "var(--stamp-navy)"
                          : "var(--paper-darker)",
                    border: idx === repeatNumber - 1 ? "2px solid var(--ink)" : "none",
                    transition: "all 0.3s",
                  }}
                />
              ))}
            </div>
          )}
        </div>
        {/* ── Stats bar ── */}
        <div
          style={{
            display: "flex",
            gap: 24,
            padding: "20px 48px 0 48px",
            fontFamily: "var(--font-courier)",
            fontSize: 13,
            color: "var(--ink-faint)",
            minHeight: 40,
          }}
        >
          {started && !completed && (
            <>
              <span>
                <strong style={{ color: "var(--stamp-navy)", fontSize: 16 }}>
                  {wpm}
                </strong>{" "}
                wpm
              </span>
              <span>
                <strong
                  style={{
                    color: accuracy >= 90 ? "var(--ink)" : "var(--stamp-red)",
                    fontSize: 16,
                  }}
                >
                  {accuracy}%
                </strong>{" "}
                acc
              </span>
              {timeLimit && (
                <span
                  style={{
                    color:
                      timeLimit && timeLimit - elapsedSeconds <= 5
                        ? "var(--stamp-red)"
                        : "var(--stamp-navy)",
                    fontSize: 24,
                    fontWeight: 900,
                    transition: "color 0.3s",
                    marginLeft: 16,
                  }}
                >
                  {formatTime(elapsedSeconds)}
                </span>
              )}
            </>
          )}
        </div>

        {/* ── Horizontal Typing Lane ── */}
        <div style={{ position: "relative", width: "100%", marginTop: 100 }}>
          {/* Sloth rides above the active word, safely outside overflow:hidden */}
          {viewMode === "focus" && !completed && !discarded && (
            <div
              className="sloth-runner"
              style={{
                left: `${slothX}%`,
              }}
            >
              {started && !completed && elapsedSeconds >= 1 && (
                <div className="sloth-thought-bubble">
                  {wpm < 50
                    ? "the hell dude ! you are slower then me "
                    : wpm <= 80
                      ? "now we talking bud ..."
                      : wpm <= 150
                        ? "daem dude you are making me throw fast, I cant handle ts ! .."
                        : "my team hasn't even told me how to tease you at this speed"}
                </div>
              )}

              <div className="sloth-arm-container">
                {armTrigger > 0 && (
                  <div key={armTrigger} className="sloth-stretching-arm" />
                )}
              </div>

              <Image
                src="/sloth.png"
                alt="Sloth"
                width={100}
                height={100}
                priority
                style={{
                  objectFit: "contain",
                  filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.15))",
                  // Tilt forward when typing fast — max 12deg
                  transform: `rotate(${Math.min(wpm / 10, 12)}deg)`,
                  transformOrigin: "bottom center",
                  transition: "transform 0.4s ease",
                  position: "relative",
                  zIndex: 2,
                }}
              />
            </div>
          )}

          <div
            ref={laneRef}
            className="typing-lane-wrapper"
            style={{ 
              marginTop: 0, 
              height: viewMode === "normal" ? "270px" : undefined, // 4 lines * 60px + 3 gaps * 10px = 270px
              overflow: viewMode === "normal" ? "hidden" : undefined,
              position: "relative"
            }}
            onClick={() => inputRef.current?.focus()}
          >
            {/* Fade masks left & right */}
            {viewMode === "focus" && <div className="lane-fade-left" />}
            {viewMode === "focus" && <div className="lane-fade-right" />}

            {/* The actual word track — JS drives translateX to scroll */}
            <div 
              ref={trackRef} 
              className="typing-lane-track"
              style={viewMode === "normal" ? { 
                whiteSpace: "pre-wrap", 
                flexWrap: "wrap", 
                justifyContent: "flex-start",
                alignContent: "flex-start",
                display: "flex",
                gap: "10px",
                width: "100%",
                maxWidth: "1000px",
                margin: "0 auto",
                padding: "0",
                fontSize: "40px",
                lineHeight: "1.5"
              } : undefined}
            >
              {visibleWords.length === 0 ? (
                <span className="word-lane-waiting">Loading…</span>
              ) : (
                visibleWords.map((word, wi) => {
                  const states = wordCharStates[wi] ?? [];
                  const isActive = wi === activeWordIdx;
                  const isDone = wi < activeWordIdx;
                  const isFuture = wi > activeWordIdx;

                  // Gradually fade future words the farther they are (depth effect)
                  const futureDistance = wi - activeWordIdx;
                  const futureOpacity = isFuture
                    ? Math.max(0.15, 0.75 - futureDistance * 0.12)
                    : undefined;

                  return (
                    <span
                      key={wi}
                      ref={isActive ? activeWordRef : undefined}
                      className={`wl-word ${isDone ? "wl-done" : ""} ${isActive ? "wl-active" : ""} ${isFuture ? "wl-future" : ""}`}
                      style={isFuture ? { opacity: futureOpacity } : undefined}
                    >
                      {word.split("").map((ch, ci) => {
                        const st = states[ci];
                        const isCaret = isActive && ci === charIdx;
                        const isError = st === "error" || st?.startsWith("error_");
                        return (
                          <span
                            key={ci}
                            className={`wl-ch ${st === "correct" ? "correct" : isError ? "error" : ""} ${isCaret ? "wl-caret" : ""}`}
                          >
                            {ch}
                          </span>
                        );
                      })}
                      {/* Caret past last char (only when no extra characters typed yet) */}
                      {isActive && charIdx === word.length && (
                        <span
                          className="wl-ch wl-caret"
                          style={{ width: 2, display: "inline-block" }}
                        >
                          {" "}
                        </span>
                      )}
                      {/* Extra characters typed beyond word length */}
                      {states.slice(word.length).map((st, extraIdx) => {
                        const charPos = word.length + extraIdx;
                        const isCaret = isActive && charPos === charIdx;
                        const typedChar = st.startsWith("error_") ? st.substring(6) : "?";
                        return (
                          <span
                            key={charPos}
                            className={`wl-ch error wl-extra-ch ${isCaret ? "wl-caret" : ""}`}
                            style={{ color: "var(--stamp-red)", background: "none" }}
                          >
                            {typedChar}
                          </span>
                        );
                      })}
                      {/* Caret past all extra characters */}
                      {isActive && charIdx > word.length && (
                        <span
                          className="wl-ch wl-caret"
                          style={{ width: 2, display: "inline-block" }}
                        >
                          {" "}
                        </span>
                      )}
                    </span>
                  );
                })
              )}
            </div>
          </div>
        </div>





        {/* ── Hidden input ── */}
        <input
          ref={inputRef}
          type="text"
          value=""
          onKeyDown={handleKeyDown}
          onPaste={(e) => e.preventDefault()}
          onChange={() => {}}
          style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
          disabled={completed || discarded}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />

        {/* ── Completion overlay ── */}
        {completed && !discarded && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--paper)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 95,
            }}
          >
            {(isPractice || isGuest) ? (
              /* ── Inline results for practice / guest ── */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  maxWidth: 600,
                  padding: "32px",
                  background: "var(--paper)",
                }}
              >
                <div className="label-sm" style={{ color: "var(--ink-faint)", marginBottom: 8 }}>
                  {isPractice ? "PRACTICE SESSION COMPLETE" : "SESSION COMPLETE"}
                </div>
                <h2 className="font-headline" style={{ fontSize: 36, marginBottom: 32 }}>
                  PERFORMANCE REPORT
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 32,
                    width: "100%",
                    marginBottom: 40,
                    textAlign: "center",
                  }}
                >
                  <div style={{ borderRight: "1px solid var(--paper-darker)" }}>
                    <div className="label-sm" style={{ fontSize: 11, marginBottom: 8 }}>WPM</div>
                    <div style={{ fontFamily: "var(--font-courier)", fontSize: 48, fontWeight: 900, color: "var(--stamp-navy)" }}>
                      {wpm}
                    </div>
                  </div>
                  <div style={{ borderRight: "1px solid var(--paper-darker)" }}>
                    <div className="label-sm" style={{ fontSize: 11, marginBottom: 8 }}>ACCURACY</div>
                    <div style={{ fontFamily: "var(--font-courier)", fontSize: 48, fontWeight: 900, color: accuracy >= 90 ? "var(--ink)" : "var(--stamp-red)" }}>
                      {accuracy}%
                    </div>
                  </div>
                  <div>
                    <div className="label-sm" style={{ fontSize: 11, marginBottom: 8 }}>TIME</div>
                    <div style={{ fontFamily: "var(--font-courier)", fontSize: 48, fontWeight: 900, color: "var(--ink)" }}>
                      {elapsedSeconds}s
                    </div>
                  </div>
                </div>

                <div style={{ width: "100%", height: "auto", marginBottom: 40 }}>
                  <ResultsCharts samples={accuracySamplesRef.current} />
                </div>

                <div style={{ display: "flex", gap: 16 }}>
                  <button
                    onClick={() => {
                      setPracticeTrigger(prev => prev + 1);
                    }}
                    className="btn btn-inverted"
                    style={{ width: 240, padding: "16px", fontSize: 14 }}
                  >
                    PRACTICE AGAIN
                  </button>
                  <button
                    onClick={() => {
                      router.push("/");
                    }}
                    className="btn"
                    style={{ width: 180, padding: "16px", fontSize: 14 }}
                  >
                    EXIT TO HOME
                  </button>
                </div>
              </div>
            ) : (
              /* ── Spinner while saving + redirecting to /results/[sessionId] ── */
              <>
                <div
                  className="font-headline"
                  style={{
                    fontSize: 32,
                    marginBottom: 24,
                    textTransform: "uppercase",
                  }}
                >
                  {submitting ? "RECORDING SESSION…" : "REDIRECTING…"}
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    border: "2px solid var(--paper-darker)",
                    borderTopColor: "var(--ink)",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* ── Discarded overlay ── */}
        {discarded && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--paper)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 95,
            }}
          >
            <div
              className="font-headline"
              style={{
                fontSize: 32,
                marginBottom: 16,
                textTransform: "uppercase",
              }}
            >
              TEST DISCARDED
            </div>
            <p
              className="font-body"
              style={{ color: "var(--ink-faint)", marginBottom: 32 }}
            >
              The session was abandoned due to inactivity.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-inverted"
            >
              START NEW TEST
            </button>
          </div>
        )}
      </div>
    </>
  );
}
