"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdvertiserForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const supabase = createClient() as any;
    const { error } = await supabase.from("advertiser_inquiries").insert({
      name,
      email,
      company,
      brief,
    });

    setLoading(false);

    if (error) {
      console.error("Advertiser form error:", error);
      setStatus({
        type: "error",
        text: `Failed to register inquiry: ${error.message}`,
      });
    } else {
      setStatus({
        type: "success",
        text: "CAMPAIGN INQUIRY REGISTERED. Our ad operations desk will contact you via email.",
      });
      setName("");
      setEmail("");
      setCompany("");
      setBrief("");
    }
  };

  return (
    <div
      className="editorial-box"
      style={{
        background: "var(--paper)",
        border: "2px solid var(--ink)",
        padding: "32px 24px",
        textAlign: "left",
        width: "100%",
        maxWidth: 550,
      }}
    >
      <div
        className="box-label"
        style={{
          background: "var(--ink)",
          color: "var(--paper)",
          padding: "6px 12px",
          display: "inline-block",
          fontSize: 10,
          fontWeight: 700,
          fontFamily: "var(--font-libre)",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          marginBottom: 20,
        }}
      >
        AD ADVERTISER BRIEF SUBMISSION
      </div>

      <h3 className="font-headline" style={{ fontSize: 24, marginBottom: 8 }}>
        Start a Campaign
      </h3>
      <p className="font-subheadline" style={{ fontSize: 13, color: "var(--ink-light)", marginBottom: 20 }}>
        Specify your brand details and target campaign parameters below to request inventory allocation.
      </p>

      {status && (
        <div
          style={{
            background: status.type === "success" ? "var(--stamp-navy)" : "var(--stamp-red)",
            color: "var(--white)",
            padding: 12,
            marginBottom: 20,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "var(--font-courier)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {status.type === "success" ? "SUCCESS: " : "ERROR: "} {status.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label className="form-label" htmlFor="adv-company">
            Company / Brand Name
          </label>
          <input
            id="adv-company"
            type="text"
            className="input-editorial"
            placeholder="Acme Corporation"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label className="form-label" htmlFor="adv-name">
              Contact Name
            </label>
            <input
              id="adv-name"
              type="text"
              className="input-editorial"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="form-label" htmlFor="adv-email">
              Business Email
            </label>
            <input
              id="adv-email"
              type="email"
              className="input-editorial"
              placeholder="jane@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>



        <div>
          <label className="form-label" htmlFor="adv-brief">
            Campaign Goal / Ad Text Proposal
          </label>
          <textarea
            id="adv-brief"
            className="input-editorial"
            placeholder="Describe your product and what text you would like typists to write..."
            style={{ minHeight: "100px", resize: "vertical", fontFamily: "var(--font-courier)", fontSize: "14px" }}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-inverted"
          style={{ width: "100%", padding: "12px 24px", marginTop: 4 }}
          disabled={loading}
        >
          {loading ? "TRANSMITTING PROPOSAL..." : "SUBMIT PROPOSAL"}
        </button>
      </form>
    </div>
  );
}
