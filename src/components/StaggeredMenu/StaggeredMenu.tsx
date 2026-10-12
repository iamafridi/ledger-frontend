'use client';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import './StaggeredMenu.css';

export interface StaggeredMenuItem {
  label: string;
  ariaLabel?: string;
  link: string;
  sublabel?: string;
  isExternal?: boolean;
}

export interface StaggeredMenuSocialItem {
  label: string;
  link: string;
}

export interface StaggeredMenuProps {
  position?: 'left' | 'right';
  items?: StaggeredMenuItem[];
  socialItems?: StaggeredMenuSocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  className?: string;
  logoUrl?: string;
  colors?: string[];
  accentColor?: string;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  isFixed?: boolean;
  closeOnClickAway?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
}

// Dedicated isolated live clock component (zero parent re-renders)
const LiveDhakaClock = memo(function LiveDhakaClock() {
  const clockRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const update = () => {
      if (!clockRef.current) return;
      const now = new Date();
      clockRef.current.textContent = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return <span ref={clockRef} className="fs-clock-live">02:15:00 AM</span>;
});

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  position = 'right',
  colors = ['#D8543D', '#141514', '#141514'],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className,
  logoUrl,
  accentColor = '#D8543D',
  onMenuOpen,
  onMenuClose,
}) => {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const layer1Ref = useRef<HTMLDivElement | null>(null);
  const layer2Ref = useRef<HTMLDivElement | null>(null);
  const mainScreenRef = useRef<HTMLDivElement | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);

  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTlRef = useRef<gsap.core.Timeline | null>(null);

  // Mouse spotlight coordinates
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const main = mainScreenRef.current;
    if (!main) return;
    const rect = main.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    main.style.setProperty('--mouse-x', `${x}px`);
    main.style.setProperty('--mouse-y', `${y}px`);
  };

  // Helper to compute exact origin from the hamburger button's center
  const getButtonCenterOrigin = useCallback(() => {
    const btn = toggleBtnRef.current;
    if (!btn) return 'calc(100% - 3.5rem) 2.5rem';
    const rect = btn.getBoundingClientRect();
    const cx = Math.round(rect.left + rect.width / 2);
    const cy = Math.round(rect.top + rect.height / 2);
    return `${cx}px ${cy}px`;
  }, []);

  // Setup initial collapsed state directly over the hamburger button
  useEffect(() => {
    const l1 = layer1Ref.current;
    const l2 = layer2Ref.current;
    const main = mainScreenRef.current;
    if (!l1 || !l2 || !main) return;

    const origin = getButtonCenterOrigin();
    const collapsedClip = `circle(0px at ${origin})`;

    gsap.set([l1, l2, main], {
      clipPath: collapsedClip,
      autoAlpha: 0,
      pointerEvents: 'none',
    });
  }, [getButtonCenterOrigin]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  const playOpen = useCallback(() => {
    const l1 = layer1Ref.current;
    const l2 = layer2Ref.current;
    const main = mainScreenRef.current;
    if (!l1 || !l2 || !main) return;

    closeTlRef.current?.kill();
    openTlRef.current?.kill();

    const origin = getButtonCenterOrigin();
    const collapsedClip = `circle(0px at ${origin})`;
    const expandedClip = `circle(160vmax at ${origin})`;

    const itemEls = Array.from(main.querySelectorAll<HTMLElement>('.fs-menu-item'));
    const sidebarEls = Array.from(main.querySelectorAll<HTMLElement>('.fs-menu-info-block'));
    const footerEls = Array.from(main.querySelectorAll<HTMLElement>('.fs-menu-footer-item'));
    const tickerEl = main.querySelector<HTMLElement>('.fs-telemetry-ticker');

    // Reset initial states right at the button center
    gsap.set([l1, l2, main], {
      clipPath: collapsedClip,
      autoAlpha: 1,
      pointerEvents: 'auto',
    });

    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      gsap.set([l1, l2], { autoAlpha: 0, pointerEvents: 'none' });
      gsap.set(main, { clipPath: 'none', autoAlpha: 1, pointerEvents: 'auto' });
      if (itemEls.length) gsap.set(itemEls, { y: 0, opacity: 1 });
      if (sidebarEls.length) gsap.set(sidebarEls, { y: 0, opacity: 1 });
      if (footerEls.length) gsap.set(footerEls, { y: 0, opacity: 1 });
      if (tickerEl) gsap.set(tickerEl, { y: 0, opacity: 1 });
      return;
    }

    if (itemEls.length) {
      gsap.set(itemEls, { y: 40, opacity: 0 });
    }
    if (sidebarEls.length) {
      gsap.set(sidebarEls, { y: 25, opacity: 0 });
    }
    if (footerEls.length) {
      gsap.set(footerEls, { opacity: 0, y: 15 });
    }
    if (tickerEl) {
      gsap.set(tickerEl, { opacity: 0, y: -10 });
    }

    const tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
    });

    // 1. Terracotta Bloom directly out from hamburger button
    tl.to(l1, {
      clipPath: expandedClip,
      duration: 1.8,
      ease: 'power2.inOut',
    }, 0);

    // 2. Champagne Gold Wave out from hamburger button
    tl.to(l2, {
      clipPath: expandedClip,
      duration: 1.8,
      ease: 'power2.inOut',
    }, 0.25);

    // 3. Deep Charcoal Takeover out from hamburger button
    tl.to(main, {
      clipPath: expandedClip,
      duration: 2.0,
      ease: 'power3.out',
    }, 0.5);

    // 4. Staggered Menu Item Entrance
    if (itemEls.length) {
      tl.to(
        itemEls,
        {
          y: 0,
          opacity: 1,
          duration: 1.1,
          stagger: 0.08,
          ease: 'power3.out',
        },
        1.1
      );
    }

    // 5. Left Editorial Info Blocks
    if (sidebarEls.length) {
      tl.to(
        sidebarEls,
        {
          y: 0,
          opacity: 1,
          duration: 0.95,
          stagger: 0.1,
          ease: 'power3.out',
        },
        1.3
      );
    }

    // 6. Top Telemetry Ticker
    if (tickerEl) {
      tl.to(
        tickerEl,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
        },
        1.4
      );
    }

    // 7. Footer Meta
    if (footerEls.length) {
      tl.to(
        footerEls,
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.05,
          ease: 'power2.out',
        },
        1.6
      );
    }

    openTlRef.current = tl;
  }, [getButtonCenterOrigin]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    closeTlRef.current?.kill();

    const l1 = layer1Ref.current;
    const l2 = layer2Ref.current;
    const main = mainScreenRef.current;
    if (!l1 || !l2 || !main) return;

    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      gsap.set([l1, l2, main], {
        autoAlpha: 0,
        pointerEvents: 'none',
      });
      return;
    }

    const origin = getButtonCenterOrigin();
    const collapsedClip = `circle(0px at ${origin})`;

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => {
        gsap.set([l1, l2, main], {
          autoAlpha: 0,
          pointerEvents: 'none',
        });
      },
    });

    // Content fades out cleanly
    const itemEls = Array.from(main.querySelectorAll<HTMLElement>('.fs-menu-item, .fs-menu-info-block, .fs-menu-footer-item, .fs-telemetry-ticker'));
    if (itemEls.length) {
      tl.to(itemEls, {
        opacity: 0,
        y: -10,
        duration: 0.4,
        stagger: 0.02,
        ease: 'power2.in',
      }, 0);
    }

    // Collapse Main back into button center
    tl.to(main, {
      clipPath: collapsedClip,
      duration: 1.3,
      ease: 'power3.inOut',
    }, 0.15);

    // Collapse Gold back into button center
    tl.to(l2, {
      clipPath: collapsedClip,
      duration: 1.3,
      ease: 'power3.inOut',
    }, 0.28);

    // Collapse Terracotta back into button center
    tl.to(l1, {
      clipPath: collapsedClip,
      duration: 1.3,
      ease: 'power3.inOut',
    }, 0.4);

    closeTlRef.current = tl;
  }, [getButtonCenterOrigin]);

  const toggleMenu = useCallback(() => {
    const nextState = !openRef.current;
    openRef.current = nextState;
    setOpen(nextState);

    if (nextState) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }
  }, [playOpen, playClose, onMenuOpen, onMenuClose]);

  const closeMenu = useCallback(() => {
    if (openRef.current) {
      openRef.current = false;
      setOpen(false);
      onMenuClose?.();
      playClose();
    }
  }, [playClose, onMenuClose]);

  // Escape key listener
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, closeMenu]);

  return (
    <div
      ref={containerRef}
      className={(className ? className + ' ' : '') + 'fullscreen-menu-root'}
      style={accentColor ? ({ ['--sm-accent']: accentColor } as React.CSSProperties) : undefined}
      data-open={open || undefined}
    >
      {/* ── Fixed Header Bar with Logo, Desktop Nav Links, Sign In Button, and Hamburger Toggle ── */}
      <header className={`fs-menu-header ${open ? 'fs-header-open' : ''}`} aria-label="Main navigation header">
        <div className="fs-logo" aria-label="Logo">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="fs-logo-img" draggable={false} width={110} height={24} />
          ) : (
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', color: 'inherit' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#D8543D',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFDF7',
                  boxShadow: '0 2px 8px rgba(216, 84, 61, 0.35)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M7 5V19H17" stroke="#FFFDF7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="15" cy="11" r="2" fill="#FFFDF7" />
                </svg>
              </div>
              <span
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  fontFamily: 'var(--font-sans, system-ui, sans-serif)',
                  color: open ? '#FFFDF7' : '#141514',
                  transition: 'color 0.4s ease',
                }}
              >
                ledger
              </span>
            </Link>
          )}
        </div>



        {/* Right Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!open && (
            <Link
              href="/login"
              className="fs-header-signin-btn"
            >
              Sign In ↗
            </Link>
          )}

          {/* Morphing Hamburger Toggle Button */}
          <button
            ref={toggleBtnRef}
            className="fs-toggle-btn"
            aria-label={open ? 'Close full screen menu' : 'Open full screen menu'}
            aria-expanded={open}
            onClick={toggleMenu}
            type="button"
          >
            <span className="fs-hamburger-box" aria-hidden="true">
              <span className="fs-hamburger-line fs-line-1" />
              <span className="fs-hamburger-line fs-line-2" />
              <span className="fs-hamburger-line fs-line-3" />
            </span>
          </button>
        </div>
      </header>

      {/* ── Layer 1: Terracotta Unfold Wave ── */}
      <div ref={layer1Ref} className="fs-bloom-layer fs-layer-terracotta" aria-hidden="true" />

      {/* ── Layer 2: Charcoal Transition Wave ── */}
      <div ref={layer2Ref} className="fs-bloom-layer fs-layer-charcoal" aria-hidden="true" />

      {/* ── Layer 3: Main Charcoal Full-Screen Canvas ── */}
      <main
        ref={mainScreenRef}
        className="fs-bloom-layer fs-main-takeover"
        aria-hidden={!open}
        onMouseMove={handleMouseMove}
      >
        <div className="fs-main-content">
          {/* Top Eyebrow Metadata with Live Dhaka Clock */}
          <div className="fs-content-header">
            <div className="fs-header-meta">
              <span className="fs-meta-dot" />
              <span className="fs-meta-text">00 / FINANCIAL OPERATING SYSTEM</span>
              <span className="fs-meta-divider">·</span>
              <span className="fs-meta-clock">
                DHAKA <LiveDhakaClock />
              </span>
            </div>
            <div className="fs-header-badge">BANGLADESH · DOUBLE-ENTRY NATIVE</div>
          </div>

          {/* Macro Telemetry Live Ticker Bar with Smooth Infinite Marquee */}
          <div className="fs-telemetry-ticker" aria-label="Bangladesh macro telemetry">
            <div className="fs-telemetry-track">
              {[0, 1].map((copyIdx) => (
                <div key={copyIdx} style={{ display: "inline-flex", alignItems: "center", gap: "1.25rem" }}>
                  <span className="fs-telemetry-item">USD/BDT <strong style={{ color: '#D8543D' }}>৳121.50</strong></span>
                  <span className="fs-telemetry-sep">·</span>
                  <span className="fs-telemetry-item">EUR/BDT <strong style={{ color: '#FFFDF7' }}>৳132.10</strong></span>
                  <span className="fs-telemetry-sep">·</span>
                  <span className="fs-telemetry-item">GOLD 22K <strong style={{ color: '#FFFDF7' }}>৳1,18,600/bhori</strong></span>
                  <span className="fs-telemetry-sep">·</span>
                  <span className="fs-telemetry-item">NBR VAT <strong style={{ color: '#D8543D' }}>15.0%</strong></span>
                  <span className="fs-telemetry-sep">·</span>
                  <span className="fs-telemetry-item">91-D T-BILL <strong style={{ color: '#FFFDF7' }}>11.75%</strong></span>
                  <span className="fs-telemetry-sep">·</span>
                  <span className="fs-telemetry-item">CALL MONEY <strong style={{ color: '#D8543D' }}>9.25%</strong></span>
                  <span className="fs-telemetry-sep">·</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dual Column Editorial Grid */}
          <div className="fs-grid-container">
            {/* Left Column: Brand Statement, Seal & Quick Links */}
            <div className="fs-left-column">
              <div className="fs-menu-info-block">
                <span className="fs-info-eyebrow">THE LEDGER CREED</span>
                <h3 className="fs-info-quote">
                  Every taka.
                  <br />
                  <em className="fs-gold-sweep">Accounted for.</em>
                </h3>
                <p className="fs-info-desc">
                  A dual-edition financial architecture for individuals building a life and Bangladesh SMEs building something real.
                </p>
              </div>

              {/* Digital Emboss Seal of Authenticity */}
              <div className="fs-seal-wrapper" aria-hidden="true">
                <div className="fs-seal-disc">
                  <svg viewBox="0 0 100 100" className="fs-seal-svg">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(201, 155, 82, 0.4)" strokeWidth="1" strokeDasharray="3 2" />
                    <circle cx="50" cy="50" r="41" fill="none" stroke="rgba(201, 155, 82, 0.25)" strokeWidth="1.5" />
                    <circle cx="50" cy="50" r="16" fill="#D8543D" />
                    <text x="50" y="56" textAnchor="middle" fill="#FFFDF7" fontSize="15" fontWeight="bold" fontFamily="var(--font-serif)">
                      ৳
                    </text>
                  </svg>
                </div>
                <div className="fs-seal-meta">
                  <span className="fs-seal-title">IMMUTABLE LEDGER</span>
                  <span className="fs-seal-subtitle">Zero floating-point drift</span>
                </div>
              </div>

              {displaySocials && socialItems && socialItems.length > 0 && (
                <div className="fs-menu-info-block fs-quick-actions">
                  <span className="fs-info-eyebrow">SYSTEM PORTALS</span>
                  <div className="fs-action-links">
                    {socialItems.map((s, i) => (
                      <a
                        key={s.label + i}
                        href={s.link}
                        className="fs-action-link"
                        onClick={() => {
                          if (s.link.startsWith('#')) closeMenu();
                        }}
                      >
                        {s.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="fs-menu-info-block fs-proof-stats">
                <div className="fs-stat-pill">
                  <strong className="fs-gold-sweep">14</strong> Phases Shipped
                </div>
                <div className="fs-stat-pill">
                  <strong className="fs-gold-sweep">20</strong> Standard Reports
                </div>
                <div className="fs-stat-pill">
                  <strong className="fs-gold-sweep">0</strong> Floating Point Errors
                </div>
              </div>
            </div>

            {/* Right Column: Giant Editorial Menu Items */}
            <div className="fs-right-column">
              <ul className="fs-menu-list" role="list">
                {items && items.length ? (
                  items.map((it, idx) => (
                    <li className="fs-menu-item" key={it.label + idx}>
                      <a
                        className="fs-item-link"
                        href={it.link}
                        aria-label={it.ariaLabel}
                        onClick={() => {
                          if (it.link.startsWith('#')) closeMenu();
                        }}
                      >
                        <span className="fs-item-num">
                          {displayItemNumbering ? String(idx + 1).padStart(2, '0') : ''}
                        </span>
                        <div className="fs-item-text">
                          <span className="fs-item-title">{it.label}</span>
                          {it.sublabel && <span className="fs-item-sub">{it.sublabel}</span>}
                        </div>
                        <span className="fs-item-arrow">↗</span>
                      </a>
                    </li>
                  ))
                ) : (
                  <li className="fs-menu-item">
                    <span className="fs-item-title">No menu items</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Full-Screen Footer */}
          <footer className="fs-content-footer">
            <div className="fs-menu-footer-item fs-footer-left">
              <span>© 2026 LEDGER FINANCIAL SYSTEM</span>
              <span className="fs-footer-sep">·</span>
              <span>DHAKA, BANGLADESH</span>
              <span className="fs-footer-sep">·</span>
              <span className="fs-fiscal-tag">FY 2026–27</span>
            </div>
            <div className="fs-menu-footer-item fs-footer-right">
              <span className="fs-status-indicator">
                <span className="fs-pulse-dot" /> BOOKS IN BALANCE
              </span>
              <span className="fs-footer-sep">·</span>
              <span>PRESS <strong>ESC</strong> TO CLOSE</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default StaggeredMenu;
