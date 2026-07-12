"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [brand, setBrand] = useState("");
  const [purpose, setPurpose] = useState("general");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const supabase = createClient() as any;
    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      brand: brand || null,
      purpose,
      message,
    });

    setLoading(false);

    if (error) {
      console.error("Contact form error:", error);
      setStatus({
        type: "error",
        text: `Error transmitting message: ${error.message}`,
      });
    } else {
      setStatus({
        type: "success",
        text: "DISPATCH TRANSMITTED. Our administration team has received your message.",
      });
      // Clear inputs
      setName("");
      setEmail("");
      setBrand("");
      setPurpose("general");
      setMessage("");
    }
  };

  return (
    <div className="editorial-box" style={{ maxWidth: 600, margin: "0 auto", textAlign: "left" }}>
      <div className="box-label" style={{ textAlign: "center" }}>
        CONTACT & INQUIRY REGISTRY
      </div>

      <div style={{ padding: "32px 24px" }}>
        <h3 className="font-headline" style={{ fontSize: 28, marginBottom: 8, textAlign: "center" }}>
          Transmit a Dispatch
        </h3>
        <p className="font-subheadline" style={{ fontSize: 14, color: "var(--ink-light)", textAlign: "center", marginBottom: 24 }}>
          Send your campaign proposals, support inquiries, or feedback directly to the administration.
        </p>

        {status && (
          <div
            style={{
              background: status.type === "success" ? "var(--stamp-navy)" : "var(--stamp-red)",
              color: "var(--white)",
              padding: 12,
              marginBottom: 24,
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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="resp-2col-grid" style={{ gap: 16 }}>
            <div>
              <label className="form-label" htmlFor="contact-name">
                Your Alias / Name
              </label>
              <input
                id="contact-name"
                type="text"
                className="input-editorial"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="contact-email">
                Email Address
              </label>
              <input
                id="contact-email"
                type="email"
                className="input-editorial"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="resp-2col-grid" style={{ gap: 16 }}>
            <div>
              <label className="form-label" htmlFor="contact-brand">
                Brand / Company (Optional)
              </label>
              <input
                id="contact-brand"
                type="text"
                className="input-editorial"
                placeholder="Brand Name"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="contact-purpose">
                Inquiry Classification
              </label>
              <select
                id="contact-purpose"
                className="input-editorial"
                style={{ height: "46px", padding: "8px 16px" }}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              >
                <option value="general">General Support / Inquiry</option>
                <option value="feedback">Platform Feedback</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="contact-message">
              Message Content
            </label>
            <textarea
              id="contact-message"
              className="input-editorial"
              placeholder="State your business clearly here..."
              style={{ minHeight: "120px", resize: "vertical", fontFamily: "var(--font-courier)", fontSize: "14px" }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-inverted"
            style={{ width: "100%", padding: "14px 24px", marginTop: 8 }}
            disabled={loading}
          >
            {loading ? "TRANSMITTING DISPATCH..." : "TRANSMIT DISPATCH"}
          </button>
        </form>
      </div>
    </div>
  );
}
