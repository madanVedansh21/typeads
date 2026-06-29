import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--paper)",
        color: "var(--ink)",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          borderTop: "3px solid var(--ink)",
          borderBottom: "1px solid var(--paper-darker)",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--paper)",
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Image
            src="/sloth.png"
            alt="Sloth Mascot"
            width={52}
            height={52}
            priority
            style={{ objectFit: "contain" }}
          />
          <div
            style={{
              fontFamily: "var(--font-canopee)",
              fontSize: 48,
              fontWeight: 400,
              textTransform: "uppercase",
              color: "var(--ink)",
              transform: "translateY(4px)", // Optical alignment
            }}
          >
            TYPEADS
          </div>
        </div>

        <nav style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {[
            "HOW IT WORKS",
            "FOR TYPISTS",
            "FOR ADVERTISERS",
            user ? "START TYPING" : "SIGN UP",
          ].map((item) => (
            <Link
              key={item}
              href={
                item === "SIGN UP"
                  ? "/signup"
                  : item === "START TYPING"
                    ? "/typing"
                    : item === "HOW IT WORKS"
                      ? "#how-it-works"
                      : item === "FOR TYPISTS"
                        ? "#for-typists"
                        : "#for-advertisers"
              }
              className="nav-item"
              style={{ color: "var(--ink)", textDecoration: "none" }}
            >
              {item}
            </Link>
          ))}
        </nav>
      </header>

      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* 5.3 FRONT PAGE — HERO SECTION */}
        <section
          id="how-it-works"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 48,
            padding: "48px 32px",
            borderBottom: "1px solid var(--paper-darker)",
          }}
        >
          {/* LEFT COLUMN */}
          <div
            style={{
              borderRight: "1px solid var(--paper-darker)",
              paddingRight: 48,
            }}
          >
            <h1
              className="font-headline"
              style={{ fontSize: 72, marginBottom: 12 }}
            >
              YOU TYPE ANYWAY. WHY NOT GET REWARDED ON THE SIDE.
            </h1>
            <h2
              className="font-subheadline"
              style={{ fontSize: 32, marginBottom: 32 }}
            >
              You already spend time typing randomly to test your speed. You are
              pretty fast. Why not get a little reward for it.
            </h2>
            <hr
              style={{
                border: "none",
                borderTop: "1px solid var(--paper-darker)",
                marginBottom: 32,
              }}
            />
            <div
              className="font-body"
              style={{ textAlign: "justify", fontSize: 22, lineHeight: 1.8 }}
            >
              <span
                style={{
                  float: "left",
                  fontSize: "3.5em",
                  lineHeight: "0.8",
                  paddingRight: "8px",
                  paddingBottom: "4px",
                  fontFamily: "var(--font-playfair)",
                }}
              >
                P
              </span>
              eople practice typing every day. Mostly just to click clack on
              their keyboards or procrastinate on doing real work. We figured
              what if that exact same habit gave you a little bonus?
              <br />
              <br />
              On TypeAds, every word you type adds points to your balance.
              Points turn into gift cards. This isn't a gig. It is just your
              normal typing habit, but now you get rewarded for it.
            </div>
            <div className="label-sm" style={{ marginTop: 32 }}>
              — The TypeAds Team
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            <div
              style={{
                borderBottom: "2px solid var(--ink)",
                paddingBottom: 8,
                marginBottom: 16,
              }}
            >
              <span className="label-sm" style={{ color: "var(--ink)" }}>
                HOW IT WORKS
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                marginBottom: 32,
              }}
            >
              {[
                "Pick a piece of text from the queue",
                "Type it out, word by word",
                "An image slowly reveals as you go",
                "Points drop into your balance",
                "Get enough points, get rewarded",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 12 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-playfair)",
                      fontStyle: "italic",
                      fontSize: 24,
                      color: "var(--ink)",
                    }}
                  >
                    {i + 1}.
                  </span>
                  <span
                    className="font-body"
                    style={{ marginTop: 2, fontSize: 22 }}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5.5 FOR TYPISTS */}
        <section
          id="for-typists"
          style={{
            background: "var(--paper)",
            borderBottom: "1px solid var(--paper-darker)",
          }}
        >
          <div className="section-header">FOR TYPISTS</div>
          <div style={{ padding: 64, maxWidth: 800, margin: "0 auto" }}>
            <h2
              className="font-headline"
              style={{ fontSize: 42, marginBottom: 16, textAlign: "center" }}
            >
              SAME HABIT. SMALL REWARD.
            </h2>
            <div
              className="font-body"
              style={{
                textAlign: "justify",
                marginBottom: 32,
                fontSize: 22,
                lineHeight: 1.8,
              }}
            >
              You were going to open a typing site today anyway. You were going
              to sit there and type random quotes. TypeAds just makes that
              session give you a little back. Each text takes under a minute.
              Each one adds to your balance. No pressure, no daily targets. Just
              type when you feel like it. Get rewarded when you do.
            </div>
            <div style={{ textAlign: "center" }}>
              <Link
                href={user ? "/typing" : "/signup"}
                className="btn btn-inverted"
              >
                START TYPING
              </Link>
            </div>
          </div>
        </section>

        {/* 5.6 FOR ADVERTISERS */}
        <section
          id="for-advertisers"
          style={{
            background: "var(--paper-dark)",
            borderBottom: "1px solid var(--paper-darker)",
          }}
        >
          <div
            className="section-header"
            style={{ borderBottomColor: "var(--ink-light)" }}
          >
            FOR ADVERTISERS
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              padding: 32,
              gap: 48,
            }}
          >
            <div>
              <div
                className="editorial-box"
                style={{ background: "var(--paper)" }}
              >
                <div className="box-label">
                  PRINT ORDER FORM — CAMPAIGN #884
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-courier)",
                    fontSize: 13,
                    color: "var(--ink)",
                  }}
                >
                  <p
                    style={{
                      borderBottom: "1px solid var(--paper-darker)",
                      paddingBottom: 8,
                      marginBottom: 8,
                    }}
                  >
                    CLIENT: SOMEBODY WITH MONEY
                  </p>
                  <p
                    style={{
                      borderBottom: "1px solid var(--paper-darker)",
                      paddingBottom: 8,
                      marginBottom: 8,
                    }}
                  >
                    REACH: 10,000 VERIFIED READS
                  </p>
                  <p style={{ marginTop: 16 }}>
                    STATUS: [X] APPROVED FOR PRINT
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h2
                className="font-headline"
                style={{ fontSize: 42, marginBottom: 16 }}
              >
                PEOPLE WHO TYPE YOUR AD HAVE READ YOUR AD.
              </h2>
              <div
                className="font-body"
                style={{ textAlign: "justify", fontSize: 22, lineHeight: 1.8 }}
              >
                No skipping. No scrolling past in half a second. The person has
                typed every single word you wrote because they want their
                reward. That is the most genuine read your copy will ever get.
              </div>
            </div>
          </div>
        </section>

        {/* 5.7 TESTIMONIAL / PULL QUOTE */}
        <section
          style={{
            background: "var(--paper)",
            borderBottom: "1px solid var(--paper-darker)",
            padding: "64px 32px",
            textAlign: "center",
            position: "relative",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 40,
              top: 40,
              fontFamily: "var(--font-playfair)",
              fontSize: 120,
              color: "var(--paper-darker)",
              lineHeight: 0.5,
            }}
          >
            "
          </span>
          <div
            style={{
              fontFamily: "var(--font-playfair)",
              fontStyle: "italic",
              fontSize: 36,
              color: "var(--ink)",
              maxWidth: 800,
              margin: "0 auto",
              lineHeight: 1.4,
            }}
          >
            I used to type out random paragraphs in name of tests just to avoid
            doing my actual job. Now I type out marketing copy for digital
            points to avoid doing my actual job. It's called personal growth.
          </div>
          <div
            className="label-sm"
            style={{ marginTop: 24, color: "var(--ink)" }}
          ></div>
          <span
            style={{
              position: "absolute",
              right: 40,
              bottom: 0,
              fontFamily: "var(--font-playfair)",
              fontSize: 120,
              color: "var(--paper-darker)",
              lineHeight: 0.5,
            }}
          >
            "
          </span>
        </section>
      </div>

      {/* 5.8 FOOTER */}
      <footer
        style={{
          background: "var(--ink)",
          color: "var(--paper)",
          borderTop: "3px solid var(--paper-darker)",
          padding: "32px",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: 24,
                fontWeight: 900,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              TYPEADS
            </div>
            <div
              style={{
                fontFamily: "var(--font-libre)",
                fontSize: 10,
                letterSpacing: "0.1em",
              }}
            >
              A TYPING PLATFORM THAT GIVES BACK
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
            {["HOME", "TERMS", "PRIVACY"].map((link) => (
              <a
                key={link}
                href="#"
                style={{
                  color: "var(--paper)",
                  fontFamily: "var(--font-libre)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  textDecoration: "none",
                }}
              >
                {link}
              </a>
            ))}
          </div>
          <div
            style={{
              textAlign: "right",
              fontFamily: "var(--font-libre)",
              fontSize: 10,
              letterSpacing: "0.15em",
            }}
          >
            A COMPLETELY NORMAL TYPING SITE
            <br />
            <span
              style={{ opacity: 0.5, marginTop: 4, display: "inline-block" }}
            >
              © 2026 TYPEADS
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
