import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/ui/Topbar";
import MainLayoutClient from "./MainLayoutClient";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user
    ? (await supabase.from("profiles").select("*").eq("id", user.id).single())
        .data
    : null;

  return (
    <MainLayoutClient>
      <Topbar profile={profile} />
      <div className="page-wrapper">{children}</div>
      {/* Early Access Marquee — fixed at bottom */}
      <div
        style={{
          background: "var(--ink)",
          color: "var(--paper)",
          padding: "9px 0",
          fontFamily: "var(--font-courier)",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.08em",
          overflow: "hidden",
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          whiteSpace: "nowrap",
          borderTop: "1px solid rgba(255,255,255,0.1)",
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
    </MainLayoutClient>
  );
}
