"use client";
// @ts-nocheck
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type SortMode = "points" | "wpm" | "accuracy";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("wpm");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient() as any;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const { data } = await supabase
        .from("leaderboard")
        .select("*")
        .limit(100);

      setEntries(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const sorted = [...entries].sort((a, b) => {
    if (sortMode === "points") return b.points_balance - a.points_balance;
    if (sortMode === "wpm") return b.avg_wpm - a.avg_wpm;
    if (sortMode === "accuracy") return b.avg_accuracy - a.avg_accuracy;
    return 0;
  });

  const currentUserEntry = sorted.find((e) => e.id === currentUserId);
  const currentUserRank = currentUserEntry
    ? sorted.indexOf(currentUserEntry) + 1
    : null;

  const sortLabel: Record<SortMode, string> = {
    points: "total points balance",
    wpm: "average typing speed",
    accuracy: "average accuracy",
  };

  const filters: { key: SortMode; label: string }[] = [
    { key: "wpm", label: "AVG SPEED" },
    { key: "points", label: "POINTS" },
    { key: "accuracy", label: "ACCURACY" },
  ];

  return (
    <div
      className="page-wrapper"
      style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "2px solid var(--ink)",
          paddingBottom: 16,
          marginBottom: 32,
        }}
      >
        <div className="label-sm">THE REGISTRY</div>
        <h1 className="font-headline" style={{ fontSize: 42, marginTop: 12 }}>
          GLOBAL LEADERBOARD
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            marginTop: 12,
          }}
        >
          <p className="font-body" style={{ color: "var(--ink-light)", margin: 0 }}>
            Top typists ranked by {sortLabel[sortMode]}.
          </p>

          {/* Filter tabs */}
          <div
            style={{
              display: "flex",
              gap: 0,
              border: "1px solid var(--ink)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            {filters.map((f, i) => (
              <button
                key={f.key}
                onClick={() => setSortMode(f.key)}
                style={{
                  fontFamily: "var(--font-courier)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  padding: "8px 16px",
                  border: "none",
                  borderLeft: i > 0 ? "1px solid var(--ink)" : "none",
                  cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                  background:
                    sortMode === f.key ? "var(--ink)" : "var(--paper)",
                  color:
                    sortMode === f.key ? "var(--paper)" : "var(--ink)",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Your rank */}
      {currentUserEntry && currentUserRank && (
        <div
          className="editorial-box"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 32,
            background: "var(--paper-dark)",
            flexWrap: "wrap",
          }}
        >
          <span className="label-sm">YOUR RANK</span>
          <span
            className="font-headline"
            style={{ fontSize: 32, color: "var(--ink)" }}
          >
            #{currentUserRank}
          </span>
          <span
            style={{
              fontFamily: "var(--font-courier)",
              fontSize: 14,
              fontWeight: 700,
              marginLeft: "auto",
            }}
          >
            {currentUserEntry.points_balance.toLocaleString()} pts ·{" "}
            {currentUserEntry.avg_wpm} avg wpm ·{" "}
            {currentUserEntry.avg_accuracy}% acc
          </span>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="editorial-box" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 64, textAlign: "center" }}>
            <div
              className="label-sm"
              style={{ animation: "pulse 1.5s infinite ease-in-out" }}
            >
              LOADING REGISTRY...
            </div>
            <style>{`@keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
          </div>
        ) : (
          <div className="table-scroll-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "center",
                      width: 60,
                      borderRight: "1px solid var(--paper-darker)",
                    }}
                  >
                    #
                  </th>
                  <th style={{ borderRight: "1px solid var(--paper-darker)" }}>
                    TYPIST
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      borderRight: "1px solid var(--paper-darker)",
                      color: sortMode === "wpm" ? "var(--ink)" : "var(--ink-faint)",
                      fontWeight: sortMode === "wpm" ? 900 : 700,
                    }}
                  >
                    AVG WPM {sortMode === "wpm" && "▼"}
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      borderRight: "1px solid var(--paper-darker)",
                      color: sortMode === "accuracy" ? "var(--ink)" : "var(--ink-faint)",
                      fontWeight: sortMode === "accuracy" ? 900 : 700,
                    }}
                  >
                    ACCURACY {sortMode === "accuracy" && "▼"}
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      borderRight: "1px solid var(--paper-darker)",
                      color: sortMode === "points" ? "var(--ink)" : "var(--ink-faint)",
                      fontWeight: sortMode === "points" ? 900 : 700,
                    }}
                  >
                    POINTS {sortMode === "points" && "▼"}
                  </th>
                  <th style={{ textAlign: "right" }}>ADS DONE</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((entry, idx) => {
                  const isCurrentUser = entry.id === currentUserId;
                  const medal =
                    idx === 0 ? "I" : idx === 1 ? "II" : idx === 2 ? "III" : null;

                  return (
                    <tr
                      key={entry.id}
                      style={{
                        background: isCurrentUser
                          ? "var(--paper-dark)"
                          : "transparent",
                        transition: "background 0.15s",
                      }}
                    >
                      <td
                        style={{
                          textAlign: "center",
                          fontSize: 18,
                          borderRight: "1px solid var(--paper-darker)",
                          fontFamily: "var(--font-playfair)",
                          fontWeight: 700,
                        }}
                      >
                        {medal ?? idx + 1}
                      </td>
                      <td
                        style={{
                          borderRight: "1px solid var(--paper-darker)",
                          padding: "12px 16px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              border: "2px solid var(--ink)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 18,
                              fontFamily: "var(--font-playfair)",
                              background: "var(--paper)",
                              flexShrink: 0,
                            }}
                          >
                            {entry.avatar_url ? (
                              <img
                                src={entry.avatar_url}
                                alt={entry.display_name ?? entry.username}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              (entry.display_name ?? entry.username ?? "U")[0].toUpperCase()
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <Link
                              href={`/profile/${entry.username}`}
                              style={{
                                fontFamily: "var(--font-playfair)",
                                fontWeight: 700,
                                fontSize: 16,
                                color: "var(--ink)",
                                textDecoration: "none",
                              }}
                            >
                              {entry.display_name ?? entry.username}
                            </Link>
                            <div
                              style={{
                                fontFamily: "var(--font-courier)",
                                fontSize: 11,
                                color: "var(--ink-faint)",
                                marginTop: 4,
                              }}
                            >
                              @{entry.username}
                            </div>
                          </div>
                          {isCurrentUser && (
                            <span
                              className="badge badge-solid"
                              style={{ marginLeft: 16 }}
                            >
                              YOU
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontFamily: "var(--font-courier)",
                          fontWeight: sortMode === "wpm" ? 900 : 700,
                          borderRight: "1px solid var(--paper-darker)",
                          fontSize: sortMode === "wpm" ? 18 : 15,
                          color: sortMode === "wpm" ? "var(--ink)" : "var(--ink-light)",
                        }}
                      >
                        {entry.avg_wpm}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontFamily: "var(--font-courier)",
                          fontWeight: sortMode === "accuracy" ? 900 : 700,
                          borderRight: "1px solid var(--paper-darker)",
                          fontSize: sortMode === "accuracy" ? 18 : 15,
                          color: sortMode === "accuracy" ? "var(--ink)" : "var(--ink-light)",
                        }}
                      >
                        {entry.avg_accuracy}%
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontFamily: "var(--font-courier)",
                          fontWeight: sortMode === "points" ? 900 : 700,
                          borderRight: "1px solid var(--paper-darker)",
                          fontSize: sortMode === "points" ? 18 : 15,
                          color: sortMode === "points" ? "var(--ink)" : "var(--ink-light)",
                        }}
                      >
                        {entry.points_balance.toLocaleString()}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontFamily: "var(--font-courier)",
                          fontWeight: 700,
                        }}
                      >
                        {entry.total_completions}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && sorted.length === 0 && (
          <div style={{ padding: 64, textAlign: "center" }}>
            <p className="label-sm" style={{ fontSize: 16 }}>
              NO ENTRIES YET
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
