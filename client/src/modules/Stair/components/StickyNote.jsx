import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trash2, X, User, Users, GripHorizontal, Check, Tag, Pin, PinOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEstimation } from '../../../contexts/EstimationContext';
import './StickyNote.css';

// Mock user list for @mention (can be replaced with real API call)
const TEAM_MEMBERS = [
  { id: 1, name: 'Admin', initials: 'AD', color: '#6366f1' },
  { id: 2, name: 'John Engineer', initials: 'JE', color: '#10b981' },
  { id: 3, name: 'Sarah Designer', initials: 'SD', color: '#f59e0b' },
  { id: 4, name: 'Mike PM', initials: 'MP', color: '#ef4444' },
  { id: 5, name: 'Lisa QA', initials: 'LQ', color: '#8b5cf6' },
];

const NOTE_COLORS = [
  { label: 'Cyan',   bg: '#e0f7fa', accent: '#006064', border: '#b2ebf2' },
  { label: 'Yellow', bg: '#fffde7', accent: '#f57f17', border: '#fff176' },
  { label: 'Pink',   bg: '#fce4ec', accent: '#880e4f', border: '#f8bbd0' },
  { label: 'Green',  bg: '#e8f5e9', accent: '#1b5e20', border: '#c8e6c9' },
  { label: 'Purple', bg: '#f3e5f5', accent: '#4a148c', border: '#e1bee7' },
  { label: 'White',  bg: '#ffffff', accent: '#334155', border: '#e2e8f0' },
];

