// src/components/ui/landing-page.jsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Globe from "./globe";
import { cn } from "../../lib/utils";

// ─── Landing Nav Header ────────────────────────────────────────────────────────

// Content-focused anchor links — explain the platform and steel FAB
const NAV_LINKS = [
  { label: "Products",      href: "/products",   tooltip: "View all Caldim solutions" },
  { label: "Platform",      href: "#platform",   tooltip: "What CAL MISC does" },
  { label: "How It Works",  href: "#how-it-works", tooltip: "Step-by-step estimation workflow" },
  { label: "Steel FAB 101", href: "#steel-fab",  tooltip: "Key structural steel facts" },
  { label: "What's Next",   href: "#roadmap",    tooltip: "Upcoming modules & growth" },
];

function LandingHeader({ scrolled }) {
  const navigate = useNavigate();
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2rem",
        height: "64px",
        transition: "background 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease",
        background: scrolled
          ? "rgba(10, 12, 18, 0.82)"
          : "transparent",
        backdropFilter: scrolled ? "blur(18px) saturate(160%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(18px) saturate(160%)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(255,255,255,0.07)"
          : "1px solid transparent",
      }}
    >
      {/* Logo / Brand */}
      <div
        onClick={() => navigate("/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.55rem",
          textDecoration: "none",
          flexShrink: 0,
          cursor: "pointer"
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #10a37f, #0ea5e9)",
            fontSize: "16px",
          }}
        >
          ⚙
        </span>
        <span
          style={{
            fontWeight: 700,
            fontSize: "1rem",
            letterSpacing: "-0.01em",
            color: "rgba(255,255,255,0.92)",
          }}
        >
          CAL
          <span style={{ color: "#10a37f", marginLeft: "2px" }}>MISC</span>
        </span>
      </div>

      {/* Navigation Links — content anchors */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
        }}
      >
        {NAV_LINKS.map((link) => (
          <div
            key={link.href}
            title={link.tooltip}
            onClick={(e) => {
              // Smooth scroll for hash links
              if (link.href.startsWith("#")) {
                const target = document.querySelector(link.href);
                if (target) {
                  target.scrollIntoView({ behavior: "smooth", block: "center" });
                } else {
                  navigate("/" + link.href);
                }
              } else {
                navigate(link.href);
              }
            }}
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "rgba(255,255,255,0.65)",
              textDecoration: "none",
              transition: "color 0.2s, background 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.95)";
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.65)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            {link.label}
          </div>
        ))}
      </nav>

      {/* Auth Button */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
        <div
          onClick={() => navigate("/login")}
          style={{
            padding: "0.45rem 1rem",
            borderRadius: "8px",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "rgba(255,255,255,0.75)",
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.16)",
            transition: "all 0.2s",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.95)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.75)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          Login
        </div>
        <div
          onClick={() => navigate("/login?mode=signup")}
          style={{
            padding: "0.45rem 1.25rem",
            borderRadius: "8px",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#fff",
            textDecoration: "none",
            background: "linear-gradient(135deg, #10a37f, #0ea5e9)",
            boxShadow: "0 2px 14px rgba(16,163,127,0.4)",
            transition: "transform 0.2s, box-shadow 0.2s",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.04)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(16,163,127,0.55)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 2px 14px rgba(16,163,127,0.4)";
          }}
        >
          Join the Forge
        </div>
      </div>
    </header>
  );
}

// ─── Landing Footer ────────────────────────────────────────────────────────────

function LandingFooter() {
  return (
    <footer
      style={{
        position: "relative",
        zIndex: 20,
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "2rem 2.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        background: "rgba(10,12,18,0.6)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "24px",
            height: "24px",
            borderRadius: "6px",
            background: "linear-gradient(135deg, #10a37f, #0ea5e9)",
            fontSize: "12px",
          }}
        >
          ⚙
        </span>
        <span
          style={{ fontSize: "0.875rem", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}
        >
          CAL MISC
        </span>
        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginLeft: "0.5rem" }}>
          Steel Estimation Suite
        </span>
      </div>
      <div
        style={{
          fontSize: "0.8rem",
          color: "rgba(255,255,255,0.35)",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
        }}
      >
        <span>Developed by</span>
        <span
          style={{
            fontWeight: 700,
            background: "linear-gradient(90deg, #10a37f, #0ea5e9)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "0.04em",
          }}
        >
          CALDIM
        </span>
      </div>
      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.25)" }}>
        © {new Date().getFullYear()} CAL MISC. All rights reserved.
      </div>
    </footer>
  );
}

// ─── ScrollGlobe Component ────────────────────────────────────────────────────

