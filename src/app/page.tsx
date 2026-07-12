import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ContactForm from "@/components/ui/ContactForm";
import AdvertiserForm from "@/components/ui/AdvertiserForm";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  if (resolvedParams.home !== "true") {
    redirect("/typing");
  }

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
      {/* Early Access Marquee */}
      <div
        style={{
          background: "var(--ink)",
          color: "var(--paper)",
          padding: "10px 0",
          overflow: "hidden",
          borderBottom: "2px solid var(--ink)",
          fontFamily: "var(--font-courier)",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
        }}
      >
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} style={{ paddingRight: 80 }}>
              &nbsp; EARLY ACCESS &nbsp; — &nbsp; We are currently onboarding
              our first advertisers. In the meantime, enjoy normal practice
              typing like other platforms. Real ads and rewards are coming soon.
              &nbsp;&nbsp;&nbsp; &nbsp; EARLY ACCESS &nbsp; — &nbsp; We are
              currently onboarding our first advertisers. In the meantime, enjoy
              normal practice typing like other platforms. Real ads and rewards
              are coming soon. &nbsp;&nbsp;&nbsp; &nbsp; EARLY ACCESS &nbsp; —
              &nbsp; We are currently onboarding our first advertisers. In the
              meantime, enjoy normal practice typing like other platforms. Real
              ads and rewards are coming soon. &nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* 5.1 MASTHEAD */}
      <div
        style={{
          borderTop: "3px solid var(--ink)",
          borderBottom: "3px solid var(--ink)",
          padding: "4px 0",
          background: "var(--paper)",
        }}
      >
        <div
          style={{
            borderTop: "1px solid var(--paper-darker)",
            borderBottom: "1px solid var(--paper-darker)",
            padding: "16px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: 1400,
            margin: "0 auto",
          }}
        >
          {/* <div className="label-sm" style={{ flex: 1 }}>
            {new Date()
              .toLocaleDateString("en-IN", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })
              .toUpperCase()}{" "}
            · DAILY EDITION
          </div> */}
          <div
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: 56,
              fontWeight: 900,
              textTransform: "uppercase",
              textAlign: "center",
              flex: 1,
              color: "var(--ink)",
            }}
          >
            TYPEADS
          </div>
          {/* <div className="label-sm" style={{ flex: 1, textAlign: "right" }}>
            TYPEADS.FAIRGIGS.APP · EST. 2025
          </div> */}
        </div>
      </div>

      {/* 5.2 NAVIGATION BAR */}
      <nav
        style={{
          background: "var(--paper-dark)",
          borderBottom: "1px solid var(--paper-darker)",
          padding: "12px 32px",
          display: "flex",
          justifyContent: "center",
          gap: 40,
        }}
      >
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
                    ? "/?home=true#how-it-works"
                    : item === "FOR TYPISTS"
                      ? "/?home=true#for-typists"
                      : "/?home=true#for-advertisers"
            }
            className="label-sm"
            style={{ color: "var(--ink-light)", textDecoration: "none" }}
          >
            {item}
          </Link>
        ))}
      </nav>

      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* 5.3 FRONT PAGE — HERO SECTION */}
        <section
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
              style={{ fontSize: 48, marginBottom: 12 }}
            >
              GET REWARDED TO TYPE ADS.
            </h1>
            <h2
              className="font-subheadline"
              style={{ fontSize: 24, marginBottom: 32 }}
            >
              The internet's first typing platform where keystrokes earns you
              rewards.
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
              style={{ textAlign: "justify", fontSize: 18, lineHeight: 1.8 }}
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
                T
              </span>
              he digital attention economy is broken. You see thousands of ads
              daily, yet you earn nothing for your time. Brands spend billions,
              yet have no proof you ever read their copy. TypeAds solves both
              problems at once by transforming passive scrolling into an active,
              rewarded task.
              <br />
              <br />
              <span
                style={{
                  fontWeight: 700,
                  color: "#000000",
                  fontFamily: "var(--font-libre), serif",
                }}
              >
                So get rewarded while practicing your typing skills. <br />{" "}
                Currently we are trying to contact our first advertisers. Real
                ads and rewards are coming soon.
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div id="how-it-works">
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
                "Brand submits ad copy",
                "You type it word by word",
                "If you complete daily quota of ads you fallback to type normal words mode for which you won't be rewarded .",
                "you get rewarded for the ads you type along with your typing stats",
                "You are practicing your typing skills and getting rewarded for it",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 12 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-playfair)",
                      fontStyle: "italic",
                      fontSize: 18,
                      color: "var(--ink)",
                    }}
                  >
                    {i + 1}.
                  </span>
                  <span className="font-body" style={{ marginTop: 2 }}>
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
              style={{ fontSize: 32, marginBottom: 16, textAlign: "center" }}
            >
              Turn Your Keystrokes Into Cash
            </h2>
            <div
              className="font-body"
              style={{ textAlign: "justify", marginBottom: 32 }}
            >
              Finally, a typing test that rewards. Whether you're practicing
              your WPM or just looking for a productive way to kill time,
              TypeAds turns your spare minutes into real rewards. Each
              advertisement takes roughly 30 to 60 seconds to complete. Perfect
              accuracy and high speeds yield bonus multipliers.
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
              padding: "48px 32px",
              maxWidth: 1200,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 48,
              alignItems: "start",
            }}
          >
            <div>
              <h2
                className="font-headline"
                style={{ fontSize: 36, marginBottom: 16 }}
              >
                Guaranteed Attention.
              </h2>
              <div
                className="font-body"
                style={{
                  textAlign: "justify",
                  lineHeight: 1.8,
                  fontSize: 18,
                }}
              >
                Stop paying for impressions that no one looks at. In traditional
                digital advertising, a user scrolls past your banner in
                milliseconds. On TypeAds, the user is forced to read, process,
                and physically retype your entire ad copy word for word in order
                to earn their reward.
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                width: "100%",
              }}
            >
              <AdvertiserForm />
            </div>
          </div>
        </section>

        {/* 5.7 CONTACT / INQUIRY FORM */}
        <section
          id="contact"
          style={{
            background: "var(--paper)",
            borderBottom: "1px solid var(--paper-darker)",
            padding: "64px 32px",
          }}
        >
          <ContactForm />
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
              TYPEADS.FAIRGIGS.APP
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
            {[
              { label: "HOME", href: "/" },
              { label: "TERMS OF SERVICE", href: "/terms" },
              { label: "PRIVACY POLICY", href: "/privacy" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                style={{
                  color: "var(--paper)",
                  fontFamily: "var(--font-libre)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
          {/* <div
            style={{
              textAlign: "right",
              fontFamily: "var(--font-libre)",
              fontSize: 10,
              letterSpacing: "0.15em",
            }}
          >
            A FAIRGIGS PRODUCT
            <br />
            <span
              style={{ opacity: 0.5, marginTop: 4, display: "inline-block" }}
            >
              © 2026 TYPEADS
            </span>
          </div> */}
        </div>
      </footer>
    </main>
  );
}
