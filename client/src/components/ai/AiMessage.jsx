// client/src/components/ai/AiMessage.jsx
// Renders a single chat message bubble (user or bot).
// Bot messages support markdown-like rendering.

import React, { useMemo } from 'react';

function AiMessage({ message, isStreaming }) {
  const { role, content, tool, source, timestamp } = message;
  const isBot = role === 'assistant';

  const formattedContent = useMemo(() => {
    if (!isBot || !content) return content || '';
    return renderMarkdown(content);
  }, [content, isBot]);

  return (
    <div className={`ai-msg ${isBot ? 'ai-msg-bot' : 'ai-msg-user'}`}>
      {/* Avatar */}
      {isBot && (
        <div className="ai-msg-avatar">
          <span style={{ fontSize: 14 }}>✦</span>
        </div>
      )}

      <div className="ai-msg-body">
        {/* Bubble */}
        <div className={`ai-bubble ${isBot ? 'ai-bubble-bot' : 'ai-bubble-user'}`}>
          {isBot ? (
            <div
              className="ai-markdown"
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            />
          ) : (
            <span>{content}</span>
          )}
          {isStreaming && (
            <span className="ai-cursor">▋</span>
          )}
        </div>

        {/* Meta badges */}
        {isBot && !isStreaming && (tool || source) && (
          <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
            {tool && (
              <span className="ai-tool-badge">
                ⚡ {tool.split(',')[0].trim().replace(/_/g, ' ')}
              </span>
            )}
            {source && (
              <span className="ai-source-badge">
                📖 {source.replace('.md', '').replace(/_/g, ' ')}
              </span>
            )}
          </div>
        )}

        {/* Timestamp */}
        {timestamp && (
          <div className="ai-msg-time">
            {formatTime(timestamp)}
          </div>
        )}
      </div>

      {/* User avatar on right */}
      {!isBot && (
        <div className="ai-msg-avatar ai-msg-avatar-user">
          <span style={{ fontSize: 11, fontWeight: 700 }}>You</span>
        </div>
      )}
    </div>
  );
}

// ─── Very lightweight markdown renderer ───────────────────────────────────────
function renderMarkdown(text) {
  let html = text
    // Escape HTML first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

    // Headers
    .replace(/^### (.+)$/gm, '<h4 class="ai-h4">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="ai-h3">$1</h3>')

    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')

    // Inline code
    .replace(/`(.+?)`/g, '<code class="ai-code">$1</code>')

    // Tables
    .replace(/(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)+)/g, (match, header, sep, body) => {
      const headers = header.split('|').filter(Boolean).map(h => `<th>${h.trim()}</th>`).join('');
      const rows = body.trim().split('\n').map(row => {
        const cells = row.split('|').filter(Boolean).map(c => `<td>${c.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<div class="ai-table-wrap"><table class="ai-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
    })

    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote class="ai-quote">$1</blockquote>')

    // Horizontal rule
    .replace(/^---$/gm, '<hr class="ai-hr" />')

    // Bullet lists — group consecutive lines
    .replace(/((?:^- .+$\n?)+)/gm, (block) => {
      const items = block.trim().split('\n').map(line =>
        `<li>${line.replace(/^- /, '').trim()}</li>`
      ).join('');
      return `<ul class="ai-ul">${items}</ul>`;
    })

    // Numbered lists
    .replace(/((?:^\d+\. .+$\n?)+)/gm, (block) => {
      const items = block.trim().split('\n').map(line =>
        `<li>${line.replace(/^\d+\. /, '').trim()}</li>`
      ).join('');
      return `<ol class="ai-ol">${items}</ol>`;
    })

    // Line breaks (two newlines = paragraph break)
    .replace(/\n\n/g, '</p><p class="ai-p">')
    .replace(/\n/g, '<br/>');

  return `<p class="ai-p">${html}</p>`;
}

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default AiMessage;
