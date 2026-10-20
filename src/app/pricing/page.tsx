"use client";

import Link from "next/link";
import StaggeredMenu from "@/components/StaggeredMenu";
import { PUBLIC_NAV_ITEMS, PUBLIC_SOCIAL_ITEMS } from "@/lib/nav";
import { PricingSection } from "@/components/landing/PricingSection";
import { BusinessRoiCalculator } from "@/components/landing/BusinessRoiCalculator";
import { LandingFaqSection } from "@/components/landing/LandingFaqSection";
import { Footer } from "@/components/footer";
import { ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

export default function PricingPage() {
  return (
    <div style={{ background: "#FAF7F2", minHeight: "100vh", color: "#141514" }}>
      {/* Navigation Header */}
      <StaggeredMenu
        position="right"
        items={PUBLIC_NAV_ITEMS}
        socialItems={PUBLIC_SOCIAL_ITEMS}
        colors={["#D8543D", "#141514", "#141514"]}
        accentColor="#D8543D"
      />

      <main style={{ paddingTop: "7rem", paddingBottom: "4rem" }}>
        {/* Page Hero Header */}
        <section
          style={{
            maxWidth: "76rem",
            marginInline: "auto",
            paddingInline: "1.5rem",
            textAlign: "center",
            marginBottom: "3.5rem",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.35rem 0.85rem",
              borderRadius: "999px",
              background: "rgba(216, 84, 61, 0.08)",
              border: "1px solid rgba(216, 84, 61, 0.25)",
              color: "#D8543D",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: "1.25rem",
            }}
          >
            <ShieldCheck size={14} />
            <span>Transparent SaaS Pricing · Zero Hidden Overages</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2.2rem, 5vw, 3.75rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.035em",
              fontFamily: "var(--font-serif), Georgia, serif",
              margin: "0 0 1.25rem 0",
              color: "#141514",
            }}
          >
            Predictable plans for every taka accounted for.
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 1.8vw, 1.2rem)",
              lineHeight: 1.6,
              color: "#5A5955",
              maxWidth: "52ch",
              margin: "0 auto 2rem auto",
            }}
          >
            Built for Bangladeshi founders, accountants, and finance directors who demand
            uncompromising double-entry rigor with automatic 15% NBR VAT compliance.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1.5rem",
              flexWrap: "wrap",
              fontSize: "0.875rem",
              color: "#5A5955",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              <CheckCircle2 size={16} color="#D8543D" /> 14-day risk-free trial
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              <CheckCircle2 size={16} color="#D8543D" /> Cancel anytime
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              <CheckCircle2 size={16} color="#D8543D" /> Dedicated Dhaka onboarding support
            </span>
          </div>
        </section>

        {/* Pricing Cards Grid */}
        <div style={{ maxWidth: "76rem", marginInline: "auto", paddingInline: "1.5rem" }}>
          <PricingSection />
        </div>

        {/* ROI Calculator Section */}
        <div style={{ maxWidth: "76rem", marginInline: "auto", paddingInline: "1.5rem", marginTop: "5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#D8543D",
              }}
            >
              Interactive Value Assessment
            </span>
            <h2
              style={{
                fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                fontFamily: "var(--font-serif), Georgia, serif",
                marginTop: "0.5rem",
              }}
            >
              Calculate your exact monthly return on investment.
            </h2>
          </div>
          <BusinessRoiCalculator />
        </div>

        {/* Frequently Asked Questions */}
        <div style={{ maxWidth: "76rem", marginInline: "auto", paddingInline: "1.5rem", marginTop: "5rem" }}>
          <LandingFaqSection />
        </div>

        {/* Bottom CTA Banner */}
        <section
          style={{
            maxWidth: "76rem",
            marginInline: "auto",
            paddingInline: "1.5rem",
            marginTop: "5rem",
          }}
        >
          <div
            style={{
              background: "#141514",
              color: "#FAF7F2",
              borderRadius: "16px",
              padding: "clamp(2rem, 5vw, 3.5rem)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.25rem",
            }}
          >
            <h3
              style={{
                fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                fontFamily: "var(--font-serif), Georgia, serif",
                margin: 0,
              }}
            >
              Ready to eliminate financial discrepancies?
            </h3>
            <p style={{ color: "#D8D2C5", maxWidth: "46ch", margin: 0, fontSize: "1rem", lineHeight: 1.6 }}>
              Launch your organization in under 3 minutes with pre-seeded Chart of Accounts,
              automated NBR VAT rates, and instant trial balance verification.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", marginTop: "0.5rem" }}>
              <Link
                href="/login"
                style={{
                  background: "#D8543D",
                  color: "#FAF7F2",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  padding: "0.85rem 1.75rem",
                  borderRadius: "8px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>Get Started Now</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/login?redirect=/dashboard"
                style={{
                  background: "transparent",
                  color: "#FAF7F2",
                  border: "1px solid rgba(250, 247, 242, 0.25)",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  padding: "0.85rem 1.75rem",
                  borderRadius: "8px",
                  textDecoration: "none",
                }}
              >
                Explore Live Demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Public Footer */}
      <Footer variant="marketing" />
    </div>
  );
}
