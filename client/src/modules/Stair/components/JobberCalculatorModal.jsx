import { useEffect, useCallback } from "react";
import { motion, useDragControls } from "framer-motion";
import CaldimCalculates from "./CaldimCalculates";

/**
 * JobberCalculatorModal
 *
 * Props:
 *   isOpen  {boolean}  — controls visibility
 *   onClose {function} — called when user dismisses the modal
 *
 * Usage:
 *   <JobberCalculatorModal isOpen={showCalc} onClose={() => setShowCalc(false)} />
 */
export default function JobberCalculatorModal({ isOpen, onClose }) {
  const dragControls = useDragControls();

  // Close on Escape key
  const handleKey = useCallback(
    (e) => { if (e.key === "Escape") onClose(); },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKey);
    // Prevent body scroll while modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKey]);

  if (!isOpen) return null;

  return (
    // Fixed overlay without blocking background interactions
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none" // Allow clicks to pass through to the app behind it
      }}
    >
      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false} // Only drag using the drag handle (Title Bar)
        dragMomentum={false}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        style={{
          position: "absolute",
          top: "10vh",
          left: "calc(50vw - 330px)", // Assuming width approx 660px
          pointerEvents: "auto", // Re-enable clicks for the calculator itself
          filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.4))",
        }}
      >
        <CaldimCalculates onClose={onClose} dragControls={dragControls} />
      </motion.div>
    </div>
  );
}
