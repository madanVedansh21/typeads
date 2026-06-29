"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import type { Campaign } from "@/lib/supabase/types";

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

type CharState = "correct" | "error";

interface Props {
  campaign: Campaign;
  userId: string;
}

/* ─────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────── */
// How many words to keep visible ahead of the active word
const BASE_LOOKAHEAD = 3;

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */
export default function TypingInterface({ campaign, userId }: Props) {
  const router = useRouter();
  const rawText = campaign.ad_text;

  /* ── Settings ── */
  const [usePunctuation, setUsePunctuation] = useState(true);
  const [useLowercase, setUseLowercase] = useState(false);
  const [mode, setMode] = useState<"jumbled" | "exact">("jumbled");
  const [timeLimit, setTimeLimit] = useState<number | null>(30);

  /* ── Full word pool (derived from settings) ── */
  const [wordPool, setWordPool] = useState<string[]>([]);
  const campaignWordCountRef = useRef(0);
  const timeLimitRef = useRef<number | null>(null);

  /* ── Visible word queue: only a sliding window of words shown ── */
  // visibleWords: the words currently rendered in the lane
  // poolIndexRef: how many words from the pool have been fed in so far
  const [visibleWords, setVisibleWords] = useState<string[]>([]);
  const [activeWordIdx, setActiveWordIdx] = useState(0); // index into visibleWords
  const [charIdx, setCharIdx] = useState(0);
  const [wordCharStates, setWordCharStates] = useState<
    Record<number, CharState[]>
  >({});
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

  /* ── Anti-fraud refs ── */
  const keystrokesRef = useRef<KeystrokeRecord[]>([]);
  const accuracySamplesRef = useRef<AccuracySample[]>([]);
  const lastKeystrokeTimeRef = useRef(0);
  const startTimeRef = useRef(0);
  const sessionIdRef = useRef(uuidv4());
  const consecutiveErrorsRef = useRef(0);

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

    let text = rawText;
    if (mode === "jumbled") {
      const ws = text.split(/\s+/);
      for (let i = ws.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
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

    // Full reset — start with only the first window of words visible
    const initialCount = 3;
    const initialWords = wordList.slice(0, initialCount);
    poolIndexRef.current = initialCount;

    setVisibleWords(initialWords);
    setActiveWordIdx(0);
    setCharIdx(0);
    setWordCharStates({});
    setStarted(false);
    setCompleted(false);
    setDiscarded(false);
    setElapsedSeconds(0);
    setWpm(0);
    setAccuracy(100);
    setTotalKeystrokes(0);
    setCorrectKeystrokes(0);
    correctCharsRef.current = 0;
    keystrokesRef.current = [];
    accuracySamplesRef.current = [];
    lastKeystrokeTimeRef.current = 0;
    startTimeRef.current = 0;
    sessionIdRef.current = uuidv4();
    consecutiveErrorsRef.current = 0;
    // Reset scroll
    scrollXRef.current = 0;
    if (trackRef.current) trackRef.current.style.transform = "translateX(0px)";
    setSlothX(50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usePunctuation, useLowercase, mode, rawText]);

  useEffect(() => {
    timeLimitRef.current = timeLimit;
  }, [timeLimit]);

  /* ═══════════════════════════════════════════════════════════
     DYNAMIC LOOKAHEAD — feed more words from pool as user types
     Keeps (lookahead) words ahead of the active word visible
  ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!started) return;

    // Lookahead is strictly fixed to 3 words ahead to prevent the sloth from running out of frame
    const lookahead = BASE_LOOKAHEAD;

    // How many words ahead of active word are currently in the visible list?
    const wordsAhead = visibleWords.length - activeWordIdx;

    if (wordsAhead < lookahead && poolIndexRef.current < wordPool.length) {
      const needed = lookahead - wordsAhead;
      const toAdd = wordPool.slice(
        poolIndexRef.current,
        poolIndexRef.current + needed,
      );
      if (toAdd.length > 0) {
        poolIndexRef.current += toAdd.length;
        setVisibleWords((prev) => [...prev, ...toAdd]);
        setArmTrigger((prev) => prev + 1);
      }
    }
  }, [activeWordIdx, wpm, started, visibleWords.length, wordPool]);

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
      if (!activeWordRef.current || !laneRef.current || !trackRef.current)
        return;

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
  }, [activeWordIdx, wpm, visibleWords.length, completed, discarded]);

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
          ? Math.round(correctCharsRef.current / 5 / elapsedMin)
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
      if (submitting || completed) return; // Prevent double-submit race conditions
      setCompleted(true);
      setSubmitting(true);

      const rawSecs = (Date.now() - startTimeRef.current) / 1000;
      const duration = finalSecs ?? Math.max(0.1, rawSecs);
      const elapsedMin = Math.max(0.001, duration / 60);
      const finalWpm =
        elapsedMin > 0
          ? Math.round(correctCharsRef.current / 5 / elapsedMin)
          : 0;

      try {
        await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionIdRef.current,
            user_id: userId,
            campaign_id: campaign.id,
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
      } catch (err) {
        console.error("Session submit error:", err);
      } finally {
        setSubmitting(false);
        router.push(`/results/${sessionIdRef.current}`);
      }
    },
    [campaign.id, mode, userId, usePunctuation, useLowercase, router],
  );

  const totalKeystrokesRef = useRef(0);
  const correctKeystrokesRef = useRef(0);
  const accuracyRef = useRef(100);

  useEffect(() => {
    totalKeystrokesRef.current = totalKeystrokes;
    correctKeystrokesRef.current = correctKeystrokes;
    accuracyRef.current = accuracy;
  }, [totalKeystrokes, correctKeystrokes, accuracy]);

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
        if (charIdx > 0) {
          const newCi = charIdx - 1;
          setCharIdx(newCi);
          setWordCharStates((prev) => {
            const ws = [...(prev[activeWordIdx] ?? [])];
            ws.splice(newCi);
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

        // Prevent advancing if the word is not fully typed
        if (charIdx < currentWord.length) return;

        const nextWi = activeWordIdx + 1;

        // Track total words typed against pool
        const totalTyped =
          poolIndexRef.current - (visibleWords.length - nextWi);

        setActiveWordIdx(nextWi);
        setCharIdx(0);

        // Complete when all campaign words are typed, regardless of timed or non-timed mode
        if (totalTyped >= campaignWordCountRef.current) {
          setCompleted(true);
          const secs = (now - startTimeRef.current) / 1000;
          handleComplete(
            totalKeystrokes,
            correctKeystrokes,
            accuracyRef.current,
            secs,
          );
        }
        return;
      }

      /* ── Ignore non-printable ── */
      if (e.key.length !== 1) return;
      if (charIdx >= currentWord.length) return;
      e.preventDefault();

      keystrokesRef.current.push({
        key: e.key,
        timestamp: now,
        interval_ms: interval,
      });
      const isCorrect = e.key === currentWord[charIdx];
      const newTotal = totalKeystrokes + 1;
      const newCorrect = correctKeystrokes + (isCorrect ? 1 : 0);

      if (isCorrect) {
        correctCharsRef.current += 1;
        consecutiveErrorsRef.current = 0;
      } else {
        consecutiveErrorsRef.current += 1;
        // Anti-mash detection: Discard session if typing complete gibberish
        if (consecutiveErrorsRef.current > 15) {
          setDiscarded(true);
          setCompleted(true);
          return;
        }
      }

      setTotalKeystrokes(newTotal);
      setCorrectKeystrokes(newCorrect);
      const newAcc =
        newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 100;
      setAccuracy(newAcc);

      if (newTotal % 5 === 0) {
        const min = (now - startTimeRef.current) / 60000;
        accuracySamplesRef.current.push({
          char_index: newTotal,
          time_sec: Math.round((now - startTimeRef.current) / 1000),
          accuracy: newAcc,
          wpm: min > 0 ? Math.round(correctCharsRef.current / 5 / min) : 0,
        });
      }

      setWordCharStates((prev) => {
        const ws = [...(prev[activeWordIdx] ?? [])];
        ws[charIdx] = isCorrect ? "correct" : "error";
        return { ...prev, [activeWordIdx]: ws };
      });

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
          <span style={{ color: "var(--stamp-navy)", fontSize: 18 }}>@</span>{" "}
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

          <div
            ref={laneRef}
            className="typing-lane-wrapper"
            style={{ marginTop: 0 }} // overriding the css margin-top since wrapper handles it
            onClick={() => inputRef.current?.focus()}
          >
            {/* Fade masks left & right */}
            <div className="lane-fade-left" />
            <div className="lane-fade-right" />

            {/* The actual word track — JS drives translateX to scroll */}
            <div ref={trackRef} className="typing-lane-track">
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
                        return (
                          <span
                            key={ci}
                            className={`wl-ch ${st ?? ""} ${isCaret ? "wl-caret" : ""}`}
                          >
                            {ch}
                          </span>
                        );
                      })}
                      {/* Caret past last char */}
                      {isActive && charIdx >= word.length && (
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

        {/* ── Revealed Ad Text ── */}
        <div
          style={{
            padding: "0 48px",
            maxWidth: "calc(100% - 400px)",
            marginTop: "auto",
            marginBottom: 60,
          }}
        >
          <div
            className="label-sm"
            style={{
              marginBottom: 12,
              color: "var(--ink)",
              display: "flex",
              gap: 24,
              alignItems: "center",
            }}
          >
            <span>AD COPY</span>
            {!started && !completed && !discarded && (
              <span style={{ color: "var(--stamp-navy)" }}>
                {" "}
                START TYPING TO BEGIN MORE WORDS WILL APPEAR
              </span>
            )}
          </div>
          <div
            className="font-body"
            style={{
              fontSize: 20,
              color: "var(--ink)",
              lineHeight: 1.6,
              minHeight: 64,
            }}
          >
            {visibleWords.slice(0, activeWordIdx).join(" ")}
            {activeWordIdx > 0 ? " " : ""}
            <span style={{ color: "var(--ink)" }}>
              {visibleWords[activeWordIdx]?.substring(0, charIdx)}
            </span>
          </div>
        </div>

        {/* ── Ad Image / Placeholder ── */}
        <div
          style={{
            position: "absolute",
            bottom: 120,
            right: 48,
            width: 320,
            height: 240,
            border: "2px dashed var(--paper-darker)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--paper-dark)",
            zIndex: 9999,
          }}
        >
          {campaign.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={campaign.image_url} 
              alt="Ad Image" 
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 4 }} 
            />
          ) : (
            <div
              className="label-sm"
              style={{
                color: "var(--ink-faint)",
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              AD IMAGE
              <br />
              PLACEHOLDER
            </div>
          )}
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
              zIndex: 10,
            }}
          >
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
              zIndex: 10,
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
