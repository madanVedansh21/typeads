import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Privacy Policy — TypeAds",
  description: "Privacy Policy detailing data collection, storage, and anti-fraud measures on TypeAds.",
};

export default function PrivacyPage() {
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
              fontSize: 48,
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
          padding: "0 32px",
        }}
      >
        {/* PAGE HEADER */}
        <div style={{ borderBottom: "3px solid var(--ink)", paddingBottom: "24px", marginBottom: "40px" }}>
          <span className="label-sm" style={{ display: "block", marginBottom: 8 }}>DATA PROTECTION & PRIVACY</span>
          <h1 className="font-headline" style={{ fontSize: 64, textTransform: "uppercase", margin: 0 }}>
            Privacy Policy
          </h1>
          <p className="font-body" style={{ fontStyle: "italic", marginTop: 12, opacity: 0.8 }}>
            Last updated: July 11, 2026
          </p>
        </div>

        {/* POLICY CONTENT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          <section>
            <h2 className="font-subheadline" style={{ fontSize: 24, marginBottom: 12, fontWeight: "bold" }}>
              1. Introduction
            </h2>
            <p className="font-body">
              TypeAds ("we", "us", "our") operates the touch-typing reward platform at typeads.fairgigs.app. This Privacy Policy details how we collect, store, use, and share your personal information. We take your privacy seriously and aim to be transparent about what data is collected, particularly regarding the security measures we use to prevent bot abuse.
            </p>
          </section>

          <section>
            <h2 className="font-subheadline" style={{ fontSize: 24, marginBottom: 12, fontWeight: "bold" }}>
              2. Information We Collect
            </h2>
            <p className="font-body">
              To provide the typing engine, verify typing completions, and fulfill gift card rewards, we collect the following categories of data:
            </p>
            <ul className="font-body" style={{ paddingLeft: 24, marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>
                <strong>Account Credentials:</strong> If you sign up via email and password, we store your email address and a securely hashed password. If you authenticate via Google OAuth, we receive and store your email address, name, and profile picture.
              </li>
              <li>
                <strong>Typing Session Data:</strong> We record your speed in Words Per Minute (WPM), typing accuracy percentage, session duration, and completed campaigns to calculate your points rewards and update your stats.
              </li>
              <li>
                <strong>Anti-Fraud & Anti-Bot Telemetry:</strong> To identify automated scripts, we record keystroke dynamics (specifically, the milliseconds elapsed between individual keypress events). We also log your IP address, browser user-agent, operating system, and unique device fingerprint variables.
              </li>
              <li>
                <strong>Wallet & Redemption Records:</strong> We log all reward transactions, your current points balance, and historical gift card redemption details (including the code of the gift card delivered to you).
              </li>
              <li>
                <strong>Advertiser Inquiries:</strong> If you contact us via our advertiser form, we collect your name, brand/organization, ad campaign brief, and budget.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-subheadline" style={{ fontSize: 24, marginBottom: 12, fontWeight: "bold" }}>
              3. How We Use Your Information
            </h2>
            <p className="font-body">
              We process your data for the following legitimate business purposes:
            </p>
            <ul className="font-body" style={{ paddingLeft: 24, marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>To initialize your typing sessions, calculate accuracy and WPM, and track point accumulation.</li>
              <li>To allow administrators to manually audit, approve, and fulfill gift card redemptions.</li>
              <li>To analyze keystroke timings and verify that ad copy completions are performed by real humans rather than bots or macros.</li>
              <li>To send critical system emails, such as account confirmation, password reset links, and gift card redemption notifications.</li>
            </ul>
          </section>

          <section style={{ border: "2px solid var(--ink)", padding: 24, background: "var(--paper-dark)" }}>
            <h2 className="font-subheadline" style={{ fontSize: 24, marginBottom: 12, color: "var(--stamp-navy)", fontWeight: "bold" }}>
              4. Data Sharing & Third-Party Disclosure
            </h2>
            <p className="font-body">
              We hold a strict policy regarding the sharing and selling of user information.
            </p>
            <p className="font-body" style={{ marginTop: 12 }}>
              <strong>No Sale of Personal Information:</strong> We do not sell, rent, trade, or share your email address or personal identity details with third-party advertisers or brands.
            </p>
            <p className="font-body" style={{ marginTop: 12 }}>
              <strong>Advertiser Reporting:</strong> Advertisers pay us for human eyes on their ad copy. We share campaign-level analytics with them (e.g., "Your ad campaign received 500 completions, with an average typing speed of 85 WPM and 97% accuracy"). This reporting is entirely aggregated and contains **no** usernames, emails, or personal identifiers.
            </p>
            <p className="font-body" style={{ marginTop: 12 }}>
              <strong>Service Providers:</strong> We share data with third-party providers who host and support our infrastructure (such as Supabase for database storage, authentication, and hosting, and email transaction services like Resend or Nodemailer). These providers are contractually obligated to protect your data.
            </p>
          </section>

          <section>
            <h2 className="font-subheadline" style={{ fontSize: 24, marginBottom: 12, fontWeight: "bold" }}>
              5. Data Security & Retention
            </h2>
            <p className="font-body">
              We use Supabase as our backend and authentication system, which implements standard security measures to protect your credentials. We retain your account, typing history, and transaction data for as long as your account remains active. If you wish to delete your account, you can contact us to request the erasure of your personal data.
            </p>
          </section>

          <section>
            <h2 className="font-subheadline" style={{ fontSize: 24, marginBottom: 12, fontWeight: "bold" }}>
              6. Your Data, Your Choice
            </h2>
            <p className="font-body">
              Here is exactly what you can do regarding your data on TypeAds:
            </p>
            <ul className="font-body" style={{ paddingLeft: 24, marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>
                <strong>Request Your Data:</strong> You can ask us what personal data we have stored about you. We will respond via email with a summary.
              </li>
              <li>
                <strong>Request Deletion:</strong> You can ask us to permanently delete your account and all associated data (typing history, points, redemption records). Once deleted, this action cannot be undone.
              </li>
              <li>
                <strong>Correct Your Information:</strong> If any of your account details (email, username, display name) are incorrect, you can update them from your profile or contact us.
              </li>
            </ul>
            <p className="font-body" style={{ marginTop: 16 }}>
              To make any of these requests, use the{" "}
              <Link href="/?home=true#contact" style={{ color: "var(--ink)", fontWeight: 700, textDecoration: "underline" }}>
                contact form on our main page
              </Link>
              . We will process your request and respond to your email.
            </p>
          </section>

          <section style={{ borderTop: "1px solid var(--paper-darker)", paddingTop: 24, textAlign: "center" }}>
            <p className="font-body" style={{ fontSize: 14 }}>
              Questions about our privacy practices? Contact us via the{" "}
              <Link href="/?home=true#contact" style={{ color: "var(--ink)", fontWeight: 700, textDecoration: "underline" }}>
                contact form on our main page
              </Link>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
