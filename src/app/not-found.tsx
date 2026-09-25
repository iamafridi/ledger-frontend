"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Home, BookOpen, LayoutDashboard } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FAF7F2",
        color: "#141514",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "2rem",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
      }}
    >
      {/* Top Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: "72rem",
          width: "100%",
          margin: "0 auto",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-serif), serif",
            fontSize: "1.5rem",
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
              width: "10px",
              height: "10px",
              backgroundColor: "#D8543D",
              borderRadius: "50%",
              display: "inline-block",
            }}
          />
          Ledger
        </Link>

        <span
          className="mono"
          style={{
            fontSize: "0.75rem",
            color: "#8A8780",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          DHAKA BST UTC+6 · STATUS 404
        </span>
      </header>

      {/* Main 404 Content */}
      <main
        style={{
          maxWidth: "42rem",
          width: "100%",
          margin: "auto",
          textAlign: "center",
          padding: "3rem 1rem",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "999px",
              background: "rgba(216, 84, 61, 0.08)",
              border: "1px solid rgba(216, 84, 61, 0.25)",
              color: "#D8543D",
              fontSize: "0.75rem",
              fontWeight: 600,
              fontFamily: "var(--font-mono), monospace",
              letterSpacing: "0.06em",
              marginBottom: "1.5rem",
            }}
          >
            RECORD OUT OF BOUNDS · ERROR 404
          </div>

          <h1
            style={{
              fontSize: "clamp(2.75rem, 6vw, 4.5rem)",
              fontFamily: "var(--font-serif), serif",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              margin: "0 0 1rem 0",
              color: "#141514",
            }}
          >
            Unbalanced Entry
          </h1>

          <p
            style={{
              fontSize: "1.125rem",
              lineHeight: 1.6,
              color: "#5A5955",
              margin: "0 auto 2.5rem auto",
              maxWidth: "34rem",
            }}
          >
            The account or resource you requested does not balance against our verified general ledger registry. Either the record was moved or this ledger path does not exist.
          </p>

          {/* Action Navigation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/dashboard"
              className="btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                background: "#141514",
                color: "#FFFDF7",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                transition: "all 0.15s ease",
              }}
            >
              <LayoutDashboard size={16} />
              Return to Dashboard
            </Link>

            <Link
              href="/accounts"
              className="btn btn--quiet"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                background: "#FFFFFF",
                border: "1px solid #D8D2C5",
                color: "#141514",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                transition: "all 0.15s ease",
              }}
            >
              <BookOpen size={16} />
              Chart of Accounts
            </Link>

            <Link
              href="/"
              className="btn btn--quiet"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                background: "#FFFFFF",
                border: "1px solid #D8D2C5",
                color: "#141514",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                transition: "all 0.15s ease",
              }}
            >
              <Home size={16} />
              Home
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Bottom Footer Watermark */}
      <footer
        style={{
          textAlign: "center",
          maxWidth: "72rem",
          width: "100%",
          margin: "0 auto",
          paddingTop: "2rem",
          borderTop: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "0.75rem",
          color: "#8A8780",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <span className="mono">PACIOLI DOUBLE-ENTRY INVARIANT PRESERVED</span>
        <span>Ledger Enterprise Financial Platform</span>
      </footer>
    </div>
  );
}
