// src/pages/Landing/ProductsPage.jsx
// Static product display page for the Caldim platform (NASCC Exclusive Access)
// Developed by CALDIM

import React, { useState, useEffect } from "react";

// ─── Shared Components ────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Home",          href: "/landing",    tooltip: "Back to Home" },
  { label: "Products",      href: "/products",   tooltip: "View all Caldim solutions" },
  { label: "Platform",      href: "/landing#platform",   tooltip: "What MISC StairPro does" },
  { label: "Steel FAB 101", href: "/landing#steel-fab",  tooltip: "Key structural steel facts" },
];

function LandingHeader({ scrolled }) {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2rem",
        height: "64px",
        transition: "all 0.35s ease",
        background: scrolled ? "rgba(255, 255, 255, 0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
      }}
    >
      <a href="/landing" style={{ display: "flex", alignItems: "center", gap: "0.55rem", textDecoration: "none" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: "32px", height: "32px", borderRadius: "8px",
          background: "linear-gradient(135deg, #10a37f, #0ea5e9)", fontSize: "16px"
        }}>⚙</span>
        <span style={{ fontWeight: 700, fontSize: "1rem", color: scrolled ? "#111" : "#fff" }}>
          CALDIM <span style={{ color: "#10b981", marginLeft: "2px" }}>Platform</span>
        </span>
      </a>

      <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={{
              padding: "0.45rem 0.9rem", borderRadius: "8px", fontSize: "0.875rem",
              fontWeight: 500, color: scrolled ? "#555" : "rgba(255,255,255,0.7)",
              textDecoration: "none", transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = scrolled ? "#000" : "#fff";
              e.currentTarget.style.background = scrolled ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = scrolled ? "#555" : "rgba(255,255,255,0.7)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <a href="/login" style={{
          padding: "0.45rem 1.25rem", borderRadius: "8px", fontSize: "0.875rem", fontWeight: 600,
          background: "#111", color: "#fff", textDecoration: "none"
        }}>Login</a>
      </div>
    </header>
  );
}

// ─── Product Data ─────────────────────────────────────────────────────────────

