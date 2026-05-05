// client/src/components/ai/AiChatButton.jsx
// Floating action button that opens/closes the AI chat panel.
// Injected globally into MainLayout.

import React, { useState } from 'react';
import { X } from 'lucide-react';
import AiChatPanel from './AiChatPanel';

// Inline cursor blink keyframe
const CURSOR_STYLE = `
  @keyframes ai-cursor-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
`;

function AiChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Inline keyframe for cursor blink */}
      <style>{CURSOR_STYLE}</style>

      {/* Slide-in panel */}
      {open && <AiChatPanel onClose={() => setOpen(false)} />}

      {/* Floating trigger button */}
      <button
        className={`ai-fab ${open ? 'panel-open' : ''}`}
        onClick={() => setOpen(o => !o)}
        title={open ? 'Close assistant' : 'Open CAL MISC Assistant'}
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
        id="btn-ai-assistant"
      >
        {open ? (
          <X size={20} />
        ) : (
          /* Sparkle / star icon */
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-5.74L4 10l5.91-1.74z" />
          </svg>
        )}
      </button>
    </>
  );
}

export default AiChatButton;

