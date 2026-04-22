// client/src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  format, startOfWeek, endOfWeek, isSameMonth, isSameDay,
  addMonths, subMonths, startOfMonth, endOfMonth, isToday
} from 'date-fns';
import { 
  ChevronLeft, ChevronRight, Search, ArrowRight, Send, Plus,
  FileText, HardDrive, Globe, Palette, Lightbulb, Zap,
  Calculator, Scale, List, Layout, X, FolderOpen,
  Copy, ThumbsUp, ThumbsDown, Share2, RotateCcw, MoreHorizontal, Check
} from 'lucide-react';
import { useEstimation } from '../../contexts/EstimationContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/api';
import './EstimationDashboard.css';
import './AiDashboard.css';

// ── FAQ suggestion cards ────────────────────────────────────────────────────
const FAQ_CARDS = [
  { icon: <Calculator size={18} className="text-blue" />, title: 'Scrap factor', desc: 'How is scrap factor calculated for stairs?', highlight: false },
  { icon: <Scale size={18} className="text-amber" />, title: 'Stair weight', desc: 'Calculate stair weight for 500 lbs', highlight: true },
  { icon: <List size={18} className="text-orange" />, title: 'Recent projects', desc: 'Show my recent projects and status', highlight: false },
  { icon: <Layout size={18} className="text-green" />, title: 'Stringer logic', desc: 'Explain stringer diagonal factor', highlight: false },
];

