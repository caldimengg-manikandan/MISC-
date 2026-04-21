// client/src/components/ai/AiChatPanel.jsx
// The main slide-in chat panel component.
// Connects to the server SSE endpoint, manages conversation state.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, RotateCcw, Send } from 'lucide-react';
import AiMessage from './AiMessage';
import API_BASE_URL from '../../config/api';
import './AiChatPanel.css';

const SUGGESTION_PROMPTS = [
  '📋 Show me my recent projects',
  '⏰ Any upcoming deadlines?',
  '🧮 How is steel weight calculated?',
  '🔄 How does the project workflow work?',
  '📊 How to export a BOM Excel report?',
];

function AiChatPanel({ onClose }) {
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [isThinking, setIsThinking]   = useState(false);
  const [streamingMsg, setStreamingMsg] = useState(null); // partial bot message
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const abortRef       = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMsg, isThinking]);

  // Load conversation history on mount
  useEffect(() => {
    loadHistory();
    setTimeout(() => inputRef.current?.focus(), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('steel_token');
      const res   = await fetch(`${API_BASE_URL}/api/agent/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.history.length > 0) {
        setMessages(data.history.map((m, i) => ({ ...m, id: `hist_${i}` })));
      }
    } catch (_) { /* noop */ }
  };

  const sendMessage = useCallback(async (text) => {
    const query = (text || input).trim();
    if (!query || isThinking) return;

    setInput('');
    setIsThinking(true);

    // Add user message
    const userMsg = {
      id:        `u_${Date.now()}`,
      role:      'user',
      content:   query,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    const token = localStorage.getItem('steel_token');

    // SSE streaming via fetch
    try {
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const res = await fetch(`${API_BASE_URL}/api/agent/chat`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body:   JSON.stringify({ message: query }),
        signal: ctrl.signal,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';
      let botText   = '';
      let botMeta   = {};

      setIsThinking(false);

      // Initialize streaming message
      const botMsgId = `b_${Date.now()}`;
      setStreamingMsg({ id: botMsgId, role: 'assistant', content: '', timestamp: new Date().toISOString() });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.status === 'thinking') {
              // already set thinking indicator
            } else if (event.status === 'streaming') {
              botText += event.text;
              setStreamingMsg(prev => prev ? { ...prev, content: botText } : null);
            } else if (event.status === 'done') {
              botMeta = { tool: event.tool, source: event.source, intent: event.intent };
            } else if (event.status === 'error') {
              botText = event.text;
            }
          } catch (_) { /* malformed SSE event */ }
        }
      }

      // Finalize: move streaming to messages list
      setStreamingMsg(null);
      setMessages(prev => [...prev, {
        id:        botMsgId,
        role:      'assistant',
        content:   botText || '(No response)',
        timestamp: new Date().toISOString(),
        ...botMeta,
      }]);

    } catch (err) {
      if (err.name === 'AbortError') return;
      setIsThinking(false);
      setStreamingMsg(null);
      setMessages(prev => [...prev, {
        id:      `err_${Date.now()}`,
        role:    'assistant',
        content: '⚠️ Connection error. Make sure you are connected and try again.',
        timestamp: new Date().toISOString(),
      }]);
    }
  }, [input, isThinking]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClear = async () => {
    const token = localStorage.getItem('steel_token');
    try {
      await fetch(`${API_BASE_URL}/api/agent/clear`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (_) {}
    setMessages([]);
    setStreamingMsg(null);
    setIsThinking(false);
  };

  const handleAbort = () => {
    abortRef.current?.abort();
    setIsThinking(false);
    setStreamingMsg(null);
  };

  const showWelcome = messages.length === 0 && !isThinking && !streamingMsg;

  return (
    <div className="ai-panel" role="dialog" aria-label="MISC Pro AI Assistant">
      {/* Header */}
      <div className="ai-panel-header">
        <div className="ai-panel-header-left">
          <div className="ai-panel-avatar">✦</div>
          <div>
            <div className="ai-panel-title">MISC Pro Assistant</div>
            <div className="ai-panel-subtitle">
              {isThinking ? 'Thinking…' : 'Ask about projects, costs, or how things work'}
            </div>
          </div>
        </div>
        <div className="ai-panel-header-btns">
          <button
            className="ai-panel-header-btn"
            onClick={handleClear}
            title="Clear conversation"
          >
            <RotateCcw size={13} />
          </button>
          <button
            className="ai-panel-header-btn"
            onClick={onClose}
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="ai-messages" id="ai-messages-container">
        {showWelcome && (
          <div className="ai-welcome">
            <div className="ai-welcome-icon">✦</div>
            <div className="ai-welcome-title">Hi! I'm your estimation assistant</div>
            <div className="ai-welcome-sub">
              Ask me about your projects, costs, steel weights, deadlines,
              or how any calculation works.
            </div>
            <div className="ai-suggestions">
              {SUGGESTION_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  className="ai-suggestion-btn"
                  onClick={() => sendMessage(p.replace(/^[^\s]+\s/, ''))}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <AiMessageWrapper key={msg.id} message={msg} isStreaming={false} />
        ))}

        {/* Streaming message */}
        {streamingMsg && (
          <AiMessageWrapper message={streamingMsg} isStreaming={true} />
        )}

        {/* Thinking indicator */}
        {isThinking && (
          <div className="ai-thinking">
            <div className="ai-thinking-dots">
              <span /><span /><span />
            </div>
            <span className="ai-thinking-label">Looking that up…</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="ai-input-area">
        <div className="ai-input-row">
          <textarea
            ref={inputRef}
            className="ai-input"
            placeholder="Ask anything about your projects…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isThinking}
          />
          <button
            className="ai-send-btn"
            onClick={isThinking ? handleAbort : sendMessage}
            disabled={!isThinking && !input.trim()}
            title={isThinking ? 'Stop' : 'Send'}
          >
            {isThinking ? (
              <span style={{ fontSize: 14, fontWeight: 700 }}>■</span>
            ) : (
              <Send size={15} />
            )}
          </button>
        </div>
        <div className="ai-input-hint">Enter to send · Shift+Enter for newline</div>
      </div>
    </div>
  );
}

// Wrapper to apply inline styles since we can't add class to AiMessage directly
function AiMessageWrapper({ message, isStreaming }) {
  const isBot = message.role === 'assistant';
  return (
    <div style={{
      display: 'flex',
      flexDirection: isBot ? 'row' : 'row-reverse',
      gap: 8,
      alignItems: 'flex-start',
    }}>
      {/* Avatar */}
      <div style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: isBot ? 'linear-gradient(135deg,#10a37f,#0d8a6b)' : '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: isBot ? '#fff' : '#666',
        fontSize: isBot ? 12 : 10,
        fontWeight: 700,
        marginTop: 2,
      }}>
        {isBot ? '✦' : 'U'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Bubble */}
        <div style={{
          padding: '9px 13px',
          borderRadius: isBot ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
          background: isBot
            ? 'var(--gpt-surface, #fff)'
            : 'linear-gradient(135deg,#10a37f,#0d8a6b)',
          border: isBot ? '1px solid var(--gpt-border, #e5e5e5)' : 'none',
          color: isBot ? 'var(--gpt-text-primary, #111)' : '#fff',
          fontSize: 12.5,
          lineHeight: 1.55,
          position: 'relative',
          wordBreak: 'break-word',
        }}>
          {isBot ? (
            <div dangerouslySetInnerHTML={{ __html: renderContent(message.content) }} />
          ) : (
            message.content
          )}
          {isStreaming && (
            <span style={{
              display: 'inline-block',
              width: 8,
              height: 16,
              background: '#10a37f',
              marginLeft: 2,
              verticalAlign: 'middle',
              animation: 'ai-cursor-blink 0.8s ease-in-out infinite',
            }}/>
          )}
        </div>

        {/* Badges */}
        {isBot && !isStreaming && (message.tool || message.source) && (
          <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
            {message.tool && (
              <span className="ai-tool-badge">
                ⚡ {message.tool.split(',')[0].trim().replace(/_/g, ' ')}
              </span>
            )}
            {message.source && (
              <span className="ai-source-badge">
                📖 {message.source.replace('.md', '').replace(/_/g, ' ')}
              </span>
            )}
          </div>
        )}

        {/* Timestamp */}
        {message.timestamp && (
          <div style={{ fontSize: 9.5, color: 'var(--gpt-text-muted,#aaa)', marginTop: 3, textAlign: isBot ? 'left' : 'right' }}>
            {formatTime(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}

function renderContent(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<strong style="display:block;margin-top:8px;font-size:13px">$1</strong>')
    .replace(/^## (.+)$/gm, '<strong style="display:block;margin-top:10px;font-size:14px;color:#10a37f">$1</strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(0,0,0,0.07);padding:1px 4px;border-radius:3px;font-size:11px">$1</code>')
    .replace(/\|(.+)\|/g, (row) => {
      if (/^[\s|:-]+$/.test(row)) return '';
      const cells = row.split('|').filter(Boolean).map(c =>
        `<td style="padding:3px 8px;border:1px solid #e5e5e5;border-collapse:collapse;font-size:11px">${c.trim()}</td>`
      ).join('');
      return `<tr>${cells}</tr>`;
    })
    .replace(/((?:<tr>.+<\/tr>\n?)+)/g, `<table style="border-collapse:collapse;width:100%;margin:6px 0">$1</table>`)
    .replace(/^> (.+)$/gm, '<div style="border-left:3px solid #10a37f;padding:4px 10px;background:rgba(16,163,127,0.06);border-radius:4px;margin:4px 0;font-style:italic;font-size:11.5px">$1</div>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e5e5e5;margin:8px 0"/>')
    .replace(/((?:^- .+$\n?)+)/gm, (block) => {
      const items = block.trim().split('\n').map(l => `<li style="margin:2px 0">${l.replace(/^- /, '').trim()}</li>`).join('');
      return `<ul style="padding-left:16px;margin:4px 0">${items}</ul>`;
    })
    .replace(/((?:^\d+\. .+$\n?)+)/gm, (block) => {
      const items = block.trim().split('\n').map(l => `<li style="margin:2px 0">${l.replace(/^\d+\. /, '').trim()}</li>`).join('');
      return `<ol style="padding-left:16px;margin:4px 0">${items}</ol>`;
    })
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
  return html;
}

function formatTime(ts) {
  try { return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

export default AiChatPanel;