const PRODUCTS = [
  {
    id: "calrims",
    code: "CALRIMS",
    label: "Recruitment & Intelligence",
    name: "Recruitment",
    tagline: "Recruitment Intelligence Management System",
    shortCode: "CALRIMS",
    pain: "Hiring detailers takes too long?",
    description:
      "A smart platform for managing end-to-end recruitment pipelines, candidate tracking, and intelligent workforce planning. Purpose-built for the structural steel industry, CALRIMS reduces time-to-hire by connecting job postings, applicant scoring, and HR onboarding in one unified system.",
    features: [
      "Pipeline Management",
      "Team Tracking",
      "Workforce Analytics",
      "Live Reporting",
    ],
    capabilities: [
      "Automated candidate screening & scoring",
      "Skill-matrix mapping for exact matches",
      "Direct integration with HR onboarding",
      "Visual hiring pipelines and metrics",
    ],
    color: "#f59e0b",
    bgColor: "rgba(245,158,11,0.08)",
    borderColor: "rgba(245,158,11,0.2)",
    dotColor: "#f59e0b",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "caltims",
    code: "CALTIMS",
    label: "Timesheet & Attendance",
    name: "Timesheet & Attendance",
    tagline: "Timesheet Management System",
    shortCode: "CALTIMS",
    pain: "Losing money to unapproved overtime?",
    description:
      "Simplify timesheet submission, approval workflows, and attendance tracking built for both field and office teams. CALTIMS captures real-time clock-ins, enforces overtime rules, and syncs directly with payroll — eliminating manual reconciliation and payroll errors.",
    features: [
      "Digital Timesheets",
      "Attendance Tracking",
      "Overtime Alerts",
      "Payroll Reporting",
    ],
    capabilities: [
      "Mobile-first field entry & geofencing",
      "Automated overtime rule calculation",
      "Dynamic leave management & accruals",
      "Seamless sync with native payroll",
    ],
    color: "#10b981",
    bgColor: "rgba(16,185,129,0.08)",
    borderColor: "rgba(16,185,129,0.2)",
    dotColor: "#10b981",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: "pm",
    code: "PM",
    label: "Project Management",
    name: "Project Management",
    tagline: "Complete Project Lifecycle Management",
    shortCode: "PM",
    pain: "Struggling to track revisions and deadlines?",
    description:
      "Manage teams, tasks, budgets, and documents in a single platform designed for steel construction pace. From initial bid to final delivery, keep every stakeholder aligned with live status dashboards, revision logs, transmittals, and budget vs. actuals tracking.",
    features: [
      "Lifecycle Management",
      "Task Tracking",
      "Budget Monitoring",
      "Document Mgmt",
    ],
    capabilities: [
      "Live fabrication tracking & status",
      "Automated revision control & transmittals",
      "Resource load balancing and forecasting",
      "Real-time budget vs. actuals tracking",
    ],
    color: "#a855f7",
    bgColor: "rgba(168,85,247,0.08)",
    borderColor: "rgba(168,85,247,0.2)",
    dotColor: "#a855f7",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "asset",
    code: "ASSET",
    label: "Equipment Management",
    name: "Asset Management",
    tagline: "Heavy Equipment & Resource Tracking",
    shortCode: "ASSET",
    pain: "Losing track of your expensive tools?",
    description:
      "Complete oversight of company assets, maintenance scheduling, and real-time inventory levels across multiple sites. ASSET gives field crews and managers instant visibility into what's available, where it is, and when it last received service — via QR code or desktop.",
    features: [
      "QR Code Tracking",
      "Maintenance Logs",
      "Stock Alerts",
      "Asset Lifecycle",
    ],
    capabilities: [
      "Centralized equipment registry & QR tracking",
      "Automated maintenance alerts & schedules",
      "Real-time stock level monitoring",
      "Detailed depreciation & valuation reports",
    ],
    color: "#ef4444",
    bgColor: "rgba(239,68,68,0.08)",
    borderColor: "rgba(239,68,68,0.2)",
    dotColor: "#ef4444",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
        <path d="M7 7h.01" />
      </svg>
    ),
  },
  {
    id: "caltrack",
    code: "CALTRACK",
    label: "Production Tracking",
    name: "Production Tracking",
    tagline: "Steel Fabrication Progress Tracking",
    shortCode: "CALTRACK",
    pain: "Can't see where your steel is in production?",
    description:
      "End-to-end tracking of fabrication status, shipping progress, and logistics management to ensure on-time delivery. CALTRACK gives project managers real-time visibility into every piece of steel — from raw material receipt to final delivery on the job site.",
    features: [
      "Fabrication Status",
      "Shipping Logs",
      "Vendor Portal",
      "Route Optimization",
    ],
    capabilities: [
      "End-to-end production status visibility",
      "Barcode-integrated logistics tracking",
      "Vendor & third-party logistics portal",
      "Automated shipping manifest generation",
    ],
    color: "#f97316",
    bgColor: "rgba(249,115,22,0.08)",
    borderColor: "rgba(249,115,22,0.2)",
    dotColor: "#f97316",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
  },
  {
    id: "misc",
    code: "MISC",
    label: "Steel Estimation",
    name: "Steel Estimation",
    tagline: "Structural Steel Estimation Engine",
    shortCode: "MISC",
    pain: "Still quoting steel projects manually from spreadsheets?",
    description:
      "A purpose-built estimation engine for structural steel fabricators. Generate accurate stair, railing, guard-rail, and structural bids in minutes with real-time cost breakdowns covering material weight, labor, finish, mounting, and scrap recovery. One platform. Every number accounted for.",
    features: [
      "BOM Generation",
      "Live Cost Engine",
      "PDF / Excel Export",
      "Revision History",
    ],
    capabilities: [
      "Granular role-based access control",
      "Single Sign-On (SSO) integrations",
      "Extensive audit logging for compliance",
      "Open API for 3rd-party ERP systems",
    ],
    color: "#0ea5e9",
    bgColor: "rgba(14,165,233,0.08)",
    borderColor: "rgba(14,165,233,0.2)",
    dotColor: "#0ea5e9",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
];

