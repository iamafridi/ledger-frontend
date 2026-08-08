"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle2, Lock, Mail } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { toast } from "@/components/toast-provider";
import { Alert } from "@/components/ui/alert";
import { DEMO_CASE, DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";

function readableAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email and password do not match an account.";
    case "auth/email-already-in-use":
      return "An account already exists for that email. Sign in instead.";
    case "auth/weak-password":
      return "Use a password of at least six characters.";
    case "auth/invalid-email":
      return "That does not look like an valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a moment and try again.";
    case "auth/network-request-failed":
      return "Could not reach the sign-in service. Check your connection.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "The Google sign-in window was closed before it finished.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window. Allow pop-ups for this site.";
    case "auth/account-exists-with-different-credential":
      return "An account with that email already exists. Sign in with your password instead.";
    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled for this project yet.";
    case "auth/unauthorized-domain":
      return "This domain is not on the Firebase authorised list for sign-in.";
    default:
      return "Authentication failed. Please check your credentials and try again.";
  }
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" || searchParams.get("mode") === "signup" ? "register" : "signin";

  const { user, ready, configError, signIn, register, signInWithGoogle, signOut } = useAuth();

  const [mode, setMode] = useState<"signin" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filled, setFilled] = useState(false);

  // Private login flow: visitors must explicitly sign in or confirm active session
  const destination = searchParams.get("redirect") || "/dashboard";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        toast.success("Welcome back", "Authenticated into your ledger session.");
      } else {
        await register(email, password);
        toast.success("Account created", "Your new financial workspace is ready.");
      }
      router.replace(destination);
    } catch (caught) {
      setError(readableAuthError(caught));
    } finally {
      setBusy(false);
    }
  }

  const fillDemo = async () => {
    setError(null);
    setBusy(true);
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setFilled(true);
    await new Promise((resolve) => setTimeout(resolve, 350));

    try {
      await signIn(DEMO_EMAIL, DEMO_PASSWORD);
      toast.success("Reviewer Access Granted", `Loaded published benchmark case ${DEMO_CASE}`);
      router.replace(destination);
    } catch (caught: unknown) {
      const code = (caught as { code?: string })?.code ?? "";
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        try {
          await register(DEMO_EMAIL, DEMO_PASSWORD);
          toast.success("Demo Workspace Ready", `Benchmarked case ${DEMO_CASE} loaded`);
          router.replace(destination);
          return;
        } catch (regErr) {
          setError(readableAuthError(regErr));
          setFilled(false);
        }
      } else {
        setError(readableAuthError(caught));
        setFilled(false);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="shell" style={{ minHeight: "100vh", backgroundColor: "#FAF7F2" }}>
      {/* Minimal Editorial Header */}
      <header
        style={{
          borderBottom: "1px solid var(--line)",
          backgroundColor: "#FAF7F2",
          padding: "var(--s-3) var(--s-5)",
        }}
      >
        <div
          className="wrap"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: "76rem",
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-serif), serif",
              fontSize: "1.35rem",
              fontWeight: 800,
              textDecoration: "none",
              color: "#141514",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: "#D8543D",
                borderRadius: "50%",
                display: "inline-block",
              }}
            />
            Ledger
          </Link>

          <Link
            href="/"
            className="link-underlined"
            style={{ fontSize: "0.85rem", textDecoration: "none" }}
          >
            Back to Public Portal
          </Link>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main
        id="main"
        className="wrap"
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          padding: "var(--s-5) var(--s-4)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: "100%",
            maxWidth: "28rem",
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--line-firm)",
            borderRadius: "14px",
            padding: "2rem",
            boxShadow:
              "0 16px 36px -8px rgba(20, 21, 20, 0.08), 0 4px 12px -2px rgba(20, 21, 20, 0.04)",
          }}
        >
          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: "flex",
              backgroundColor: "#F4EFE6",
              padding: "4px",
              borderRadius: "8px",
              marginBottom: "1.75rem",
              border: "1px solid #E5E0D5",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: mode === "signin" ? "#141514" : "#5A5955",
                backgroundColor: mode === "signin" ? "#FFFFFF" : "transparent",
                boxShadow: mode === "signin" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: mode === "register" ? "#141514" : "#5A5955",
                backgroundColor: mode === "register" ? "#FFFFFF" : "transparent",
                boxShadow: mode === "register" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Create Account
            </button>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <h1
              style={{
                fontSize: "1.65rem",
                fontWeight: 800,
                fontFamily: "var(--font-serif), serif",
                letterSpacing: "-0.02em",
                margin: "0 0 6px 0",
                color: "#141514",
              }}
            >
              {mode === "signin" ? "Open your ledger." : "Start your ledger."}
            </h1>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#5A5955", lineHeight: 1.5 }}>
              {mode === "signin"
                ? "Enter your credentials to access verified accounts and financial reporting."
                : "Create a fresh double-entry ledger organization with 5-class Pacioli tree."}
            </p>
          </div>

          {configError ? (
            <Alert variant="error" title="Configuration Pending">
              Authentication services are currently initializing on this deployment.
            </Alert>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {ready && user && (
                <div
                  style={{
                    padding: "0.85rem 1rem",
                    backgroundColor: "#F4EFE6",
                    borderRadius: "8px",
                    border: "1px solid #D8D2C5",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#2E7D32" }} />
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontFamily: "var(--font-mono), monospace",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "#6E6A62",
                        }}
                      >
                        Active Session Detected
                      </span>
                    </div>
                    <span className="mono" style={{ fontSize: "0.8rem", fontWeight: 700, color: "#141514" }}>
                      {user.email || "Authenticated"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      style={{ flex: 1, fontSize: "0.8rem" }}
                      onClick={() => router.replace(destination)}
                    >
                      Enter Dashboard →
                    </button>
                    <button
                      type="button"
                      className="btn btn--quiet btn--sm"
                      style={{ fontSize: "0.8rem" }}
                      onClick={async () => {
                        await signOut();
                        toast.info("Signed out", "You can now enter new credentials below.");
                      }}
                    >
                      Sign Out / Switch
                    </button>
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                {error && (
                  <Alert
                    key={error}
                    variant="error"
                    onClose={() => setError(null)}
                  >
                    {error}
                  </Alert>
                )}
              </AnimatePresence>

              {/* Email / Password Form */}
              <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="field">
                  <label
                    htmlFor="auth-email"
                    className="label"
                    style={{ fontSize: "0.75rem", fontWeight: 700 }}
                  >
                    Email address
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="auth-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: "100%",
                        paddingLeft: "2.35rem",
                        borderColor: filled ? "#141514" : undefined,
                        backgroundColor: filled ? "#F4EFE6" : undefined,
                      }}
                    />
                    <Mail
                      size={16}
                      color="#8A8780"
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    />
                  </div>
                </div>

                <div className="field">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <label
                      htmlFor="auth-password"
                      className="label"
                      style={{ fontSize: "0.75rem", fontWeight: 700 }}
                    >
                      Password
                    </label>
                    {mode === "signin" && (
                      <span
                        className="faint"
                        style={{ fontSize: "0.75rem", cursor: "pointer" }}
                        onClick={() => {
                          toast.info("Password Recovery", "For demo environments, use the reviewer button below.");
                        }}
                      >
                        Forgot password?
                      </span>
                    )}
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      required
                      minLength={6}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        width: "100%",
                        paddingLeft: "2.35rem",
                        paddingRight: "2.5rem",
                        borderColor: filled ? "#141514" : undefined,
                        backgroundColor: filled ? "#F4EFE6" : undefined,
                      }}
                    />
                    <Lock
                      size={16}
                      color="#8A8780"
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        padding: "4px",
                        cursor: "pointer",
                        color: "#8A8780",
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn"
                  type="submit"
                  disabled={busy}
                  style={{
                    width: "100%",
                    marginTop: "0.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    fontWeight: 700,
                  }}
                >
                  {busy ? "Authenticating…" : mode === "signin" ? "Sign in to Dashboard" : "Create Organization Account"}
                  <ArrowRight size={16} />
                </motion.button>
              </form>

              {/* Divider */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  margin: "0.5rem 0",
                }}
              >
                <div style={{ flex: 1, height: "1px", backgroundColor: "var(--line)" }} />
                <span className="label" style={{ fontSize: "0.7rem", color: "#8A8780" }}>
                  OR
                </span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "var(--line)" }} />
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                className="btn btn--quiet"
                disabled={busy}
                onClick={async () => {
                  setError(null);
                  setBusy(true);
                  try {
                    await signInWithGoogle();
                    toast.success("Signed in with Google");
                    router.replace("/dashboard");
                  } catch (caught) {
                    setError(readableAuthError(caught));
                  } finally {
                    setBusy(false);
                  }
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  fontWeight: 600,
                }}
              >
                <GoogleMark />
                Continue with Google
              </button>

              {/* Verified Reviewer Demo Account Capsule */}
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "1rem",
                  borderRadius: "8px",
                  backgroundColor: "#F4EFE6",
                  border: "1px solid #D8D2C5",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    className="label"
                    style={{ fontSize: "0.7rem", fontWeight: 700, color: "#141514" }}
                  >
                    Reviewer One-Click Access
                  </span>
                  <span
                    className="chip"
                    style={{
                      fontSize: "0.65rem",
                      backgroundColor: "rgba(216, 84, 61, 0.08)",
                      borderColor: "rgba(216, 84, 61, 0.25)",
                      color: "#D8543D",
                      fontWeight: 700,
                    }}
                  >
                    case {DEMO_CASE} ready
                  </span>
                </div>

                <div
                  className="mono"
                  style={{
                    fontSize: "0.75rem",
                    color: "#5A5955",
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: "4px 8px",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Login:</span>
                  <span>{DEMO_EMAIL}</span>
                  <span style={{ fontWeight: 600 }}>Pass:</span>
                  <span>{DEMO_PASSWORD}</span>
                </div>

                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  className="btn btn--sm"
                  disabled={busy}
                  onClick={fillDemo}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontWeight: 700,
                  }}
                >
                  <ShieldCheck size={14} color="#D8543D" />
                  {busy ? (filled ? "Signing into demo…" : "Filling credentials…") : "Instant Reviewer Sign-In"}
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--line)",
          padding: "var(--s-3) var(--s-5)",
          textAlign: "center",
          fontSize: "0.75rem",
          color: "#8A8780",
        }}
      >
        <div
          className="wrap"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: "76rem",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <span>Pacioli Double-Entry Standards · NBR Mushak 9.1 Compliant</span>
          <span>Ledger Enterprise Financial Platform</span>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#FAF7F2" }} />}>
      <LoginFormContent />
    </Suspense>
  );
}