export default function StickyNote({ note }) {
  const { updateNote, updateNotePosition, deleteNote } = useEstimation();
  
  // Derive the palette entry from the note's stored bg color
  const getColorScheme = (bg) => NOTE_COLORS.find(c => c.bg === bg) || NOTE_COLORS[0];
  
  const [content, setContent]       = useState(note.content || '');
  const [title, setTitle]           = useState(note.title || 'New Note');
  const [noteType, setNoteType]     = useState(note.note_type || 'personal');
  const [isLocked, setIsLocked]     = useState(note.is_locked || false);
  const [colorScheme, setColorScheme] = useState(() => getColorScheme(note.color));
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMentions, setShowMentions]   = useState(false);
  const [mentionQuery, setMentionQuery]   = useState('');
  const [mentionCursor, setMentionCursor] = useState(0);
  const [isSaving, setIsSaving]     = useState(false);
  const [lastSaved, setLastSaved]   = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging]   = useState(false);

  // Drag position — stored locally to avoid re-renders on every pixel move
  const [pos, setPos] = useState({ x: note.pos_x || 200, y: note.pos_y || 200 });
  const dragStart = useRef(null);
  const cardRef   = useRef(null);
  const textareaRef = useRef(null);
  const saveTimer = useRef(null);

  // Keep in sync if note updates externally
  useEffect(() => {
    setContent(note.content || '');
    setTitle(note.title || 'New Note');
    setNoteType(note.note_type || 'personal');
    setIsLocked(note.is_locked || false);
    setColorScheme(getColorScheme(note.color));
    setPos({ x: note.pos_x || 200, y: note.pos_y || 200 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id, note.is_locked]);

  // ── Debounced auto-save ──────────────────────────────────────────────────────
  const scheduleSave = useCallback((newTitle, newContent, newType, newColor, newLocked) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateNote(note.id, {
          title: newTitle,
          content: newContent,
          note_type: newType,
          color: newColor,
          is_locked: newLocked
        });
        setLastSaved(new Date());
      } finally {
        setIsSaving(false);
      }
    }, 800); // 800ms debounce
  }, [note.id, updateNote]);

  // ── Custom drag: pointer events for smooth behaviour ────────────────────────
  const onPointerDownHeader = (e) => {
    if (isLocked) return; // Prevent drag if locked
    if (e.target.closest('input, button, textarea')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y };
    setIsDragging(true);
  };

  const onPointerMove = (e) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.px;
    const dy = e.clientY - dragStart.current.py;
    setPos({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
  };

  const onPointerUp = async () => {
    if (!dragStart.current) return;
    setIsDragging(false);
    const finalPos = pos;
    dragStart.current = null;
    // Persist position
    try {
      await updateNotePosition(note.id, { pos_x: finalPos.x, pos_y: finalPos.y });
    } catch (err) {
      console.error('Failed to save note position:', err);
    }
  };

  // ── Text content change with @mention detection ──────────────────────────────
  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    scheduleSave(title, val, noteType, colorScheme.bg, isLocked);

    // @mention detection — scan from cursor left to find '@'
    if (noteType === 'general') {
      const cursor = e.target.selectionStart;
      const before = val.slice(0, cursor);
      const match  = before.match(/@(\w*)$/);
      if (match) {
        setMentionQuery(match[1].toLowerCase());
        setShowMentions(true);
        setMentionCursor(0);
      } else {
        setShowMentions(false);
        setMentionQuery('');
      }
    }
  };

  const insertMention = (member) => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart;
    const before = content.slice(0, cursor);
    const after  = content.slice(cursor);
    // Replace the "@query" with "@Name "
    const newBefore = before.replace(/@\w*$/, `@${member.name} `);
    const newContent = newBefore + after;
    setContent(newContent);
    setShowMentions(false);
    scheduleSave(title, newContent, noteType, colorScheme.bg, isLocked);
    // Restore focus
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = newBefore.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const filteredMembers = TEAM_MEMBERS.filter(m =>
    m.name.toLowerCase().includes(mentionQuery)
  );

  // ── Title save on blur ───────────────────────────────────────────────────────
  const handleTitleBlur = () => {
    scheduleSave(title, content, noteType, colorScheme.bg, isLocked);
  };

  // ── Switch note type ─────────────────────────────────────────────────────────
  const handleTypeSwitch = (type) => {
    setNoteType(type);
    scheduleSave(title, content, type, colorScheme.bg, isLocked);
  };

  // ── Change color ─────────────────────────────────────────────────────────────
  const handleColorChange = (scheme) => {
    setColorScheme(scheme);
    setShowColorPicker(false);
    scheduleSave(title, content, noteType, scheme.bg, isLocked);
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await deleteNote(note.id);
  };

  const handleToggleLock = () => {
    const nextLocked = !isLocked;
    setIsLocked(nextLocked);
    scheduleSave(title, content, noteType, colorScheme.bg, nextLocked);
  };

  // Render mentions highlighting in content (purely visual — rendered above textarea)
  const renderHighlightedContent = () => {
    if (!content.includes('@')) return null;
    return content.split(/(@\w+)/g).map((part, i) =>
      part.startsWith('@')
        ? <mark key={i} className="sn-mention-highlight">{part}</mark>
        : <span key={i}>{part}</span>
    );
  };

  // ── Formatted "last saved" display ──────────────────────────────────────────
  const savedLabel = lastSaved
    ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : null;

  return (
    <motion.div
      ref={cardRef}
      className={`sn-card ${isDragging ? 'sn-dragging' : ''} ${isMinimized ? 'sn-minimized' : ''} ${isLocked ? 'sn-locked' : ''}`}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        '--sn-bg': colorScheme.bg,
        '--sn-accent': colorScheme.accent,
        '--sn-border': colorScheme.border,
        zIndex: isDragging ? 2000 : 1100,
        touchAction: 'none',
      }}
      initial={{ opacity: 0, scale: 0.85, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onPointerMove={(e) => {
        if (!isLocked) onPointerMove(e);
      }}
      onPointerUp={(e) => {
        if (!isLocked) onPointerUp(e);
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="sn-header"
        onPointerDown={onPointerDownHeader}
        style={{ cursor: isLocked ? 'default' : isDragging ? 'grabbing' : 'grab' }}
      >
        <GripHorizontal size={12} className="sn-drag-handle" style={{ display: isLocked ? 'none' : 'block' }} />

        <div className={`sn-type-badge ${noteType}`}>
          {noteType === 'personal'
            ? <><User size={10} /> Personal</>
            : <><Users size={10} /> General</>
          }
        </div>

        {note.context_type && note.context_type !== 'global' && (
          <div className="sn-context-badge">
            <Tag size={10} /> {note.context_id ? `${note.context_type} ${note.context_id}` : note.context_type}
          </div>
        )}

        <input
          className="sn-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Note title…"
          onPointerDown={e => e.stopPropagation()}
          maxLength={80}
        />

        <div className="sn-header-actions" onPointerDown={e => e.stopPropagation()}>
          {/* Color picker trigger */}
          <button
            className="sn-icon-btn"
            onClick={() => setShowColorPicker(p => !p)}
            title="Change color"
          >
            <Tag size={12} />
          </button>

          {/* Lock/Unlock */}
          <button
            className={`sn-icon-btn ${isLocked ? 'active' : ''}`}
            onClick={handleToggleLock}
            title={isLocked ? 'Unlock note to move' : 'Lock note in place'}
          >
            {isLocked ? <Pin size={12} style={{ color: '#ef4444' }} /> : <PinOff size={12} />}
          </button>

          {/* Minimize */}
          <button
            className="sn-icon-btn"
            onClick={() => setIsMinimized(p => !p)}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            <span style={{ fontSize: 10, fontWeight: 700, lineHeight: 1 }}>
              {isMinimized ? '▲' : '▬'}
            </span>
          </button>

          {/* Delete */}
          <button className="sn-icon-btn sn-delete-btn" onClick={handleDelete} title="Delete note">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* ── Color Picker Dropdown ────────────────────────────────────────── */}
      <AnimatePresence>
        {showColorPicker && (
          <motion.div
            className="sn-color-picker"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            {NOTE_COLORS.map(scheme => (
              <button
                key={scheme.label}
                className="sn-color-swatch"
                style={{ background: scheme.bg, borderColor: scheme.border }}
                title={scheme.label}
                onClick={() => handleColorChange(scheme)}
                onPointerDown={e => e.stopPropagation()}
              >
                {colorScheme.bg === scheme.bg && <Check size={10} color={scheme.accent} strokeWidth={3} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            className="sn-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onPointerDown={e => e.stopPropagation()}
          >
            <div className="sn-textarea-wrapper">
              <textarea
                ref={textareaRef}
                className="sn-textarea"
                value={content}
                onChange={handleContentChange}
                placeholder={
                  noteType === 'personal'
                    ? 'Write your private note… (visible only to you)'
                    : 'Write a team note… use @ to mention someone'
                }
                spellCheck={false}
              />

              {/* @mention dropdown */}
              <AnimatePresence>
                {showMentions && filteredMembers.length > 0 && (
                  <motion.div
                    className="sn-mentions-list"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                  >
                    <div className="sn-mentions-header">Team members</div>
                    {filteredMembers.map((m, i) => (
                      <button
                        key={m.id}
                        className={`sn-mention-row ${i === mentionCursor ? 'active' : ''}`}
                        onMouseDown={(e) => { e.preventDefault(); insertMention(m); }}
                      >
                        <span className="sn-mention-avatar" style={{ background: m.color }}>
                          {m.initials}
                        </span>
                        <span className="sn-mention-name">{m.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <div className="sn-footer">
              {/* Note type toggle */}
              <div className="sn-type-toggle">
                <button
                  className={`sn-toggle-btn ${noteType === 'personal' ? 'active' : ''}`}
                  onClick={() => handleTypeSwitch('personal')}
                >
                  <User size={10} /> Personal
                </button>
                <button
                  className={`sn-toggle-btn ${noteType === 'general' ? 'active' : ''}`}
                  onClick={() => handleTypeSwitch('general')}
                >
                  <Users size={10} /> General
                </button>
              </div>

              {/* Save status */}
              <div className="sn-save-status">
                {isSaving ? (
                  <span className="sn-status-saving">
                    <span className="sn-saving-dot" />
                    Saving…
                  </span>
                ) : savedLabel ? (
                  <span className="sn-status-saved">
                    <Check size={9} strokeWidth={3} /> {savedLabel}
                  </span>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
