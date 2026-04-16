// src/pages/Landing/LandingPage.jsx
import React from "react";
import GlobeScrollDemo from "../../components/ui/landing-page";

/**
 * Public landing page for MISC Steel Estimation Suite.
 * Accessible without authentication at the root URL ("/").
 * Uses the ScrollGlobe component with application-specific content.
 */
export default function LandingPage() {
  return (
    <div
      style={{
        // Override the app shell's default background for this public page
        minHeight: "100vh",
        background: "#0f1117",
        position: "relative",
        isolation: "isolate",
      }}
    >
      {/* Subtle star-field background layer */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 80% at 50% -20%, rgba(16,163,127,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <GlobeScrollDemo />
    </div>
  );
}
