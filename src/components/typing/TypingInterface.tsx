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
  const mode = "exact";
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

  /* ── Track whether the hidden input is focused ── */
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(" ");

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
      // If capitals are selected (!useLowercase), capitalize some words from the JSON list
      if (!useLowercase) {
        const wordsArray = text.split(/\s+/);
        const capitalized = wordsArray.map((w, idx) => {
          // Capitalize every 3rd word, or first word of sentences
          if (idx % 3 === 0 && w.length > 0) {
            return w.charAt(0).toUpperCase() + w.slice(1);
          }
          return w;
        });
        text = capitalized.join(" ");
      }
      
      // If punctuation is selected, add basic punctuation to some words
      if (usePunctuation) {
        const wordsArray = text.split(/\s+/);
        const punctuated = wordsArray.map((w, idx) => {
          if (idx % 5 === 4 && w.length > 0) {
            return w + ".";
          } else if (idx % 8 === 3 && w.length > 0) {
            return w + ",";
          } else if (idx % 12 === 7 && w.length > 0) {
            return w + "?";
          }
          return w;
        });
        text = punctuated.join(" ");
      }
    } else {
      text = rawText;
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
     FOCUS INPUT — auto-focus on mount + re-focus on any click
  ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    // Focus immediately on mount
    setTimeout(() => inputRef.current?.focus(), 100);

    // Re-focus when user clicks anywhere on the page (except buttons/links)
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = target.closest('a, button, select, [role="button"]');
      if (!isInteractive && !completed && !discarded) {
        inputRef.current?.focus();
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [completed, discarded]);

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

      // Guest only: show inline results without saving to DB
      if (isGuest) {
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
  const processBackspace = useCallback(() => {
    if (charIdx > 0) {
      const newCi = charIdx - 1;
      setCharIdx(newCi);
      setWordCharStates((prev) => {
        const ws = [...(prev[activeWordIdx] ?? [])].slice(0, newCi);
        const stillHasError = ws.some(
          (s) => s !== undefined && s !== "correct"
        );
        setWordHasError((prevErrors) => ({
          ...prevErrors,
          [activeWordIdx]: stillHasError,
        }));
        netCorrectCharsRef.current = getNetCorrectCharactersCount(
          ws,
          { ...wordHasError, [activeWordIdx]: stillHasError }
        );
        return { ...prev, [activeWordIdx]: ws };
      });
    }
  }, [charIdx, activeWordIdx, wordHasError]);

  const processSpace = useCallback(() => {
    const currentWord = visibleWords[activeWordIdx];
    if (!currentWord) return;

    if (charIdx === 0) return;

    const finalWordStates = [...(wordCharStates[activeWordIdx] ?? [])];
    let missedCount = 0;
    for (let i = charIdx; i < currentWord.length; i++) {
      finalWordStates[i] = "error";
      missedCount++;
    }

    const currentWordAlreadyHadError = wordHasError[activeWordIdx] ?? false;
    const wordIsError = currentWordAlreadyHadError || missedCount > 0;

    totalKeystrokesCounterRef.current += missedCount;

    const newTotalKeystrokes = totalKeystrokesCounterRef.current;
    const newCorrectKeystrokes = correctKeystrokesCounterRef.current;
    const newAcc = newTotalKeystrokes > 0
      ? Math.round((newCorrectKeystrokes / newTotalKeystrokes) * 100)
      : 100;

    setTotalKeystrokes(newTotalKeystrokes);
    setAccuracy(newAcc);

    setWordHasError((prevErrors) => ({ ...prevErrors, [activeWordIdx]: wordIsError }));
    setWordCharStates((prev) => {
      const updatedErrorMap = { ...wordHasError, [activeWordIdx]: wordIsError };
      let count = 0;
      for (let wi = 0; wi <= activeWordIdx; wi++) {
        if (updatedErrorMap[wi]) continue;
        const word = visibleWords[wi];
        if (!word) continue;
        const states = wi === activeWordIdx ? finalWordStates : (prev[wi] ?? []);
        for (let ci = 0; ci < word.length; ci++) {
          if (states[ci] === "correct") count++;
        }
        count++;
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
      const now = Date.now();
      const secs = (now - startTimeRef.current) / 1000;
      handleComplete(
        totalKeystrokesCounterRef.current,
        correctKeystrokesCounterRef.current,
        newAcc,
        secs,
      );
    }
  }, [
    activeWordIdx,
    charIdx,
    visibleWords,
    wordCharStates,
    wordHasError,
    handleComplete,
  ]);

  const processCharacter = useCallback((key: string) => {
    const currentWord = visibleWords[activeWordIdx];
    if (!currentWord) return;

    const now = Date.now();
    const interval = lastKeystrokeTimeRef.current
      ? now - lastKeystrokeTimeRef.current
      : 0;
    lastKeystrokeTimeRef.current = now;

    if (!started) {
      if (key === " ") return;
      setStarted(true);
      startTimeRef.current = now;
    }

    const isExtra = charIdx >= currentWord.length;
    if (isExtra && charIdx >= currentWord.length + 10) {
      return;
    }

    keystrokesRef.current.push({
      key: key,
      timestamp: now,
      interval_ms: interval,
    });

    const isCorrect = !isExtra && key === currentWord[charIdx];

    totalKeystrokesCounterRef.current += 1;
    if (isCorrect) correctKeystrokesCounterRef.current += 1;

    const newTotal = totalKeystrokesCounterRef.current;
    const newCorrect = correctKeystrokesCounterRef.current;

    if (isCorrect) {
      consecutiveErrorsRef.current = 0;
    } else {
      consecutiveErrorsRef.current += 1;
      if (consecutiveErrorsRef.current > 15) {
        setDiscarded(true);
        setCompleted(true);
        return;
      }
      setWordHasError((prevErrors) => ({ ...prevErrors, [activeWordIdx]: true }));
    }

    setTotalKeystrokes(newTotal);
    setCorrectKeystrokes(newCorrect);
    
    const newAcc = newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 100;
    setAccuracy(newAcc);

    setWordCharStates((prev) => {
      const ws = [...(prev[activeWordIdx] ?? [])];
      ws[charIdx] = isCorrect ? "correct" : `error_${key}`;
      const updatedErrorMap = isCorrect
        ? wordHasError
        : { ...wordHasError, [activeWordIdx]: true };
      netCorrectCharsRef.current = getNetCorrectCharactersCount(ws, updatedErrorMap);
      return { ...prev, [activeWordIdx]: ws };
    });

    if (newTotal % 5 === 0) {
      const min = (now - startTimeRef.current) / 60000;
      accuracySamplesRef.current.push({
        char_index: newTotal,
        time_sec: Math.round((now - startTimeRef.current) / 1000),
        accuracy: newAcc,
        wpm: min > 0 ? Math.round(netCorrectCharsRef.current / 5 / min) : 0,
      });
    }

    setCharIdx(charIdx + 1);
  }, [
    started,
    activeWordIdx,
    charIdx,
    visibleWords,
    wordHasError,
  ]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length > 1) {
      const chs = val.slice(1);
      for (const ch of chs) {
        if (ch === " ") {
          processSpace();
        } else {
          processCharacter(ch);
        }
      }
    } else if (val.length === 0) {
      processBackspace();
    }
    setInputValue(" ");
  }, [processBackspace, processSpace, processCharacter]);

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

      if (e.key === "Backspace") {
        e.preventDefault();
        if (e.ctrlKey) {
          // Ctrl+Backspace: clear entire active word progress.
          setCharIdx(0);
          setWordHasError((prevErrors) => ({ ...prevErrors, [activeWordIdx]: false }));
          setWordCharStates((prev) => {
            let count = 0;
            for (let wi = 0; wi < activeWordIdx; wi++) {
              if (wordHasError[wi]) continue;
              const word = visibleWords[wi];
              if (!word) continue;
              const states = prev[wi] ?? [];
              for (let ci = 0; ci < word.length; ci++) {
                if (states[ci] === "correct") count++;
              }
              count++;
            }
            netCorrectCharsRef.current = count;
            return { ...prev, [activeWordIdx]: [] };
          });
          return;
        }
        processBackspace();
        return;
      }

      if (e.key === " ") {
        e.preventDefault();
        processSpace();
        return;
      }

      if (e.key.length === 1) {
        e.preventDefault();
        processCharacter(e.key);
      }
    },
    [
      started,
      activeWordIdx,
      visibleWords,
      wordHasError,
      processBackspace,
      processSpace,
      processCharacter,
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
      <div className="typing-settings-bar">
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

        {/* Time limits / Mode selection */}
        {([15, 30, 60] as const).map((val) => {
          const isSelected = timeLimit === val;
          return (
            <button
              key={val}
              disabled={started && !completed}
              onClick={() => setTimeLimit(val)}
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
            flexWrap: "wrap",
            gap: 12,
            padding: "20px clamp(12px, 4vw, 48px) 0 clamp(12px, 4vw, 48px)",
            minHeight: 36,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
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
            padding: "20px clamp(12px, 4vw, 48px) 0 clamp(12px, 4vw, 48px)",
            fontFamily: "var(--font-courier)",
            fontSize: 13,
            color: "var(--ink-faint)",
            minHeight: 40,
            flexWrap: "wrap",
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
            {/* ── Click-to-focus overlay ── */}
            {!isFocused && !completed && !discarded && (
              <div
                onClick={() => inputRef.current?.focus()}
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 50,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(196, 188, 179, 0.9)",
                  backdropFilter: "blur(4px)",
                  cursor: "pointer",
                  transition: "opacity 0.2s ease",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-canopee)",
                      fontSize: 28,
                      textTransform: "uppercase",
                      color: "var(--ink)",
                      marginBottom: 8,
                      animation: "pulse 2s ease-in-out infinite",
                    }}
                  >
                    Click here to start typing
                  </div>
                  <div
                    className="font-body"
                    style={{ fontSize: 14, opacity: 0.6, color: "var(--ink)" }}
                  >
                    or press any key
                  </div>
                </div>
              </div>
            )}
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
          value={inputValue}
          onKeyDown={handleKeyDown}
          onPaste={(e) => e.preventDefault()}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{ position: "absolute", opacity: 0, width: 1, height: 1, overflow: "hidden" }}
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
              overflowY: "auto",
              padding: "40px 24px",
              zIndex: 95,
            }}
          >
            {(isPractice || isGuest) ? (
              /* ── Inline results for practice / guest ── */
              <div
                style={{
                  maxWidth: 1200,
                  margin: "0 auto",
                  width: "100%",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    borderBottom: "2px solid var(--ink)",
                    paddingBottom: 16,
                    marginBottom: 32,
                    textAlign: "left",
                  }}
                >
                  <div className="label-sm">DISPATCH REPORT</div>
                  <h1 className="font-headline" style={{ fontSize: 48, marginTop: 12 }}>
                    {isPractice ? "PRACTICE COMPLETE" : "SESSION COMPLETE"}
                  </h1>
                </div>

                {/* Metadata Configuration */}
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    marginBottom: 32,
                    padding: "12px 16px",
                    background: "var(--paper-dark)",
                    border: "1px solid var(--paper-darker)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 24,
                      fontFamily: "var(--font-courier)",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--ink-faint)",
                    }}
                  >
                    <div>{mode || "jumbled"}</div>
                    <div>|</div>
                    <div
                      style={{
                        color: usePunctuation
                          ? "var(--ink)"
                          : "var(--ink-faint)",
                        opacity: usePunctuation ? 1 : 0.45,
                      }}
                    >
                      punctuation
                    </div>
                    <div>|</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span
                        style={{
                          color: !useLowercase
                            ? "var(--ink)"
                            : "var(--ink-faint)",
                          opacity: !useLowercase ? 1 : 0.4,
                          fontWeight: !useLowercase ? 900 : 700,
                        }}
                      >
                        A
                      </span>
                      <span style={{ opacity: 0.3 }}>/</span>
                      <span
                        style={{
                          color: useLowercase
                            ? "var(--ink)"
                            : "var(--ink-faint)",
                          opacity: useLowercase ? 1 : 0.4,
                          fontWeight: useLowercase ? 900 : 700,
                        }}
                      >
                        a
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2-Column Layout */}
                <div
                  className="resp-results-grid"
                  style={{
                    gap: 32,
                    marginBottom: 32,
                  }}
                >
                  {/* Left Column: Stats */}
                  <div
                    className="editorial-box"
                    style={{
                      padding: 0,
                      height: "fit-content",
                      display: "flex",
                      flexDirection: "column",
                      background: "var(--paper)",
                    }}
                  >
                    <div
                      className="box-label"
                      style={{ padding: "12px 24px", margin: 0 }}
                    >
                      STATS
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr" }}>
                      {[
                        {
                          label: "WPM",
                          value: wpm,
                          sub: "SESSION SPEED",
                          highlight: true,
                        },
                        {
                          label: "ACCURACY",
                          value: `${accuracy}%`,
                          sub: "TARGET: 90%+",
                          highlight: true,
                        },
                        {
                          label: "POINTS EARNED",
                          value: "0",
                          sub: "SIGN UP TO EARN",
                        },
                        {
                          label: "TIME",
                          value: `${elapsedSeconds}s`,
                          sub: "ELAPSED TIME",
                        },
                      ].map((stat, i) => (
                        <div
                          key={stat.label}
                          style={{
                            padding: "24px",
                            borderBottom:
                              i < 3 ? "1px solid var(--paper-darker)" : "none",
                            textAlign: "left",
                          }}
                        >
                          <div className="label-sm" style={{ marginBottom: 8 }}>
                            {stat.label}
                          </div>
                          <div
                            className="stat-number"
                            style={{
                              fontSize: stat.highlight ? 54 : 36,
                              lineHeight: 1.1,
                              fontFamily: "var(--font-courier)",
                              fontWeight: 900,
                            }}
                          >
                            {stat.value}
                          </div>
                          {stat.sub && (
                            <div
                              style={{
                                fontFamily: "var(--font-courier)",
                                fontSize: 11,
                                color: "var(--ink-faint)",
                                marginTop: 6,
                                fontWeight: 700,
                              }}
                            >
                              {stat.sub}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Chart */}
                  {accuracySamplesRef.current && accuracySamplesRef.current.length > 1 ? (
                    <div className="editorial-box" style={{ background: "var(--paper)" }}>
                      <div className="box-label">TELEMETRY</div>
                      <ResultsCharts samples={accuracySamplesRef.current} />
                    </div>
                  ) : (
                    <div
                      className="editorial-box"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--ink-faint)",
                        fontFamily: "var(--font-courier)",
                        fontSize: 14,
                        background: "var(--paper)",
                        minHeight: 300,
                      }}
                    >
                      NO TELEMETRY DATA AVAILABLE
                    </div>
                  )}
                </div>

                {/* Sign-up CTA for guests */}
                {isGuest && (
                  <div
                    style={{
                      width: "100%",
                      background: "var(--ink)",
                      color: "var(--paper)",
                      padding: "20px 24px",
                      marginBottom: 32,
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      textAlign: "left",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: "var(--font-courier)",
                          fontWeight: 700,
                          fontSize: 13,
                          marginBottom: 4,
                        }}
                      >
                        YOUR RESULTS WERE NOT SAVED
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-libre)",
                          fontSize: 12,
                          opacity: 0.7,
                        }}
                      >
                        Create a free account to save your sessions and earn real rewards.
                      </div>
                    </div>
                    <a
                      href="/signup"
                      style={{
                        fontFamily: "var(--font-courier)",
                        fontSize: 12,
                        fontWeight: 700,
                        background: "var(--paper)",
                        color: "var(--ink)",
                        padding: "10px 20px",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      CREATE ACCOUNT →
                    </a>
                  </div>
                )}

                {/* Actions */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: 16,
                    marginTop: 40,
                    marginBottom: 40,
                  }}
                >
                  <button
                    onClick={() => {
                      setPracticeTrigger((prev) => prev + 1);
                    }}
                    className="btn btn-inverted resp-action-btn"
                  >
                    PRACTICE AGAIN
                  </button>
                  <button
                    onClick={() => {
                      router.push("/");
                    }}
                    className="btn resp-action-btn"
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
