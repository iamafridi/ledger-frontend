# Ledger Web Client (`ledger-frontend`)

> **High-Precision Double-Entry Accounting Web Application**  
> Built with Next.js 15 (App Router), React 19, TypeScript 5.9, and Tailwind CSS / Custom Design Tokens.  
> Designed for uncompromising financial legibility, deterministic arithmetic visualization, keyboard navigation, and publication-grade A4 printing.

---

## 1. Design System & Financial Typography

The interface follows a strict set of design rules tailored for accountants, financial officers, and everyday businesses:

### 1.1 Obsidian Ground with Electric Lime Precision Accents
- **Ground & Surfaces:** Deep obsidian tones (`--bg: #07090c;`, `--surface: #0d1116;`, `--surface-2: #131820;`) provide maximum contrast without eye fatigue.
- **Accents:** Electric Lime (`--lime: #b8ff2e;`) highlights balanced invariants and verified ledger postings; Cyber Cyan (`--cyan: #38bdf8;`) indicates asset streams and reconciliations.
- **Disciplined Palette:** Free from cluttered multi-color gradients—clean, modern, and serious like Linear, Stripe, or Bloomberg.

### 1.2 "Numbers Never Over a Blur" Rule
Cards containing columns of figures use solid, layered dark surfaces rather than translucent blurred glass. Blurred backgrounds lower numerical contrast exactly where legibility is load-bearing. Depth is created through subtle hairlines (`--line: #1e252f;`) and precise drop shadows.

### 1.3 Signature Currency Formatting
All monetary quantities align on the decimal and follow the house style:
- **Taka sign (`৳`):** Dimmed at `0.7em` opacity.
- **Taka whole units:** Rendered at full font weight with tabular figures (`tnum`).
- **Paisa decimals:** Rendered at `0.58em` size and `50%` opacity so whole numbers remain prominent while exact paisa precision is never hidden.

### 1.4 Synthetic Micro-Haptic Audio Engine
Located in `src/lib/audio.ts`, the application synthesizes clean acoustic clicks on user interactions (such as vault transactions and drawer toggles) using the native Web Audio API oscillators—requiring zero external audio files and introducing zero network latency.

---

## 2. Key Components & Layout Architecture

### 2.1 Minimal Floating Navigation Bar
Located in `src/components/floating-nav.tsx`:
- Stays floating and centered within a `max-w-7xl` container.
- Ultra-clean and focused: contains strictly **LEDGER** (wordmark + icon), **About** (`/about`), **Sign in** (`/login`), and **Launch App →**.

### 2.2 Precision Fintech Terminal Hero
Located in `src/app/page.tsx`:
- Replaces heavy 3D canvases with an instant-loading, high-performance financial terminal.
- Features real-time balance matrices (`1010 Bank Vault`, `1100 AR`, `1200 Warehouse Stock`, `2000 AP`) and 1-click double-entry transaction dispatchers (**⚡ 1. Post Sale**, **🚚 2. Buy Stock**, **👥 3. Run Payroll**).
- Terminal ticker confirms zero-sum debit/credit parity in real-time.

### 2.3 Swiper Carousel for "Architectural Non-Negotiables"
Located in `src/components/landing/stack-scroll-section.tsx`:
- Horizontal card slider featuring smooth scroll-snap navigation.
- Includes **← / →** navigation buttons and pagination dots.
- Equipped with **left and right gradient blur masks** for a smooth edge transition.

### 2.4 Unified Mathematical Certainty Engine Capsule
Located on both the landing page (`/`) and the About page (`/about`):
- `max-w-6xl` rounded capsule container with glowing lime border.
- Split 2-column layout: Left column showcases mathematical guarantees; right column renders a live telemetry card confirming zero float drift and I1–I6 invariant checks.

### 2.5 Dedicated Interactive About & Architecture Page (`/about`)
Located in `src/app/about/page.tsx`:
- **Interactive System Topology Explorer:** Clickable nodes (**Sales & Invoicing**, **Purchases & Payables**, **Staff Payroll**, **Fixed Assets**, **Statutory NBR VAT 9.1**, **General Ledger**, **Financial Statements**) that dynamically inspect affected debit/credit accounts, invariants, and data pipelines.
- **Full Screen Directory:** Detailed preview cards for all 10 application views with route tags and capability chips.
- **Live Auditor Invariant Tester:** Real-time formula tester validating debit/credit entries down to the paisa with immediate HTTP 201/422 status feedback.
- **Interactive FAQ Accordion:** Explaining floating-point drift elimination, VAT truncation rules, and fiscal period locks.

### 2.6 Authenticated Collapsible App Sidebar
Located in `src/components/app-sidebar.tsx`:
- Seamlessly integrated into `src/app/(app)/layout.tsx`.
- **Collapse/Expand Toggle Icon (`«` / `»`):** Smoothly transitions between a full 260px sidebar and a compact 72px icon rail.
- **Categorized Navigation Groups:**
  - *Core & Insights:* Dashboard, Insights, Expenses, Receipts, Pockets
  - *Double-Entry Books:* Chart of Accounts, Journals, Periods, Reports
  - *Commercial & Trade:* Sales, Purchases, Stock, Advances
  - *Treasury & Compliance:* Banking, Assets, Statutory VAT, Staff
  - *Master Data & Setup:* Parties, Items, Catalogs, Settings
