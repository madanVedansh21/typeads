// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ResultsCharts from "@/components/results/ResultsCharts";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function ResultsPage({ params }: Props) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from("typing_sessions")
    .select(
      `
      *,
      campaigns (brand_name, ad_text, image_url, points_reward)
    `,
    )
    .eq("id", sessionId)
    .single();

  if (error || !session) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("points_balance, total_completions, total_wpm_sum")
    .eq("id", session.user_id)
    .single();

  const avgWpm = profile?.total_completions
    ? Math.round((profile.total_wpm_sum ?? 0) / profile.total_completions)
    : 0;

  const accuracySamples =
    (session.accuracy_samples as Array<{
      char_index: number;
      accuracy: number;
      wpm: number;
    }>) ?? [];
  const isFlagged = session.is_flagged;

  return (
    <div
      className="page-wrapper"
      style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(16px, 4vw, 40px) clamp(12px, 3vw, 24px)" }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "2px solid var(--ink)",
          paddingBottom: 16,
          marginBottom: 32,
        }}
      >
        <div className="label-sm">DISPATCH REPORT</div>
        <h1 className="font-headline" style={{ fontSize: "clamp(28px, 5vw, 48px)", marginTop: 12 }}>
          {isFlagged ? "SESSION FLAGGED" : "SESSION COMPLETE"}
        </h1>
        {isFlagged && (
          <div
            style={{
              background: "var(--stamp-red)",
              color: "var(--white)",
              padding: 12,
              marginTop: 16,
            }}
            className="label-sm"
          >
            THIS SESSION WAS FLAGGED FOR REVIEW: {session.flag_reason}. POINTS
            ARE HELD PENDING ADMIN REVIEW.
          </div>
        )}
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
          flexWrap: "wrap",
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
            flexWrap: "wrap",
          }}
        >
          <div>{session.test_mode || "jumbled"}</div>
          <div>|</div>
          <div
            style={{
              color: session.use_punctuation
                ? "var(--ink)"
                : "var(--ink-faint)",
              opacity: session.use_punctuation ? 1 : 0.45,
            }}
          >
            punctuation
          </div>
          <div>|</div>
          <div style={{ display: "flex", gap: 6 }}>
            <span
              style={{
                color: !session.use_lowercase
                  ? "var(--ink)"
                  : "var(--ink-faint)",
                opacity: !session.use_lowercase ? 1 : 0.4,
                fontWeight: !session.use_lowercase ? 900 : 700,
              }}
            >
              A
            </span>
            <span style={{ opacity: 0.3 }}>/</span>
            <span
              style={{
                color: session.use_lowercase
                  ? "var(--ink)"
                  : "var(--ink-faint)",
                opacity: session.use_lowercase ? 1 : 0.4,
                fontWeight: session.use_lowercase ? 900 : 700,
              }}
            >
              a
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Layout for Ledger and Charts */}
      <div
        className="resp-results-grid"
        style={{
          gap: 32,
          marginBottom: 32,
        }}
      >
        {/* Left Side: Stats ledger */}
        <div
          className="editorial-box"
          style={{
            padding: 0,
            height: "fit-content",
            display: "flex",
            flexDirection: "column",
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
                value: session.wpm,
                sub: `AVG: ${avgWpm}`,
                highlight: true,
              },
              {
                label: "ACCURACY",
                value: `${session.accuracy}%`,
                sub: "",
                highlight: true,
              },
              {
                label: "POINTS EARNED",
                value: isFlagged ? "0*" : `+${session.points_earned}`,
                sub: isFlagged ? "PENDING REVIEW" : "ADDED TO WALLET",
              },
              {
                label: "TOTAL BALANCE",
                value: (profile?.points_balance ?? 0).toLocaleString(),
                sub: "CURRENT",
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

        {/* Right Side: Charts */}
        {accuracySamples.length > 1 ? (
          <div className="editorial-box">
            <div className="box-label">TELEMETRY</div>
            <ResultsCharts samples={accuracySamples} />
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 16,
          marginTop: 40,
        }}
      >
        <Link
          href="/typing"
          className="btn btn-inverted resp-action-btn"
          style={{
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          NEXT DISPATCH →
        </Link>
        <Link
          href="/leaderboard"
          className="btn resp-action-btn"
          style={{ textAlign: "center", textDecoration: "none" }}
        >
          VIEW LEADERBOARD
        </Link>
      </div>
    </div>
  );
}
