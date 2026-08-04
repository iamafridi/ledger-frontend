"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import { AccountBar } from "@/components/account-bar";
import { useAuth } from "@/components/auth-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { SessionProvider } from "@/components/session-provider";

/**
 * The signed-in shell with responsive collapsible sidebar.
 * Enforces authentication as a private path: all unauthenticated visitors
 * are redirected through the /login flow.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready, configError } = useAuth();
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // If auth state has resolved and there is no authenticated user, redirect to login
    if (ready && !user) {
      const redirectUrl = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : "/login";
      router.replace(redirectUrl);
    }
  }, [ready, user, router, pathname]);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo(0, 0);
    }
  }, [pathname]);

  if (configError) {
    return (
      <div className="shell">
        <main id="main" className="wrap" style={{ paddingBlock: "var(--s-8)" }}>
          <p className="alert alert--error" role="alert">
            Sign-in is not configured on this deployment yet.
          </p>
        </main>
      </div>
    );
  }

  if (!ready || !user) {
    return (
      <div className="shell" style={{ minHeight: "100vh", display: "grid", placeItems: "center", backgroundColor: "#FAF7F2" }}>
        <main id="main" className="wrap" style={{ paddingBlock: "var(--s-8)", textAlign: "center", maxWidth: "28rem" }}>
          <div className="panel stack" style={{ padding: "var(--s-6)", gap: "var(--s-4)", alignItems: "center" }}>
            <div
              className="pulse"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#F4EFE6",
                border: "2px solid #D8543D",
                display: "grid",
                placeItems: "center",
                fontSize: "1.1rem",
                color: "#D8543D",
                fontWeight: 800,
                fontFamily: "var(--font-serif), serif",
              }}
            >
              L
            </div>
            <div>
              <h2 style={{ fontSize: "var(--t-lg)", margin: "0 0 6px 0", color: "#141514" }}>
                Authenticating Session
              </h2>
              <p className="note" style={{ margin: 0, color: "#6E6A62" }}>
                Verifying permissions and routing to private workspace…
              </p>
            </div>
            <div className="skeleton" style={{ height: "4px", width: "100%", borderRadius: "2px" }} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <SessionProvider>
      <div className="app-layout-shell">
        {/* Left Collapsible App Sidebar */}
        <AppSidebar />

        {/* Right Content Area with fixed screen height and internal smooth scroll */}
        <div
          ref={viewportRef}
          className="app-main-viewport"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            height: "100vh",
            overflowY: "auto",
            overflowX: "hidden",
            width: "100%",
            backgroundColor: "var(--bg)",
          }}
        >
          <AccountBar />
          <AppBreadcrumbs />
          <main
            id="main"
            className="app-content-wrap"
            style={{
              flex: 1,
              paddingTop: "var(--s-4)",
              paddingBottom: "var(--s-8)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}

