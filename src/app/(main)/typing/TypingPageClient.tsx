"use client";

import { useEffect, useState } from "react";
import TypingInterface from "@/components/typing/TypingInterface";
import { Sparkles, Trophy, X } from "lucide-react";
import { useWordList } from "@/hooks/useWordList";
import { WordBuffer } from "@/lib/word-buffer";
import { Wordset } from "@/lib/words-generator";

interface TypingPageClientProps {
  userId: string | null;
}

interface SessionData {
  mode: "ad" | "practice";
  campaign?: any;
  repeatNumber?: number;
  totalRepeats?: number;
  quotaExhausted?: boolean;
  isGuest?: boolean;
}

export default function TypingPageClient({ userId }: TypingPageClientProps) {
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [practiceText, setPracticeText] = useState("");

  const { words, isLoading: wordsLoading } = useWordList("english");

  useEffect(() => {
    if (words.length > 0) {
      const wordset = new Wordset(words);
      const buffer = new WordBuffer(wordset, {
        mode: "zipf",
        orderedByFrequency: true,
      });
      buffer.reset(50); // generate 50 words for practice
      setPracticeText(buffer.peekAll().join(" "));
    }
  }, [words]);

  useEffect(() => {
    async function fetchNextSession() {
      try {
        const localDate = new Date().toLocaleDateString("sv"); // Format: YYYY-MM-DD
        const res = await fetch(`/api/sessions/next?date=${localDate}`);
        if (!res.ok) throw new Error("Failed to fetch session data");
        const data: SessionData = await res.json();

        setSessionData(data);

        // Check if we should show the one-time practice toast
        if (data.mode === "practice" && data.quotaExhausted) {
          const toastKey = `typeads-practice-toast-${localDate}`;
          const alreadyShown = localStorage.getItem(toastKey);
          if (!alreadyShown) {
            setShowToast(true);
            localStorage.setItem(toastKey, "true");
          }
        }
      } catch (err) {
        console.error("Error loading next session:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchNextSession();
  }, []);

  if (loading) {
    return (
      <div
        className="page-wrapper"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
          fontFamily: "var(--font-courier)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          {/* Animated skeleton loader */}
          <div
            style={{
              width: 64,
              height: 64,
              border: "3px solid var(--paper-darker)",
              borderTopColor: "var(--stamp-navy)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 24px auto",
            }}
          />
          <style jsx global>{`
            @keyframes spin {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
            @keyframes pulse {
              0%,
              100% {
                opacity: 0.6;
              }
              50% {
                opacity: 1;
              }
            }
          `}</style>
          <div
            className="label-sm"
            style={{
              color: "var(--ink-faint)",
              letterSpacing: "0.15em",
              animation: "pulse 1.5s infinite ease-in-out",
            }}
          >
            INITIALIZING DISPATCH SESSION...
          </div>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div
        className="page-wrapper"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
        }}
      >
        <div
          className="editorial-box"
          style={{ padding: "48px", textAlign: "center", maxWidth: 400 }}
        >
          <div className="box-label">SYSTEM ERROR</div>
          <p
            className="font-headline"
            style={{ fontSize: 24, margin: "16px 0" }}
          >
            FAILED TO INIT
          </p>
          <p className="font-body" style={{ color: "var(--ink-light)" }}>
            Something went wrong while connecting to the server. Please refresh
            or try again later.
          </p>
        </div>
      </div>
    );
  }

  const isGuest = sessionData.isGuest || false;
  const isPractice = sessionData.mode === "practice" || isGuest;

  return (
    <div
      className="page-wrapper"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        position: "relative",
      }}
    >
      {/* Premium Toast / Banner for Daily Limit Reached */}
      {showToast && (
        <div
          style={{
            background:
              "linear-gradient(135deg, var(--paper-dark) 0%, var(--paper) 100%)",
            border: "2px solid var(--ink)",
            borderRadius: "8px",
            padding: "16px 24px",
            margin: "24px 48px 0 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
            animation: "slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            position: "relative",
            zIndex: 100,
          }}
        >
          <style jsx>{`
            @keyframes slideDown {
              from {
                transform: translateY(-20px);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
          `}</style>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "var(--stamp-navy)",
                color: "var(--white)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trophy size={20} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-courier)",
                  fontWeight: 900,
                  fontSize: 14,
                  letterSpacing: "0.05em",
                  color: "var(--ink)",
                }}
              >
                DAILY AD QUOTA EXHAUSTED
              </div>
              <div
                style={{
                  fontFamily: "var(--font-libre)",
                  fontSize: 13,
                  color: "var(--ink-light)",
                  marginTop: 2,
                }}
              >
                That's it for today's ads — keep practicing below
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowToast(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ink-faint)",
              padding: 4,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--paper-darker)";
              e.currentTarget.style.color = "var(--ink)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "var(--ink-faint)";
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Main typing panel */}
      {isPractice ? (
        <TypingInterface
          isPractice={true}
          isGuest={isGuest}
          userId={userId ?? undefined}
          practiceText={practiceText || "loading words please wait..."}
        />
      ) : (
        <TypingInterface
          campaign={sessionData.campaign}
          userId={userId ?? undefined}
          repeatNumber={sessionData.repeatNumber}
          totalRepeats={sessionData.totalRepeats}
          isGuest={isGuest}
        />
      )}
    </div>
  );
}