// ─── Reusable Components ───────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function FeaturePill({ label }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 10px",
        borderRadius: "999px",
        fontSize: "0.72rem",
        fontWeight: 500,
        border: "1px solid rgba(0,0,0,0.1)",
        background: "rgba(0,0,0,0.04)",
        color: "#555",
        whiteSpace: "nowrap",
      }}
    >
      <CheckIcon />
      {label}
    </span>
  );
}

// ─── Section 1: Product Selector ──────────────────────────────────────────────

function ProductSelectorSection({ selected, onSelect }) {
  return (
    <section
      id="products"
      style={{
        background: "#f4f3ef",
        padding: "80px 40px 64px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Eyebrow */}
      <div
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#10b981",
          marginBottom: "16px",
        }}
      >
        NASCC Exclusive Access
      </div>

      {/* Headline */}
      <h2
        style={{
          fontSize: "clamp(2rem, 5vw, 3rem)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: "#111",
          textAlign: "center",
          margin: "0 0 12px",
          lineHeight: 1.1,
        }}
      >
        What are you looking to improve?
      </h2>

      <p
        style={{
          fontSize: "1rem",
          color: "#888",
          margin: "0 0 48px",
          textAlign: "center",
          fontWeight: 400,
        }}
      >
        Tell us what you need and we'll show you the perfect solution.
      </p>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          maxWidth: "860px",
          width: "100%",
        }}
      >
        {PRODUCTS.map((product) => {
          const isSelected = selected === product.id;
          return (
            <button
              key={product.id}
              id={`product-card-${product.id}`}
              onClick={() => onSelect(product.id === selected ? null : product.id)}
              style={{
                background: "#fff",
                border: isSelected
                  ? `2px solid ${product.color}`
                  : "2px solid transparent",
                borderRadius: "16px",
                padding: "24px 20px 20px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isSelected
                  ? `0 0 0 4px ${product.bgColor}, 0 4px 20px rgba(0,0,0,0.08)`
                  : "0 1px 4px rgba(0,0,0,0.06)",
                transform: isSelected ? "translateY(-2px)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
                  e.currentTarget.style.transform = "none";
                }
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: product.bgColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: product.color,
                  marginBottom: "14px",
                }}
              >
                {product.icon}
              </div>

              {/* Name */}
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#111",
                  marginBottom: "2px",
                }}
              >
                {product.name}
              </div>

              {/* Code */}
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  color: "#999",
                  marginBottom: "10px",
                }}
              >
                {product.shortCode}
              </div>

              {/* Pain point */}
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: product.color,
                  lineHeight: 1.4,
                }}
              >
                {product.pain}
              </div>
            </button>
          );
        })}
      </div>

      {/* CTA */}
      <button
        id="show-solutions-btn"
        onClick={() => {
          document.getElementById("showcase")?.scrollIntoView({ behavior: "smooth" });
        }}
        style={{
          marginTop: "40px",
          padding: "14px 32px",
          borderRadius: "999px",
          background: "#111",
          color: "#fff",
          fontWeight: 600,
          fontSize: "0.9rem",
          border: "none",
          cursor: "pointer",
          transition: "all 0.2s",
          letterSpacing: "-0.01em",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#222";
          e.currentTarget.style.transform = "scale(1.03)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#111";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        Show My Solutions
      </button>
    </section>
  );
}

// ─── Section 2: Product Showcase Cards ────────────────────────────────────────

