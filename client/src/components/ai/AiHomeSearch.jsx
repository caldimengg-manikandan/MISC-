// client/src/components/ai/AiHomeSearch.jsx
// Integrated ChatGPT-style search engine for the Dashboard.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, RotateCcw, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import AiMessage from './AiMessage';
import API_BASE_URL from '../../config/api';
import './AiHomeSearch.css';

const SUGGESTIONS = [
  'Show my recent projects',
  'Any upcoming deadlines?',
  'How is scrap factor calculated?',
  'How to export a BOM report?',
];

function AiHomeSearch() {
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [isThinking, setIsThinking]   = useState(false);
  const [streamingMsg, setStreamingMsg] = useState(null);
  const [isExpanded, setIsExpanded]   = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const abortRef       = useRef(null);

  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingMsg, isThinking, isExpanded]);

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('steel_token');
      const res   = await fetch(`${API_BASE_URL}/api/agent/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.history.length > 0) {
        setMessages(data.history.map((m, i) => ({ ...m, id: `hist_${i}` })));
        setIsExpanded(true);
      }
    } catch (_) { /* noop */ }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const sendMessage = useCallback(async (text) => {
    const query = (text || input).trim();
    if (!query || isThinking) return;

    setInput('');
    setIsThinking(true);
    setIsExpanded(true);

    const userMsg = {
      id:        `u_${Date.now()}`,
      role:      'user',
      content:   query,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    const token = localStorage.getItem('steel_token');

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
      const botMsgId = `b_${Date.now()}`;
      setStreamingMsg({ id: botMsgId, role: 'assistant', content: '', timestamp: new Date().toISOString() });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.status === 'streaming') {
              botText += event.text;
              setStreamingMsg(prev => prev ? { ...prev, content: botText } : null);
            } else if (event.status === 'done') {
              botMeta = { tool: event.tool, source: event.source, intent: event.intent };
            }
          } catch (_) {}
        }
      }

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
        content: '⚠️ Connection error. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    }
  }, [input, isThinking]);

  const handleClear = async () => {
    const token = localStorage.getItem('steel_token');
    try { await fetch(`${API_BASE_URL}/api/agent/clear`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch (_) {}
    setMessages([]);
    setStreamingMsg(null);
    setIsThinking(false);
    setIsExpanded(false);
  };

  return (
    <div className={`ai-home-search ${isExpanded ? 'expanded' : ''}`}>
      {/* ── Search Bar Interface ── */}
      <div className="ai-search-container">
        <div className="ai-search-input-wrap">
          <Sparkles className="ai-search-sparkle" size={18} />
          <input
            ref={inputRef}
            type="text"
            className="ai-search-input"
            placeholder="Ask MISC AI anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            disabled={isThinking}
          />
          <button 
            className="ai-search-send"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isThinking}
          >
            <Send size={18} />
          </button>
        </div>

        {/* Suggestions show when not expanded */}
        {!isExpanded && (
          <div className="ai-search-suggestions">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)}>{s}</button>
            ))}
          </div>
        )}
      </div>

      {/* ── Conversational Area (shows when history exists) ── */}
      {isExpanded && (
        <div className="ai-home-conversation">
          <div className="ai-home-conv-header">
            <span>Conversation History</span>
            <div className="ai-home-conv-actions">
              <button onClick={handleClear} title="Clear"><RotateCcw size={14} /></button>
              <button onClick={() => setIsExpanded(false)} title="Collapse"><ChevronUp size={14} /></button>
            </div>
          </div>
          
          <div className="ai-home-messages">
            {messages.map(msg => (
              <AiMessageWrapper key={msg.id} message={msg} isStreaming={false} />
            ))}
            {streamingMsg && <AiMessageWrapper message={streamingMsg} isStreaming={true} />}
            {isThinking && (
              <div className="ai-home-thinking">
                <div className="ai-home-dots"><span/><span/><span/></div>
                <span>Searching knowledge base...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
      
      {/* Toggle to re-expand if closed but has history */}
      {!isExpanded && messages.length > 0 && (
        <button className="ai-home-toggle" onClick={() => setIsExpanded(true)}>
          <ChevronDown size={14} /> Show previous results
        </button>
      )}
    </div>
  );
}

// Reuse styled wrapper logic
function AiMessageWrapper({ message, isStreaming }) {
  const isBot = message.role === 'assistant';
  return (
    <div className={`ai-home-msg ${isBot ? 'bot' : 'user'}`}>
      <div className="ai-home-msg-avatar">{isBot ? '✦' : 'U'}</div>
      <div className="ai-home-msg-content">
        <div className="ai-home-bubble" dangerouslySetInnerHTML={{ __html: renderContent(message.content) }} />
        {isBot && !isStreaming && (message.tool || message.source) && (
          <div className="ai-home-badges">
            {message.tool && <span className="badge-tool">⚡ {message.tool.split(',')[0].replace(/_/g, ' ')}</span>}
            {message.source && <span className="badge-src">📖 {message.source.replace('.md','')}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function renderContent(text) {
  if (!text) return '';
  // Simplify render for dashboard view
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^## (.+)$/gm, '<h3 class="ai-h3">$1</h3>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export default AiHomeSearch;