- Integrated user profile widget with quick sign-out.

### 2.7 Publication-Quality A4 Print Engine
Custom `@media print` rules throughout `src/app/globals.css` format tax invoices, purchase orders, monthly payslips, and financial statements directly onto standard A4 portrait pages—stripping screen navigation, buttons, and dark themes for crisp monochrome printing.

---

## 3. Screen & Route Directory

### Public Marketing & Specs
- **`/` — Home Landing Page:** Hero precision terminal, live calculation sandbox, 5 principles swiper, module directory, and demo login.
- **`/about` — System Architecture & Specs:** Interactive topology node graph, screen directory, live debit/credit scratchpad, and FAQ.
- **`/login` — Authentication & Demo Seeder:** 1-click demo account loader (`demo@ledgerfinancial.com`), sample case injector, and email/password sign-in.

### Authenticated Application Suite (`/(app)`)
- **`/dashboard` — Executive & Personal Dashboard:** Net liquidity KPIs, live revenue vs. expenses bar graph, cash runway dial, and recent activity.
- **`/accounts` — Chart of Accounts (CoA):** Interactive 5-class account tree with live balances, active toggles, and new account drawer.
- **`/journals` — Journal Entry Composer:** Multi-line balanced voucher creator with real-time debit/credit sum balancer and void stubs.
- **`/sales` — Invoicing & Customer Receivables:** Tax invoices with automated 15% VAT, line discounts, payment receipts, customer advances, and AR aging.
- **`/purchases` — Purchases & Payables:** Vendor bills, 3-way matching, withholding tax allocations, and AP aging schedules.
- **`/inventory` — Warehouse Stock & Valuation:** Moving-average cost tracker, perpetual stock movements, and stocktake reconciliation.
- **`/assets` — Fixed Asset Register:** Straight-line depreciation tracker with salvage value floor, batch depreciation runner, and asset disposal.
- **`/advances` — Party Advances Ledger:** Customer deposits and supplier prepayments with FIFO automated clearing against documents.
- **`/banking` — Banking & Cash Management:** Bank control accounts mapped to chart assets, internal transfers, and walk-to-zero statement reconciliation.
- **`/tax` — Statutory NBR Form 9.1 VAT:** Official tax return viewer, input tax rebate verification, and whole-taka truncation.
- **`/staff` — Staff Payroll & Loan Amortization:** Employee directory, 2-step salary posting wizard, 12/24-month loan amortization schedules, and printable payslips.
- **`/recurring` — Recurring Journal Templates:** Automated periodic accruals with next-period auto-reversing entries (`ACCRUAL_REVERSAL`).
- **`/budgets` — Budget vs. Actual Variance:** Fiscal budget matrix editor and color-coded variance analysis.
- **`/periods` — Fiscal Periods & 5-Step Closing Wizard:** Monthly period locks, fiscal years, and guided close checklist.
- **`/reports` — 20-Report Financial Catalog:** Drillable Balance Sheet, Profit & Loss, Trial Balance, Cash Flow, and RFC-4180 CSV export.
- **`/receipts` — AI Vision Receipt Intake:** Image upload with automated Claude Vision OCR itemized parsing.
- **`/pockets` — Savings Pockets & DPS:** Deposit Pension Scheme month-by-month compounding engine.
- **`/insights` — Deterministic Business Health:** Days Sales Outstanding (DSO), cash runway forecast, and receivables aging heatmap.

---

## 4. Technology Stack

- **Framework:** Next.js 15.5+ (App Router)
- **Library:** React 19
- **Language:** TypeScript 5.9 (Strict mode)
- **Styling:** Custom Obsidian Design Tokens (`globals.css`) + Tailwind CSS utilities
- **Icons:** Lucide React
- **Animations:** Framer Motion (smooth scroll reveals and modal transitions)
- **Authentication:** Firebase Client SDK (bearer tokens passed to backend API)
- **HTTP Client:** Native `fetch` with typed API envelope handler (`src/lib/api.ts`)

---

## 5. Environment Configuration

Create a `.env.local` file in `ledger-frontend/`:

```env
# Backend API base URL
NEXT_PUBLIC_API_URL=http://localhost:4000

# Firebase Client SDK credentials
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ledger-accounting.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ledger-accounting
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ledger-accounting.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

---

## 6. Installation & Development

### 6.1 Install Dependencies
```bash
cd ledger-frontend
npm install
```

### 6.2 Start the Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 6.3 Typecheck
```bash
# Validates TypeScript types across all components and pages
npm run typecheck
```

### 6.4 Build for Production
```bash
npm run build
npm start
```