const defaultGlobeConfig = {
  positions: [
    { top: "50%", left: "75%", scale: 1.4 }, // Hero: Right side, balanced
    { top: "25%", left: "50%", scale: 0.9 }, // Innovation: Top side, subtle
    { top: "15%", left: "90%", scale: 2 },   // Discovery: Left side, medium
    { top: "50%", left: "50%", scale: 1.8 }, // Future: Center, large backdrop
  ],
};

const parsePercent = (str) => parseFloat(str.replace("%", ""));

function ScrollGlobe({ sections, globeConfig = defaultGlobeConfig, className }) {
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [globeTransform, setGlobeTransform] = useState("");
  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
  const animationFrameId = useRef();
  const navLabelTimeoutRef = useRef();

  const calculatedPositions = useMemo(() => {
    return globeConfig.positions.map((pos) => ({
      top: parsePercent(pos.top),
      left: parsePercent(pos.left),
      scale: pos.scale,
    }));
  }, [globeConfig.positions]);

  const updateScrollPosition = useCallback(() => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(Math.max(scrollTop / docHeight, 0), 1);
    setScrollProgress(progress);

    const viewportCenter = window.innerHeight / 2;
    let newActiveSection = 0;
    let minDistance = Infinity;

    sectionRefs.current.forEach((ref, index) => {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);
        if (distance < minDistance) {
          minDistance = distance;
          newActiveSection = index;
        }
      }
    });

    const currentPos = calculatedPositions[newActiveSection];
    const transform = `translate3d(${currentPos.left}vw, ${currentPos.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${currentPos.scale}, ${currentPos.scale}, 1)`;
    setGlobeTransform(transform);
    setActiveSection(newActiveSection);
  }, [calculatedPositions]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        animationFrameId.current = requestAnimationFrame(() => {
          updateScrollPosition();
          setHeaderScrolled(window.pageYOffset > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollPosition();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (navLabelTimeoutRef.current) clearTimeout(navLabelTimeoutRef.current);
    };
  }, [updateScrollPosition]);

  useEffect(() => {
    const initialPos = calculatedPositions[0];
    const initialTransform = `translate3d(${initialPos.left}vw, ${initialPos.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${initialPos.scale}, ${initialPos.scale}, 1)`;
    setGlobeTransform(initialTransform);
  }, [calculatedPositions]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full max-w-screen overflow-x-hidden min-h-screen bg-background text-foreground",
        className
      )}
      style={{ background: "var(--landing-bg, #0f1117)", color: "var(--landing-text, #f0f0f0)" }}
    >
      {/* ── Sticky Header Nav ── */}
      <LandingHeader scrolled={headerScrolled} />

      {/* ── Progress Bar (below header z-wise) ── */}
      <div className="fixed top-[64px] left-0 w-full h-0.5 z-50" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full will-change-transform"
          style={{
            background: "linear-gradient(90deg, #10a37f, #0ea5e9, #6366f1)",
            transform: `scaleX(${scrollProgress})`,
            transformOrigin: "left center",
            transition: "transform 0.15s ease-out",
            filter: "drop-shadow(0 0 4px rgba(16,163,127,0.5))",
          }}
        />
      </div>

      {/* ── Side Navigation Dots ── */}
      <div className="hidden sm:flex fixed right-2 sm:right-4 lg:right-8 top-1/2 -translate-y-1/2 z-40">
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="relative group">
              <div
                className={cn(
                  "absolute right-5 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2",
                  "px-2 sm:px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap z-50",
                  "border shadow-xl transition-all duration-500",
                  activeSection === index
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-2 pointer-events-none"
                )}
                style={{
                  background: "rgba(15,17,23,0.95)",
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: "#10a37f" }}
                  />
                  <span>{section.badge || `Section ${index + 1}`}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  sectionRefs.current[index]?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }}
                className={cn(
                  "relative w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 rounded-full border-2 transition-all duration-300 hover:scale-125"
                )}
                style={{
                  background: activeSection === index ? "#10a37f" : "transparent",
                  borderColor: activeSection === index ? "#10a37f" : "rgba(255,255,255,0.3)",
                  boxShadow: activeSection === index ? "0 0 8px rgba(16,163,127,0.6)" : "none",
                }}
                aria-label={`Go to ${section.badge || `section ${index + 1}`}`}
              />
            </div>
          ))}
        </div>
        <div
          className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 -z-10"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(16,163,127,0.2), transparent)" }}
        />
      </div>

      {/* ── Floating Globe ── */}
      <div
        className="fixed z-10 pointer-events-none will-change-transform"
        style={{
          transform: globeTransform,
          transition: "transform 1400ms cubic-bezier(0.23,1,0.32,1)",
          filter: `opacity(${activeSection === 3 ? 0.35 : 0.8})`,
        }}
      >
        <div className="scale-75 sm:scale-90 lg:scale-100">
          <Globe />
        </div>
      </div>

      {/* ── Sections ── */}
      {sections.map((section, index) => (
        <section
          key={section.id}
          id={section.id}
          ref={(el) => (sectionRefs.current[index] = el)}
          className={cn(
            "relative min-h-screen flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-16 z-20 py-12 sm:py-16 lg:py-20",
            "w-full max-w-full overflow-hidden",
            section.align === "center" && "items-center text-center",
            section.align === "right" && "items-end text-right",
            section.align !== "center" && section.align !== "right" && "items-start text-left"
          )}
          style={index === 0 ? { paddingTop: "calc(64px + 3rem)" } : undefined}
        >
          <div
            className={cn(
              "w-full max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl will-change-transform transition-all duration-700",
              "opacity-100 translate-y-0"
            )}
          >
            {/* Badge */}
            {section.badge && (
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
                style={{
                  background: "rgba(16,163,127,0.12)",
                  border: "1px solid rgba(16,163,127,0.3)",
                  color: "#10a37f",
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {section.badge}
              </div>
            )}

            {/* Title */}
            <h1
              className={cn(
                "font-bold mb-6 sm:mb-8 leading-[1.1] tracking-tight",
                index === 0
                  ? "text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
                  : "text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
              )}
              style={{ color: "rgba(255,255,255,0.95)" }}
            >
              {section.subtitle ? (
                <div className="space-y-1 sm:space-y-2">
                  <div
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.75) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {section.title}
                  </div>
                  <div
                    className="font-medium tracking-wider text-[0.55em] sm:text-[0.6em]"
                    style={{ color: "rgba(16,163,127,0.9)" }}
                  >
                    {section.subtitle}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {section.title}
                </div>
              )}
            </h1>

            {/* Description */}
            <div
              className="leading-relaxed mb-8 sm:mb-10 text-base sm:text-lg lg:text-xl font-light"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              <p className="mb-3 sm:mb-4">{section.description}</p>
              {index === 0 && (
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm mt-4 sm:mt-6"
                  style={{ color: "rgba(255,255,255,0.3)" }}>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Estimation Engine</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div
                      className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"
                      style={{ animationDelay: "0.5s" }}
                    />
                    <span>Scroll to Explore</span>
                  </div>
                </div>
              )}
            </div>

            {/* Features */}
            {section.features && (
              <div className="grid gap-3 sm:gap-4 mb-8 sm:mb-10">
                {section.features.map((feature, featureIndex) => (
                  <div
                    key={feature.title}
                    className="group p-4 sm:p-5 rounded-xl border transition-all duration-300 hover:-translate-y-1"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderColor: "rgba(255,255,255,0.08)",
                      animationDelay: `${featureIndex * 0.1}s`,
                    }}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div
                        className="w-2 h-2 rounded-full mt-2 flex-shrink-0 transition-colors group-hover:scale-125"
                        style={{ background: "rgba(16,163,127,0.7)" }}
                      />
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <h3
                          className="font-semibold text-base sm:text-lg"
                          style={{ color: "rgba(255,255,255,0.88)" }}
                        >
                          {feature.title}
                        </h3>
                        <p
                          className="leading-relaxed text-sm sm:text-base"
                          style={{ color: "rgba(255,255,255,0.5)" }}
                        >
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {section.actions && (
              <div
                className={cn(
                  "flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4",
                  section.align === "center" && "justify-center",
                  section.align === "right" && "justify-end",
                  (!section.align || section.align === "left") && "justify-start"
                )}
              >
                {section.actions.map((action, actionIndex) => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className="group relative px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base focus:outline-none w-full sm:w-auto"
                    style={
                      action.variant === "primary"
                        ? {
                            background: "linear-gradient(135deg, #10a37f, #0ea5e9)",
                            color: "#fff",
                            boxShadow: "0 4px 24px rgba(16,163,127,0.35)",
                            animationDelay: `${actionIndex * 0.1 + 0.2}s`,
                          }
                        : {
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.14)",
                            color: "rgba(255,255,255,0.75)",
                            animationDelay: `${actionIndex * 0.1 + 0.2}s`,
                          }
                    }
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}

      {/* ── Footer ── */}
      <LandingFooter />
    </div>
  );
}

// ─── Application-Specific Landing Page ───────────────────────────────────────
// Content tailored for MISC Steel Estimation Platform
// Developed by CALDIM

export default function GlobeScrollDemo() {
  const navigate = useNavigate();
  const demoSections = [
    {
      id: "platform",
      badge: "Steel Estimation Suite",
      title: "Precision Built",
      subtitle: "For Fabricators",
      description:
        "CAL MISC is a purpose-built estimation engine for structural steel fabricators. Generate accurate stair, railing, and guard-rail bids in minutes — not hours — with real-time cost breakdowns covering material weight, labor, finish, mounting, and scrap recovery. One platform. Every number accounted for.",
      align: "left",
      actions: [
        {
          label: "Explore Solutions",
          variant: "primary",
          onClick: () => navigate("/products"),
        },
        {
          label: "Login",
          variant: "secondary",
          onClick: () => navigate("/login"),
        },
      ],
    },
    {
      id: "how-it-works",
      badge: "How It Works",
      title: "Estimate Smarter",
      subtitle: "Not Harder",
      description:
        "MISC transforms the estimation process into a guided, visual workflow. Each step is broken into focused modules — stair geometry, rail types, finishes, mounting — so nothing is missed and every variable is priced accurately.",
      align: "center",
      features: [
        {
          title: "① Configure Your Stair",
          description:
            "Set rise, run, width, number of risers, and stringer type. The engine instantly resolves total stringer length, slope angle, and material weight per linear foot.",
        },
        {
          title: "② Add Rails & Landings",
          description:
            "Attach handrails, guard rails, or kick plates to any stair. Choose mounting type (Anchored, Embedded, or Welded) and the cost engine adjusts hardware and POR ROK costs automatically.",
        },
        {
          title: "③ Select Finish & Export",
          description:
            "Apply Primer, Galvanize, or Powder Coat to each component. Preview the live estimate summary and export a print-ready PDF or detailed BOM spreadsheet in one click.",
        },
      ],
    },
    {
      id: "steel-fab",
      badge: "Steel FAB 101",
      title: "The Science of",
      subtitle: "Structural Steel",
      description:
        "Structural steel fabrication blends engineering precision with hands-on craftsmanship. Every measurement matters — a single miscalculated rise or run can cascade into misaligned connections, code violations, and costly rework on site.",
      align: "left",
      features: [
        {
          title: "Why Rise & Run Matter",
          description:
            "IBC code mandates a maximum 7¾\" rise and minimum 10\" run for commercial stairs. MISC validates your geometry automatically and warns before a code conflict ever reaches the shop floor.",
        },
        {
          title: "Galvanizing vs. Powder Coat",
          description:
            "Hot-dip galvanizing adds corrosion resistance from the inside out — ideal for outdoor or industrial exposure. Powder coat offers color flexibility and a smooth finish, but requires weep holes to prevent moisture trapping.",
        },
        {
          title: "Scrap Factor Explained",
          description:
            "Raw steel cuts always generate offcuts. The industry standard scrap factor (typically 10–12%) is baked into every weight and cost calculation so your bid absorbs real shop waste — not optimistic numbers.",
        },
        {
          title: "POR ROK & Anchor Bolts",
          description:
            "Post bases and anchor bolts are the connection between steel and structure. MISC prices these per connection point based on your mounting selection — Anchored at $6/point, Embedded at $5/point.",
        },
      ],
    },
    {
      id: "roadmap",
      badge: "Roadmap",
      title: "Growing With",
      subtitle: "Your Business",
      description:
        "Stair & railing estimation is live today. The MISC roadmap brings the full structural product suite into one unified workflow — every module engineered to the same benchmark-grade precision and backed by the same real-time cost engine.",
      align: "center",
      features: [
        {
          title: "🔩 Guard Rails (Coming Soon)",
          description: "Full post-spacing logic, guard height validation, and infill options — priced per linear foot with hardware included.",
        },
        {
          title: "🪜 Ladders (Coming Soon)",
          description: "Cage ladders, ship's ladders, and fixed vertical access — calculated with OSHA-compliant rung spacing and weight ratings.",
        },
        {
          title: "🚧 Bollards & Gates (Coming Soon)",
          description: "Impact-rated bollards and swing/slide gates with material weight, post depth, and hardware costs fully automated.",
        },
      ],
      actions: [
        {
          label: "Initialize Workspace",
          variant: "primary",
          onClick: () => navigate("/login?mode=signup"),
        },
        {
          label: "Login",
          variant: "secondary",
          onClick: () => navigate("/login"),
        },
      ],
    },
  ];

  return (
    <ScrollGlobe
      sections={demoSections}
      className="bg-gradient-to-br from-background via-muted/20 to-background"
      style={{ paddingTop: "64px" }}
    />
  );
}

