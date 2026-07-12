import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Terms of Service — TypeAds",
  description: "Terms of Service and platform rules for using TypeAds.",
};

export default function TermsPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--paper)",
        color: "var(--ink)",
        paddingBottom: "96px",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          borderTop: "3px solid var(--ink)",
          borderBottom: "1px solid var(--paper-darker)",
          padding: "16px 32px",
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--paper)",
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 16, textDecoration: "none" }}>
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
              fontSize: "clamp(24px, 5vw, 48px)",
              fontWeight: 400,
              textTransform: "uppercase",
              color: "var(--ink)",
              transform: "translateY(4px)",
            }}
          >
            TYPEADS
          </div>
        </Link>
        <Link href="/" className="nav-item" style={{ color: "var(--ink)", textDecoration: "none" }}>
          BACK TO HOME
        </Link>
      </header>

      {/* CONTENT */}
      <article
        style={{
          maxWidth: 800,
          margin: "48px auto",
          padding: "0 clamp(16px, 4vw, 32px)",
        }}
      >
        {/* PAGE HEADER */}
        <div style={{ borderBottom: "3px solid var(--ink)", paddingBottom: "24px", marginBottom: "40px" }}>
          <span className="label-sm" style={{ display: "block", marginBottom: 8 }}>LEGAL CONTRACT & RULES</span>
          <h1 className="font-headline" style={{ fontSize: "clamp(32px, 6vw, 64px)", textTransform: "uppercase", margin: 0 }}>
            Terms of Service
          </h1>
          <p className="font-body" style={{ fontStyle: "italic", marginTop: 12, opacity: 0.8 }}>
            Last updated: July 11, 2026
          </p>
        </div>

        {/* POLICY CONTENT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          <section>
            <h2 className="font-subheadline" style={{ fontSize: 24, marginBottom: 12, fontWeight: "bold" }}>
              1. Acceptance of Terms
            </h2>
            <p className="font-body">
              By registering an account and using the TypeAds platform ("Service", "we", "us", "our"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-subheadline" style={{ fontSize: 24, marginBottom: 12, fontWeight: "bold" }}>
              2. Eligibility & Account Creation
            </h2>
            <p className="font-body">
              The Service is designed primarily for typing enthusiasts and college students. You must be at least 13 years of age (or the minimum legal age in your jurisdiction) to create an account. You agree to provide accurate email and authentication information during sign-up.
            </p>
            <p className="font-body" style={{ marginTop: 12 }}>
              <strong>Single Account Restriction:</strong> You are strictly permitted to hold and operate exactly <strong>one (1) account</strong>. Creating multiple accounts, sharing accounts, or using shared credentials to access the Service is a material violation of these terms and will result in the immediate termination of all associated accounts and forfeiture of all points.
            </p>
          </section>

          <section>
            <h2 className="font-subheadline" style={{ fontSize: 24, marginBottom: 12, fontWeight: "bold" }}>
              3. The Rewards & Points Program
            </h2>
            <p className="font-body">
              TypeAds allows users to earn promotional points ("Points") by completing typing challenges based on ad copy.
            </p>
            <ul className="font-body" style={{ paddingLeft: 24, marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>
                <strong>No Cash Value:</strong> Points are promotional tokens. They do not constitute currency, have no inherent cash value outside the platform, and cannot be purchased or transferred.
              </li>
              <li>
                <strong>Redemption Eligibility:</strong> To be eligible for redemption, your account must meet the minimum points balance threshold required for the selected reward. The administration reserves the right to establish and adjust additional validation criteria, such as a minimum account age or ad completion requirements, before processing redemptions.
              </li>
              <li>
                <strong>Daily Completion Cap:</strong> The maximum number of rewarded typing sessions you can complete per calendar day is determined by the administration and is subject to change at our discretion. Sessions completed beyond this limit will not award points.
              </li>
              <li>
                <strong>Manual Verification & Fulfillment:</strong> All redemption requests are processed and verified manually by our administration team. Fulfillment is not instantaneous and can take up to <strong>7 business days</strong>. We reserve the right to deny redemptions if fraud, bot usage, or manipulation is suspected.
              </li>
            </ul>
          </section>

          <section style={{ border: "2px solid var(--ink)", padding: 24, background: "var(--paper-dark)" }}>
            <h2 className="font-subheadline" style={{ fontSize: 24, marginBottom: 12, color: "var(--stamp-red)", fontWeight: "bold" }}>
              4. Anti-Fraud & Anti-Bot Policy
            </h2>
            <p className="font-body">
              To maintain the integrity of our platform and ensure ads are read by real humans, we implement strict automated anti-fraud measures.
            </p>
            <ul className="font-body" style={{ paddingLeft: 24, marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>
                <strong>Automation Prohibited:</strong> The use of bots, macros, scripts, keystroke simulators, or any other automated software to complete typing sessions is strictly prohibited.
              </li>
              <li>
                <strong>Keystroke Dynamics Monitoring:</strong> We log and analyze keystroke variance and input behavior (such as inter-keystroke timings) to distinguish humans from automated inputs. Uniform typing speeds and mechanical patterns will result in immediate system flags.
              </li>
              <li>
                <strong>WPM Threshold:</strong> Any typing session that registers an average speed exceeding <strong>200 Words Per Minute (WPM)</strong> will be automatically flagged for admin review. Points will be withheld pending verification of human inputs.
              </li>
              <li>
                <strong>Blocking of Paste Events:</strong> The typing interface programmatically blocks the copy-pasting of text. Bypassing or attempting to bypass this restriction is a violation of these Terms.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-subheadline" style={{ fontSize: 24, marginBottom: 12, fontWeight: "bold" }}>
              5. Advertiser Content Disclaimer
            </h2>
            <p className="font-body">
              TypeAds displays ad copy and creative images submitted by third-party advertisers. TypeAds does not verify, endorse, or make any representations regarding the truthfulness, accuracy, legality, or safety of the products, services, or claims advertised on the platform. Your interactions with advertisers are solely between you and the advertiser.
            </p>
          </section>

          <section>
            <h2 className="font-subheadline" style={{ fontSize: 24, marginBottom: 12, fontWeight: "bold" }}>
              6. Program Modification & Termination
            </h2>
            <p className="font-body">
              We reserve the right, at our sole discretion, to modify, suspend, or terminate the rewards program, adjust the points-to-rewards ratios, change the minimum redemption thresholds, or alter the catalog of available gift cards at any time, with or without notice.
            </p>
          </section>

          <section>
            <h2 className="font-subheadline" style={{ fontSize: 24, marginBottom: 12, fontWeight: "bold" }}>
              7. Disclaimers & Limitation of Liability
            </h2>
            <p className="font-body">
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, TYPEADS AND ITS OPERATORS DISCLAIM ALL LIABILITY FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOSS OF REWARDS, ACCOUNT TERMINATION, OR DATA LOSS, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section style={{ borderTop: "1px solid var(--paper-darker)", paddingTop: 24, textAlign: "center" }}>
            <p className="font-body" style={{ fontSize: 14 }}>
              Questions about these Terms? Contact us via the{" "}
              <Link href="/?home=true#contact" style={{ color: "var(--ink)", fontWeight: 700, textDecoration: "underline" }}>
                interest form on our main page
              </Link>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
