"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Campaign } from "@/lib/supabase/types";

const TILE_COLORS = [
  { label: "CHARCOAL", value: "#222222" },
  { label: "NAVY", value: "#0a1628" },
  { label: "FOREST", value: "#0d1f0d" },
  { label: "BURGUNDY", value: "#1a0008" },
  { label: "SLATE", value: "#1c1c2e" },
  { label: "RUST", value: "#1f0a00" },
];

interface Props {
  campaign?: Campaign | null;
  onClose: () => void;
}

export default function CampaignForm({ campaign, onClose }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [form, setForm] = useState({
    brand_name: campaign?.brand_name ?? "",
    ad_text: campaign?.ad_text ?? "",
    tile_color: campaign?.tile_color ?? "#222222",
    is_active: campaign?.is_active ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const wordCount = form.ad_text.trim().split(/\s+/).length;
      const estimated_time_seconds = Math.round((wordCount / 60) * 60);

      const payload = {
        brand_name: form.brand_name,
        ad_text: form.ad_text,
        tile_color: form.tile_color,
        is_active: form.is_active,
        estimated_time_seconds,
        // Standardly set by the system
        points_reward: 100,
        completion_cap: 1000,
        image_url: null,
      };

      if (campaign?.id) {
        // Update
        const { error: updateError } = await supabase
          .from("campaigns")
          .update(payload as never)
          .eq("id", campaign.id);
        if (updateError) throw updateError;
      } else {
        // Insert
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { error: insertError } = await supabase
          .from("campaigns")
          .insert({
            ...payload,
            created_by: user?.id,
            completions_count: 0,
          } as never);
        if (insertError) throw insertError;
      }

      router.refresh();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100000,
        padding: "clamp(12px, 4vw, 24px)",
      }}
    >
      <div
        className="modal-box"
        style={{
          width: "100%",
          maxWidth: 700,
          background: "var(--paper)",
          border: "3px solid var(--ink)",
          boxShadow: "12px 12px 0px var(--ink)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px clamp(16px, 4vw, 32px)",
            borderBottom: "2px solid var(--ink)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--paper-dark)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-headline)",
              fontSize: "clamp(18px, 4vw, 24px)",
              fontWeight: 900,
              letterSpacing: "0.05em",
            }}
          >
            {campaign ? "EDIT CAMPAIGN" : "NEW CAMPAIGN"}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink)",
              cursor: "pointer",
              fontSize: 32,
              lineHeight: 1,
              padding: 0,
            }}
          >
            &times;
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            padding: "clamp(16px, 4vw, 32px)",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {error && (
            <div
              style={{
                background: "#ffecec",
                border: "2px solid red",
                padding: 12,
                color: "red",
                fontWeight: "bold",
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-courier)",
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 8,
                letterSpacing: "0.05em",
              }}
            >
              BRAND NAME
            </label>
            <input
              type="text"
              value={form.brand_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, brand_name: e.target.value }))
              }
              required
              style={{
                width: "100%",
                padding: "16px",
                fontSize: 18,
                fontFamily: "var(--font-body)",
                border: "2px solid var(--ink)",
                background: "var(--white)",
                outline: "none",
              }}
              placeholder="e.g. Acme Corp"
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-courier)",
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 8,
                letterSpacing: "0.05em",
              }}
            >
              AD COPY (TEXT)
            </label>
            <textarea
              value={form.ad_text}
              onChange={(e) =>
                setForm((p) => ({ ...p, ad_text: e.target.value }))
              }
              required
              rows={5}
              style={{
                width: "100%",
                padding: "16px",
                fontSize: 18,
                fontFamily: "var(--font-body)",
                border: "2px solid var(--ink)",
                background: "var(--white)",
                outline: "none",
                resize: "vertical",
              }}
              placeholder="Type the exact ad copy here..."
            />
            <div
              style={{
                fontFamily: "var(--font-courier)",
                fontSize: 12,
                color: "var(--ink-light)",
                marginTop: 8,
                textAlign: "right",
              }}
            >
              {form.ad_text.trim().split(/\s+/).filter(Boolean).length} WORDS
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-courier)",
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 8,
                letterSpacing: "0.05em",
              }}
            >
              BRAND COLOR (TILE)
            </label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {TILE_COLORS.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  title={c.label}
                  onClick={() =>
                    setForm((p) => ({ ...p, tile_color: c.value }))
                  }
                  style={{
                    width: 48,
                    height: 48,
                    background: c.value,
                    border:
                      form.tile_color === c.value
                        ? "4px solid var(--ink)"
                        : "2px solid transparent",
                    cursor: "pointer",
                    borderRadius: 4,
                    transition: "transform 0.1s",
                    transform:
                      form.tile_color === c.value ? "scale(1.1)" : "scale(1)",
                  }}
                />
              ))}
              <input
                type="color"
                value={form.tile_color}
                onChange={(e) =>
                  setForm((p) => ({ ...p, tile_color: e.target.value }))
                }
                style={{
                  width: 48,
                  height: 48,
                  border: "2px solid var(--ink)",
                  cursor: "pointer",
                  padding: 0,
                  borderRadius: 4,
                }}
              />
            </div>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              padding: "16px",
              background: "var(--paper-dark)",
              border: "2px solid var(--ink)",
              borderRadius: 4,
            }}
          >
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm((p) => ({ ...p, is_active: e.target.checked }))
              }
              style={{
                width: 24,
                height: 24,
                cursor: "pointer",
                accentColor: "var(--ink)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-courier)",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              PUBLISH CAMPAIGN IMMEDIATELY
            </span>
          </label>

          <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: "1 1 180px",
                padding: "16px",
                border: "2px solid var(--ink)",
                background: "transparent",
                fontFamily: "var(--font-courier)",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: "2 1 240px",
                padding: "16px",
                border: "2px solid var(--ink)",
                background: "var(--ink)",
                color: "var(--paper)",
                fontFamily: "var(--font-courier)",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? "SAVING..."
                : campaign
                  ? "SAVE CHANGES"
                  : "CREATE CAMPAIGN"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