function ProductShowcaseSection({ activeFilter }) {
  const visibleProducts = activeFilter
    ? PRODUCTS.filter((p) => p.id === activeFilter)
    : PRODUCTS;

  return (
    <section
      id="showcase"
      style={{
        background: "#edece8",
        padding: "72px 40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          maxWidth: "980px",
          width: "100%",
        }}
      >
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}

        {/* Caldim Settings QR placeholder card */}
        {!activeFilter && <CaldimSettingsCard />}
      </div>
    </section>
  );
}

function ProductCard({ product }) {
  return (
    <div
      id={`showcase-${product.id}`}
      style={{
        background: "#fff",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)";
      }}
    >
      {/* Screenshot Placeholder */}
      <div
        style={{
          height: "160px",
          background: "linear-gradient(135deg, #1a1d2e 0%, #0d1520 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative mock dashboard lines */}
        <div style={{ position: "absolute", inset: 0, padding: "16px", opacity: 0.35 }}>
          <div style={{ height: "8px", width: "60%", borderRadius: "4px", background: "rgba(255,255,255,0.2)", marginBottom: "8px" }} />
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            {[40, 25, 35].map((w, i) => (
              <div key={i} style={{ height: "6px", width: `${w}%`, borderRadius: "3px", background: "rgba(255,255,255,0.15)" }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "flex-end", marginTop: "16px" }}>
            {[50, 70, 45, 80, 60, 90, 55].map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h * 0.6}px`,
                  borderRadius: "3px 3px 0 0",
                  background: `${product.color}55`,
                }}
              />
            ))}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: product.color,
            opacity: 0.4,
          }}
        >
          <div style={{ transform: "scale(2.5)" }}>{product.icon}</div>
        </div>
      </div>

      {/* Card Content */}
      <div style={{ padding: "20px 20px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Category Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 10px",
            borderRadius: "999px",
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            background: product.bgColor,
            color: product.color,
            border: `1px solid ${product.borderColor}`,
            marginBottom: "12px",
            width: "fit-content",
          }}
        >
          {product.label}
        </div>

        {/* Product Name */}
        <h3
          style={{
            fontSize: "1.5rem",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "#111",
            margin: "0 0 2px",
            lineHeight: 1.1,
            textTransform: "uppercase",
          }}
        >
          {product.shortCode}
        </h3>

        {/* Tagline */}
        <div
          style={{
            fontSize: "0.82rem",
            color: "#666",
            marginBottom: "12px",
            fontWeight: 400,
          }}
        >
          {product.tagline}
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: "0.82rem",
            color: "#777",
            lineHeight: 1.65,
            marginBottom: "16px",
            flex: 1,
          }}
        >
          {product.description}
        </p>

        {/* Feature Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {product.features.map((f) => (
            <FeaturePill key={f} label={f} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CaldimSettingsCard() {
  return (
    <div
      id="caldim-settings-card"
      style={{
        background: "#fff",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "36px 28px",
        textAlign: "center",
        minHeight: "220px",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)";
      }}
    >
      {/* QR Code SVG placeholder */}
      <div
        style={{
          width: "100px",
          height: "100px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* QR Code pattern approximation */}
          <rect width="100" height="100" rx="8" fill="white" />
          <rect x="8" y="8" width="36" height="36" rx="4" fill="#111" />
          <rect x="14" y="14" width="24" height="24" rx="2" fill="white" />
          <rect x="20" y="20" width="12" height="12" rx="1" fill="#111" />
          <rect x="56" y="8" width="36" height="36" rx="4" fill="#111" />
          <rect x="62" y="14" width="24" height="24" rx="2" fill="white" />
          <rect x="68" y="20" width="12" height="12" rx="1" fill="#111" />
          <rect x="8" y="56" width="36" height="36" rx="4" fill="#111" />
          <rect x="14" y="62" width="24" height="24" rx="2" fill="white" />
          <rect x="20" y="68" width="12" height="12" rx="1" fill="#111" />
          <rect x="56" y="56" width="8" height="8" fill="#111" />
          <rect x="68" y="56" width="8" height="8" fill="#111" />
          <rect x="80" y="56" width="12" height="8" fill="#111" />
          <rect x="56" y="68" width="12" height="8" fill="#111" />
          <rect x="72" y="68" width="8" height="8" fill="#111" />
          <rect x="84" y="68" width="8" height="8" fill="#111" />
          <rect x="56" y="80" width="8" height="12" fill="#111" />
          <rect x="68" y="80" width="8" height="12" fill="#111" />
          <rect x="80" y="80" width="12" height="12" fill="#111" />
        </svg>
      </div>
      <div
        style={{
          fontWeight: 700,
          fontSize: "1rem",
          color: "#111",
          marginBottom: "6px",
        }}
      >
        Caldim Settings
      </div>
      <div style={{ fontSize: "0.8rem", color: "#999" }}>Scan to launch platform</div>
    </div>
  );
}

// ─── Section 3: Capabilities Deep Dive ───────────────────────────────────────

function CapabilitiesSection() {
  return (
    <section
      id="capabilities"
      style={{
        background: "#f4f3ef",
        padding: "80px 40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "52px", maxWidth: "720px" }}>
        <h2
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "#111",
            margin: "0 0 12px",
            lineHeight: 1.1,
          }}
        >
          Deep dive into our capabilities.
        </h2>
        <p style={{ fontSize: "0.95rem", color: "#888", margin: 0 }}>
          Discover the core features that power our intelligence engine.
        </p>
      </div>

      {/* Capabilities Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          maxWidth: "980px",
          width: "100%",
          marginBottom: "20px",
        }}
      >
        {PRODUCTS.slice(0, 4).map((product) => (
          <CapabilityCard key={product.id} product={product} />
        ))}
      </div>

      {/* Second row (2 products) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "16px",
          maxWidth: "980px",
          width: "100%",
        }}
      >
        {PRODUCTS.slice(4).map((product) => (
          <CapabilityCard key={product.id} product={product} wide />
        ))}
      </div>
    </section>
  );
}

function CapabilityCard({ product, wide }) {
  return (
    <div
      id={`capability-${product.id}`}
      style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "22px 20px",
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.1)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.05)")}
    >
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: product.dotColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: "0.8rem",
            fontWeight: 800,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "#111",
          }}
        >
          {product.shortCode}
        </span>
      </div>

      {/* Capability list */}
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "9px" }}>
        {product.capabilities.map((cap) => (
          <li
            key={cap}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              fontSize: "0.8rem",
              color: "#555",
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: "#10b981", marginTop: "1px", flexShrink: 0 }}>
              <CheckIcon />
            </span>
            {cap}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main ProductsPage Component ──────────────────────────────────────────────

export default function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    
    // Update Document Title & Meta for SEO
    document.title = "Caldim Platform | Structural Steel Solutions";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Explore the Caldim platform suite of structural steel solutions, from recruitment and timesheets to project management and estimation.");
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      style={{
        fontFamily:
          "'Inter', 'Outfit', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        minHeight: "100vh",
        background: "#f4f3ef",
        paddingTop: "64px",
      }}
    >
      <LandingHeader scrolled={scrolled} />
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      {/* Section 1 – Product Selector */}
      <ProductSelectorSection
        selected={selectedProduct}
        onSelect={setSelectedProduct}
      />

      {/* Section 2 – Showcase Cards */}
      <ProductShowcaseSection activeFilter={selectedProduct} />

      {/* Section 3 – Capabilities Deep Dive */}
      <CapabilitiesSection />

      {/* Footer */}
      <footer
        style={{
          background: "#111",
          color: "rgba(255,255,255,0.4)",
          textAlign: "center",
          padding: "28px 24px",
          fontSize: "0.8rem",
          letterSpacing: "0.01em",
        }}
      >
        <span style={{ color: "#10b981", fontWeight: 700 }}>CALDIM</span>
        {" · "}
        NASCC Exclusive Access
        {" · "}
        © {new Date().getFullYear()} All rights reserved.
      </footer>
    </div>
  );
}