// ── Markdown renderer ───────────────────────────────────────────────────────
function renderContent(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/((?:^- .+$\n?)+)/gm, (block) => {
      const items = block.trim().split('\n').map(l => `<li>${l.replace(/^- /, '').trim()}</li>`).join('');
      return `<ul>${items}</ul>`;
    })
    .replace(/((?:^\d+\. .+$\n?)+)/gm, (block) => {
      const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '').trim()}</li>`).join('');
      return `<ol>${items}</ol>`;
    })
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

// ── Sub-Components ─────────────────────────────────────────────────────────

// 1. Plus Menu Popover
const PlusMenu = ({ isOpen, onClose, onSelect }) => {
  const menuRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    { id: 'drawings', icon: <FileText size={16} />, label: 'Upload Drawings' },
    { id: 'specs', icon: <List size={16} />, label: 'Project Specs' },
    { id: 'database', icon: <HardDrive size={16} />, label: 'Pricing Database' },
    { id: 'standards', icon: <Globe size={16} />, label: 'Industry Standards' },
    { id: 'thinking', icon: <Lightbulb size={16} />, label: 'Technical Thinking' },
    { id: 'deep', icon: <Zap size={16} />, label: 'Deep Estimation' },
  ];

  return (
    <div className="plus-menu-popover" ref={menuRef}>
      {items.map(it => (
        <button key={it.id} className="plus-menu-item" onClick={() => onSelect(it.label, it.id)}>
          <span className="plus-menu-icon">{it.icon}</span>
          <span className="plus-menu-label">{it.label}</span>
        </button>
      ))}
    </div>
  );
};

// 2. Chat Message Bubble
const ChatMessage = ({ msg, isBot, userInitials, isStreaming, onRegenerate }) => {
  const [copied, setCopied] = React.useState(false);
  const [feedback, setFeedback] = React.useState(null); // 'up' or 'down'

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (type) => {
    setFeedback(type);
    // In a real app, send to API here
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'MISC AI Response', text: msg.content, url: window.location.href });
    } else {
      handleCopy();
    }
  };

  return (
    <div className={`dcp-msg-row ${isBot ? 'assistant' : 'user'}`} style={{ animation: 'dcp-fade-in 0.3s ease-out' }}>
      {isBot && (
        <div className={`dcp-av bot ${isStreaming ? 'ai-avatar-thinking' : ''}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.83 8.39L22 12L14.83 15.61L12 22L9.17 15.61L2 12L9.17 8.39L12 2Z" fill="white"/>
          </svg>
        </div>
      )}
      
      <div className="dcp-msg-content-wrap">
        <div className={`dcp-bubble ${isBot ? 'bot' : 'usr'}`}>
          {isBot ? (
            <div className="markdown-content">
              <div dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
              {isStreaming && <span className="ai-cursor" />}
            </div>
          ) : (
            <div className="user-content">
              {msg.content}
              {msg.attachments?.map((f, idx) => (
                <div key={idx} className="msg-attachment-pill">
                  <FileText size={12} /> <span>{f.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ChatGPT Actions Bar */}
        {isBot && !isStreaming && msg.content && (
          <div className="dcp-bot-actions">
            <button onClick={handleCopy} title="Copy" className="dcp-action-btn">
              {copied ? <Check size={14} style={{color: '#10a37f'}} /> : <Copy size={14} />}
            </button>
            <button 
              onClick={() => handleFeedback('up')} 
              title="Good response" 
              className={`dcp-action-btn ${feedback === 'up' ? 'active' : ''}`}
            >
              <ThumbsUp size={14} fill={feedback === 'up' ? 'currentColor' : 'none'} />
            </button>
            <button 
              onClick={() => handleFeedback('down')} 
              title="Bad response" 
              className={`dcp-action-btn ${feedback === 'down' ? 'active' : ''}`}
            >
              <ThumbsDown size={14} fill={feedback === 'down' ? 'currentColor' : 'none'} />
            </button>
            <button onClick={handleShare} title="Share" className="dcp-action-btn">
              <Share2 size={14} />
            </button>
            <button onClick={onRegenerate} title="Regenerate" className="dcp-action-btn">
              <RotateCcw size={14} />
            </button>
            <button title="More" className="dcp-action-btn">
              <MoreHorizontal size={14} />
            </button>
          </div>
        )}
      </div>

      {!isBot && <div className="dcp-av usr">{userInitials}</div>}
    </div>
  );
};

// 3. File Modal (ChatGPT Lightbox style)
const FileModal = ({ file, onClose }) => {
  const isImage = file?.type?.startsWith('image/');
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!file) return null;

  return (
    <div className="file-modal-overlay" onClick={onClose}>
      <div className="file-modal-content" onClick={e => e.stopPropagation()}>
        <button className="file-modal-close" onClick={onClose}><X size={20} /></button>
        <div className="file-modal-body">
          {isImage ? (
            <img src={url} alt="preview" className="file-modal-img" />
          ) : (
            <div className="file-modal-doc">
              <FileText size={64} color="#10a37f" />
              <div className="file-modal-doc-info">
                <h3>{file.name}</h3>
                <p>{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 4. File Card (Single Unit)
const FileCard = ({ file, onRemove, onPreview }) => {
  const isImage = file.type?.startsWith('image/');
  const [thumb, setThumb] = useState(null);

  useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setThumb(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  return (
    <div className="file-card-mini" onClick={onPreview}>
      <div className="fcm-icon">
        {isImage && thumb ? (
          <img src={thumb} alt="preview" className="fcm-thumb" />
        ) : (
          <FileText size={18} />
        )}
      </div>
      <div className="fcm-info">
        <div className="fcm-name">{file.name}</div>
        <div className="fcm-size">{(file.size / 1024).toFixed(1)} KB</div>
      </div>
      <button 
        type="button" 
        className="fcm-remove" 
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
      >
        <X size={14} />
      </button>
    </div>
  );
};

// 5. File Preview Strip
const FilePreview = ({ files, onRemove, onPreview }) => {
  if (!files || files.length === 0) return null;
  return (
    <div className="file-preview-strip">
      {files.map((file, idx) => (
        <FileCard 
          key={idx} 
          file={file} 
          onRemove={() => onRemove(idx)} 
          onPreview={() => onPreview(file)}
        />
      ))}
    </div>
  );
};

// 6. Chat Input Bar
const ChatInput = ({ input, setInput, onSend, isThinking, onPlusClick, isMenuOpen, onMenuClose, onMenuSelect, attachedFiles, onRemoveFile, onPreviewFile }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
    const handleGlobalKey = (e) => { 
      if (e.key === '/' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') { 
        e.preventDefault(); 
        textareaRef.current?.focus(); 
      } 
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="dcp-inputbar">
      <div className="dcp-input-inner">
        <div className="dcp-input-payload">
          <FilePreview files={attachedFiles} onRemove={onRemoveFile} onPreview={onPreviewFile} />
          <div className="dcp-input-pill">
            <PlusMenu isOpen={isMenuOpen} onClose={onMenuClose} onSelect={onMenuSelect} />
            <button type="button" className="dcp-pill-plus" onClick={(e) => { e.stopPropagation(); onPlusClick(); }}>
              <Plus size={18} />
            </button>
            <textarea
              ref={textareaRef}
              className="dcp-input"
              placeholder="Ask anything about estimation..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck="false"
              rows={1}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
              }}
            />
            <button 
              type="button"
              className="dcp-send" 
              onClick={onSend} 
              disabled={isThinking || (!input.trim() && attachedFiles.length === 0)}
            >
              {isThinking ? <Zap size={16} /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Dashboard ──────────────────────────────────────────────────────────
export default function EstimationDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user }  = useAuth();
  const { dashboardStats, estimations, loading, fetchDashboardStats, fetchEstimations } = useEstimation();

  const [chatMode, setChatMode]         = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isCalExpanded, setIsCalExpanded] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  // Chat state
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState('');
  const [isThinking, setIsThinking]     = useState(false);
  const [streamingMsg, setStreamingMsg] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [previewFile, setPreviewFile]     = useState(null);
  const [recentChats, setRecentChats]     = useState([]);

  const messagesEndRef = useRef(null);
  const abortRef       = useRef(null);
  const fileInputRef   = useRef(null);

  const handlePlusSelect = (label, id) => {
    if (id === 'drawings') {
      fileInputRef.current?.click();
    } else {
      setInput(prev => prev + ' ' + label + ': ');
    }
    setIsPlusMenuOpen(false);
  };

  const handleMainFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) setAttachedFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const handleRemoveFile = (idx) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchDashboardStats();
    fetchEstimations();
    fetchRecentChats();
  }, []);

  useEffect(() => {
    const params    = new URLSearchParams(location.search);
    const urlChatId = params.get('chatId');
    if (urlChatId) { loadThread(urlChatId); setChatMode(true); }
    else if (!location.search) { setChatMode(false); setMessages([]); setActiveChatId(null); }
  }, [location.search]);

  useEffect(() => {
    if (chatMode) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, streamingMsg, isThinking, chatMode]);

  // ── API ───────────────────────────────────────────────────────────────────
  const getToken = () => localStorage.getItem('steel_token');
  const refreshSidebarChats = () => window.dispatchEvent(new CustomEvent('chat:refresh'));

  const fetchRecentChats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/threads`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) setRecentChats(data.threads || []);
    } catch (_) {}
  };

  useEffect(() => {
    const handler = () => fetchRecentChats();
    window.addEventListener('chat:refresh', handler);
    return () => window.removeEventListener('chat:refresh', handler);
  }, []);

  const loadThread = async (id) => {
    setActiveChatId(id);
    try {
      const res  = await fetch(`${API_BASE_URL}/api/agent/threads/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (data.success) setMessages(data.history || []);
    } catch (_) {}
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (textArg) => {
    // If called via onClick, textArg is an Event object.
    const text = typeof textArg === 'string' ? textArg : '';
    const query = (text || input || '').trim();

    if (!query && attachedFiles.length === 0) return;
    if (isThinking) return;

    setChatMode(true);
    const filesToUpload = [...attachedFiles];
    setAttachedFiles([]);
    setInput('');
    setIsThinking(true);

    const userMsg = { 
      role: 'user', 
      content: query || "Attached drawings for analysis.", 
      timestamp: new Date().toISOString(),
      attachments: filesToUpload.map(f => ({ name: f.name, size: f.size }))
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const res = await fetch(`${API_BASE_URL}/api/agent/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ message: query, chatId: activeChatId, userName: user?.name }),
        signal:  ctrl.signal,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '', botText = '', botMeta = {};

      setIsThinking(false);
      setStreamingMsg({ role: 'assistant', content: '', timestamp: new Date().toISOString() });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.status === 'streaming') { 
              botText += ev.text; 
              setStreamingMsg(p => p ? { ...p, content: botText } : null); 
            }
            else if (ev.status === 'error') {
              botText = ev.text || '⚠️ An error occurred during the request.';
            }
            else if (ev.status === 'done') botMeta = { tool: ev.tool, source: ev.source, chatId: ev.chatId };
          } catch (_) {}
        }
      }

      setStreamingMsg(null);
      const finalBotText = botText || '⚠️ I encountered an unexpected issue and couldn\'t generate a response. Please try rephrasing your question.';
      setMessages(prev => [...prev, { role: 'assistant', content: finalBotText, timestamp: new Date().toISOString(), ...botMeta }]);

      if (!activeChatId && botMeta.chatId) {
        setActiveChatId(botMeta.chatId);
        navigate(`/dashboard?chatId=${botMeta.chatId}`, { replace: true });
        refreshSidebarChats();
      }

    } catch (err) {
      if (err.name === 'AbortError') return;
      setIsThinking(false);
      setStreamingMsg(null);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.', timestamp: new Date().toISOString() }]);
    }
  }, [input, isThinking, activeChatId, navigate]);

  const handleBackToDashboard = () => {
    abortRef.current?.abort();
    setChatMode(false);
    setMessages([]);
    setSelectedDate(null);
    setStreamingMsg(null);
    setIsThinking(false);
    setActiveChatId(null);
    navigate('/dashboard', { replace: true });
  };

  // ── Calendar ───────────────────────────────────────────────────────────────
  const nextMonth = (e) => { e.stopPropagation(); setCurrentMonth(addMonths(currentMonth, 1)); };
  const prevMonth = (e) => { e.stopPropagation(); setCurrentMonth(subMonths(currentMonth, 1)); };
  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(monthStart);
  const startDate  = startOfWeek(monthStart);
  const endDate    = endOfWeek(monthEnd);

  const renderCalendar = () => {
    const rows = []; let days = []; let day = startDate;
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay    = day;
        const fmtDate     = format(day, 'd');
        const dayProjects = estimations.filter(p => p.dueDate && isSameDay(new Date(p.dueDate), cloneDay));
        const isSelected = selectedDate && isSameDay(cloneDay, selectedDate);
        const count = dayProjects.length;

        days.push(
          <div 
            className={`cal-cell ${!isSameMonth(day, monthStart) ? 'disabled' : ''} ${isToday(day) ? 'today' : ''} ${isSelected ? 'selected' : ''}`} 
            key={day.toString()}
            onClick={(e) => { 
              e.stopPropagation(); 
              if (isSelected) {
                setSelectedDate(null);
                setIsCalExpanded(false);
              } else {
                setSelectedDate(cloneDay);
                setIsCalExpanded(true);
              }
            }}
          >
            <span className="cal-number">{fmtDate}</span>
            {count > 0 && (
              <div className="cal-badge-wrap" title={`${count} projects due`}>
                <span className="cal-count-badge">
                  {count} <span className="cal-count-text">new</span>
                </span>
              </div>
            )}
          </div>
        );
        day = new Date(day.setDate(day.getDate() + 1));
      }
      rows.push(<div className="cal-row" key={day.toString()}>{days}</div>);
      days = [];
    }
    return (
      <div className="calendar-widget">
        <div className="cal-days-header">
          <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div>
          <div>THU</div><div>FRI</div><div>SAT</div>
        </div>
        <div className="cal-body">{rows}</div>
      </div>
    );
  };

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const showWelcome = messages.length === 0 && !isThinking && !streamingMsg;

  const renderPipelineMetrics = () => {
    const stats = [
      { label: 'New', value: dashboardStats.NEW, color: 'blue' },
      { label: 'Assigned', value: dashboardStats.ASSIGNED, color: 'amber' },
      { label: 'In Progress', value: dashboardStats.IN_PROGRESS, color: 'orange' },
      { label: 'Submitted', value: dashboardStats.SUBMITTED, color: 'green' },
    ];
    return (
      <div className="metrics-container grid">
        {stats.map(s => (
          <div key={s.label} className={`metric-card card-${s.color}`}>
            <div className={`metric-value text-${s.color}`}>{s.value || 0}</div>
            <div className="metric-label">{s.label}</div>
          </div>
        ))}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAT MODE
  // ═══════════════════════════════════════════════════════════════════════════
  if (chatMode) {
    const displayedRecentProjects = estimations.filter(p => !p.isPinned && !p.isArchived).slice(0, 5);

    return (
      <div className="dash-chat-page">
        <FileModal file={previewFile} onClose={() => setPreviewFile(null)} />
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleMainFileChange} 
          accept=".pdf,.dwg,.zip,.jpg,.png" 
        />
        
        <div className="misc-chat-sidebar">
          <div className="mcs-top-actions">
            <button className="mcs-action-btn" onClick={() => { setMessages([]); setActiveChatId(null); navigate('/dashboard', { replace: true }); }}>
              <Plus size={14} /> New chat
            </button>
            <button className="mcs-action-btn">
              <Search size={14} /> Search chats
            </button>
            <button className="mcs-action-btn">
              <div style={{fontWeight: 700, letterSpacing: '1px'}}>...</div> More
            </button>
          </div>
          
          <div className="mcs-section">
            <div className="mcs-section-title">Projects</div>
            <button className="mcs-action-btn" style={{padding: '6px 12px', fontSize: '13px'}} onClick={() => navigate('/project-info')}>
              <FolderOpen size={14} /> New project
            </button>
            {displayedRecentProjects.map(p => (
              <div key={p.id} className="mcs-list-item" onClick={() => navigate(`/project-info?id=${p.id}`)}>
                <FolderOpen size={14} /> <span>{p.projectName || 'Project'}</span>
              </div>
            ))}
          </div>

          <div className="mcs-section">
            <div className="mcs-section-title">Recents</div>
            {recentChats.slice(0, 8).map(chat => (
              <div key={chat.id} className="mcs-list-item" onClick={() => navigate(`/dashboard?chatId=${chat.id}`)}>
                <span style={{opacity: 0.5, fontSize: '10px'}}>💬</span> <span>{chat.title || 'New Conversation'}</span>
              </div>
            ))}
          </div>

          <div className="mcs-footer">
            <button className="mcs-action-btn" onClick={() => navigate('/profile')}>
              <div className="dcp-av usr">{userInitials}</div> {user?.name || 'User Profile'}
            </button>
          </div>
        </div>

        <div className="dcp-chat-container">
          <header className="dcp-topbar">
            <button className="dcp-back" onClick={handleBackToDashboard}>← Dashboard</button>
            <div className="dcp-header-title">MISC Assistance</div>
            <div style={{width: 60}} />
          </header>

          <main className="dcp-thread">
          <div className="dcp-messages-container">
            {showWelcome && (
              <div className="dcp-welcome">
                <h1 className="dcp-welcome-title">How can I help you today, {user?.name?.split(' ')[0] || 'there'}?</h1>
                <p className="dcp-welcome-sub">Ask about scrap factors, weights, or current project statuses.</p>
                <div className="dcp-faq-grid">
                  {FAQ_CARDS.map((c, i) => (
                    <button key={i} className="dcp-faq-card" onClick={() => sendMessage(c.desc)}>
                      <div className="dash-faq-icon">{c.icon}</div>
                      <div className="dcp-faq-content">
                        <div className="dcp-faq-title">{c.title}</div>
                        <div className="dcp-faq-desc">{c.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="dcp-messages-wrap">
              {messages.map((msg, i) => (
                <ChatMessage 
                  key={i} 
                  msg={msg} 
                  isBot={msg.role === 'assistant'} 
                  userInitials={userInitials} 
                  onRegenerate={() => {
                    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                    if (lastUserMsg) sendMessage(lastUserMsg.content);
                  }}
                />
              ))}

              {streamingMsg && (
                <ChatMessage msg={streamingMsg} isBot={true} userInitials={userInitials} isStreaming={true} />
              )}

              {isThinking && (
                <div className="dcp-msg-row assistant">
                  <div className="dcp-av bot ai-avatar-thinking">AI</div>
                  <div className="typing-indicator"><span></span><span></span><span></span></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </main>

        <ChatInput 
          input={input} 
          setInput={setInput} 
          onSend={sendMessage} 
          isThinking={isThinking}
          onPlusClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
          isMenuOpen={isPlusMenuOpen}
          onMenuClose={() => setIsPlusMenuOpen(false)}
          onMenuSelect={handlePlusSelect}
          attachedFiles={attachedFiles}
          onRemoveFile={handleRemoveFile}
          onPreviewFile={setPreviewFile}
        />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD MODE
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="dashboard-root">
      <FileModal file={previewFile} onClose={() => setPreviewFile(null)} />
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleMainFileChange} 
        accept=".pdf,.dwg,.zip,.jpg,.png" 
      />
      <div className="dash-hero">
        <h1 className="dash-hero-title">Where should we begin?</h1>

        <div className="dash-pill-wrap">
          <div className="dash-pill-payload-container">
            <FilePreview files={attachedFiles} onRemove={handleRemoveFile} onPreview={setPreviewFile} />
            <div className="dash-pill">
              <PlusMenu 
                isOpen={isPlusMenuOpen} 
                onClose={() => setIsPlusMenuOpen(false)} 
                onSelect={handlePlusSelect} 
              />
              <button type="button" className="dash-pill-plus-btn" onClick={(e) => { e.stopPropagation(); setIsPlusMenuOpen(!isPlusMenuOpen); }}>
                <Plus size={18} />
              </button>
              <textarea
                className="dash-pill-input"
                placeholder="Ask anything about estimation..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                rows={1}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'; }}
              />
              <button className="dash-pill-send" onClick={sendMessage} disabled={!input.trim() && attachedFiles.length === 0}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="dash-faq-grid">
          {FAQ_CARDS.map((c, i) => (
            <button key={i} className="dash-faq-card" onClick={() => sendMessage(c.desc)}>
              <div className="dash-faq-icon">{c.icon}</div>
              <div className="dash-faq-text-wrap">
                <span className="dash-faq-title">{c.title}</span>
                <span className="dash-faq-desc">{c.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="dash-overview">
        <div className="biz-title">☰ Business Overview</div>
        <div className="ems-dashboard mt-0">
          <div className="ems-layout">
            <div className="ems-col-left">
              <div className={`ems-panel cal-panel modern-card ${isCalExpanded ? 'expanded' : ''}`}>
                <div className="cal-header">
                  <button onClick={prevMonth}><ChevronLeft size={16} /></button>
                  <h2>{format(currentMonth, 'MMM yyyy')}</h2>
                  <button onClick={nextMonth}><ChevronRight size={16} /></button>
                </div>
                {renderCalendar()}
                {selectedDate && isCalExpanded && (
                  <div className="cal-details-expand">
                    <div className="cal-details-divider" />
                    <h4 className="cal-details-title">Details for {format(selectedDate, 'dd MMMM')}</h4>
                    <ul className="cal-details-list">
                      {estimations.filter(p => p.dueDate && isSameDay(new Date(p.dueDate), selectedDate)).map(p => (
                        <li key={p.id} className="cal-detail-item" onClick={(e) => { e.stopPropagation(); navigate('/project-info?id=' + p.id); }}>
                          <span className={`status-dot dot-${p.status?.toLowerCase()}`} />
                          <span className="detail-name">{p.projectName}</span>
                          <span className="detail-status">{p.status}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="ems-panel modern-card">
                <h3 className="panel-title mb-4">Monthly Pipeline</h3>
                {renderPipelineMetrics()}
              </div>
            </div>
            <div className="ems-col-right">
              <div className="ems-panel table-panel modern-card">
                <div className="table-header">
                  <div className="search-bar">
                    <Search size={14} />
                    <input type="text" placeholder="Search project, customer..." />
                  </div>
                </div>
                <div className="ems-table-wrap">
                  <table className="ems-table">
                    <thead>
                      <tr><th>Project</th><th>Customer</th><th>Status</th><th>Deadline</th><th></th></tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="5" className="t-center">Loading…</td></tr>
                      ) : estimations.length === 0 ? (
                        <tr><td colSpan="5" className="t-center">No estimations found.</td></tr>
                      ) : (
                        estimations.slice(0, 8).map(p => (
                          <tr key={p.id}>
                            <td className="t-name">{p.projectName}</td>
                            <td>{p.customer_name || '—'}</td>
                            <td><span className={`status-badge badge-${p.status?.toLowerCase()}`}>{p.status}</span></td>
                            <td className="t-date">{p.dueDate ? format(new Date(p.dueDate), 'dd-MMM') : '—'}</td>
                            <td><button className="btn-go" onClick={() => navigate('/project-info?id=' + p.id)}><ArrowRight size={14} /></button></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
