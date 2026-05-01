import React, { useState, useRef, useEffect } from 'react';
import {
  FileCode2, Megaphone, Clock,
  MessageSquare, Sun, Moon, Monitor, X, Download, PlusSquare, Image as ImageIcon,
  Trash2, RotateCcw, Calculator, UploadCloud, ChevronRight, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEstimation } from '../../../contexts/EstimationContext';
import JobberCalculatorModal from './JobberCalculatorModal';
import './ToolsDock.css';

export default function ToolsDock() {
  const { 
    addNote, selectedEstimation, activeContext, setActiveContext,
    trashNotes, fetchTrashNotes, restoreNote, permanentlyDeleteNote, notes
  } = useEstimation();
  const [activePopover, setActivePopover] = useState(null);
  const [isDockVisible, setIsDockVisible] = useState(true);
  const dockRef = useRef(null);

  // Close any open popover when clicking outside the dock
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activePopover && dockRef.current && !dockRef.current.contains(e.target)) {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePopover]);
  const [showCalc, setShowCalc] = useState(false); // Jobber Calculator modal
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('themeMode') || 'light');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('accentColor') || '#10a37f');
  const [localAttachments, setLocalAttachments] = useState({ images: [], documents: [] });

  const ACCENT_COLORS = [
    { id: 'teal',    color: '#10a37f', hover: '#0e8f6e', light: 'rgba(16,163,127,0.12)' },
    { id: 'blue',    color: '#3B82F6', hover: '#2563EB', light: 'rgba(59,130,246,0.12)'  },
    { id: 'indigo',  color: '#6366F1', hover: '#4F46E5', light: 'rgba(99,102,241,0.12)'  },
    { id: 'violet',  color: '#8B5CF6', hover: '#7C3AED', light: 'rgba(139,92,246,0.12)'  },
    { id: 'pink',    color: '#EC4899', hover: '#DB2777', light: 'rgba(236,72,153,0.12)'   },
    { id: 'red',     color: '#EF4444', hover: '#DC2626', light: 'rgba(239,68,68,0.12)'    },
    { id: 'orange',  color: '#F97316', hover: '#EA580C', light: 'rgba(249,115,22,0.12)'  },
    { id: 'amber',   color: '#F59E0B', hover: '#D97706', light: 'rgba(245,158,11,0.12)'  },
    { id: 'lime',    color: '#84CC16', hover: '#65A30D', light: 'rgba(132,204,22,0.12)'  },
    { id: 'cyan',    color: '#06B6D4', hover: '#0891B2', light: 'rgba(6,182,212,0.12)'   },
  ];

  // Apply accent color to CSS variables whenever it changes
  React.useEffect(() => {
    localStorage.setItem('accentColor', accentColor);
    const found = ACCENT_COLORS.find(a => a.color === accentColor) || ACCENT_COLORS[0];
    const root = document.documentElement;
    root.style.setProperty('--gpt-accent', found.color);
    root.style.setProperty('--gpt-accent-hover', found.hover);
    root.style.setProperty('--gpt-accent-light', found.light);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accentColor]);
  const [isDragging, setIsDragging] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, dm = 2, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const processDropFiles = (files) => {
    files.forEach(file => {
      const isImg = file.type.startsWith('image/');
      const obj = { 
        id: Math.random().toString(36).substr(2, 9), 
        name: file.name, 
        url: URL.createObjectURL(file),
        size: formatFileSize(file.size),
        type: file.type
      };
      if (isImg) setLocalAttachments(p => ({ ...p, images: [...p.images, obj] }));
      else setLocalAttachments(p => ({ ...p, documents: [...p.documents, obj] }));
    });
  };

  const removeAttachment = (type, id) => {
    setLocalAttachments(p => ({
      ...p,
      [type]: p[type].filter(f => f.id !== id)
    }));
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processDropFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Effect to apply body class based on theme preference
  React.useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
    
    const applyTheme = () => {
      const isDark = themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (!isDark) {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
      } else {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
      }
    };

    applyTheme();

    // Listen for system changes if system mode is active
    let mediaQuery;
    if (themeMode === 'system') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', applyTheme);
    }
    return () => {
      if (mediaQuery) mediaQuery.removeEventListener('change', applyTheme);
    };
  }, [themeMode]);

  const handleAddNote = async () => {
    // Note: We no longer return early if !selectedEstimation?.id, allowing notes in Draft Mode
    
    // Add cascading offset so multiple notes don't spawn completely invisible under each other
    const noteCount = notes?.length || 0;
    const cascadeOffset = (noteCount % 10) * 30; // Shift 30px down and right per existing note (loops every 10)
    
    // Spawn note near centre of visible viewport, accounting for sidebar (~260px) and dock (~52px)
    const spawnX = Math.round((window.innerWidth - 260 - 52) / 2 + 260 - 150) + cascadeOffset;
    const spawnY = Math.round(window.innerHeight / 2 - 120) + cascadeOffset;
    try {
      await addNote({
        projectId: selectedEstimation?.id || null,
        title: 'New Note',
        content: '',
        note_type: 'personal',
        pos_x: spawnX,
        pos_y: spawnY,
      });
    } catch (err) {
      console.error('Failed to spawn note:', err);
    }
  };

  const togglePopover = (popover) => {
    const nextValue = activePopover === popover ? null : popover;
    setActivePopover(nextValue);
    
    // Auto-fetch trash when opening trash popover
    if (nextValue === 'trash' && selectedEstimation?.id) {
      fetchTrashNotes(selectedEstimation.id);
    }
  };

  return (
    <>
      <div 
        className="tdk-root" 
        ref={dockRef}
        style={{ transform: isDockVisible ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <button 
          className="tdk-toggle-btn"
          onClick={() => setIsDockVisible(!isDockVisible)}
        >
          {isDockVisible ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        
        {/* Top Group */}
        <div className="tdk-group">
          <ToolIcon icon={Download} tip="Download package" />
        </div>

        {/* Middle Group */}
        <div className="tdk-group">
          
          {/* External Viewer */}
          <div className="tdk-wrapper">
            <button 
              className={`tdk-btn ${activePopover === 'attachments' ? 'active' : ''}`}
              onMouseEnter={(e) => injectTooltip(e, 'Attachment Viewer')}
              onMouseLeave={removeTooltip}
              onClick={() => togglePopover('attachments')}
            >
              <FileCode2 size={16} />
            </button>
          </div>

          {/* Sticky Notes */}
          <div className="tdk-wrapper">
            <button 
              className={`tdk-btn ${activePopover === 'notes' ? 'active' : ''}`}
              onMouseEnter={(e) => injectTooltip(e, `Add Note to ${activeContext.label}`)}
              onMouseLeave={removeTooltip}
              onClick={handleAddNote}
              style={{ position: 'relative' }}
            >
              <PlusSquare size={16} className="tdk-accent-yellow" />
            </button>
            
            {activeContext.type !== 'global' && (
              <div className="tdk-context-chip">
                {activeContext.label}
              </div>
            )}
          </div>

          {/* Jobber Construction Calculator */}
          <div className="tdk-wrapper">
            <button 
              className={`tdk-btn ${showCalc ? 'active' : ''}`}
              onMouseEnter={(e) => injectTooltip(e, 'Jobber Construction Calculator')}
              onMouseLeave={removeTooltip}
              onClick={() => setShowCalc(true)}
            >
              <Calculator size={16} />
            </button>
          </div>

          <ToolIcon icon={Megaphone} tip="Announcements" dot={true} />
          
          {/* Trash Bin */}
          <div className="tdk-wrapper">
            <button 
              className={`tdk-btn ${activePopover === 'trash' ? 'active' : ''}`}
              onMouseEnter={(e) => injectTooltip(e, 'Trash Bin (7-day retention)')}
              onMouseLeave={removeTooltip}
              onClick={() => togglePopover('trash')}
            >
              <Trash2 size={16} />
              {trashNotes.length > 0 && <span className="tdk-count-badge" title={`${trashNotes.length} Trashed Items`}>{trashNotes.length}</span>}
            </button>

            {/* Trash Popover */}
            <AnimatePresence>
              {activePopover === 'trash' && (
                <motion.div
                  className="tdk-popover tdk-pop-trash"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 5 }}
                >
                  <div className="tdk-trash-panel">
                    <div className="tdk-trash-header">
                      <span>Trash Bin</span>
                      <button onClick={() => setActivePopover(null)}><X size={12} /></button>
                    </div>
                    <div className="tdk-trash-body">
                      {trashNotes.length === 0 ? (
                        <div className="tdk-empty-trash">Your trash is empty.</div>
                      ) : (
                        <div className="tdk-trash-list">
                          <div className="tdk-retention-notice">Items are purged after 7 days</div>
                          {trashNotes.map(note => (
                            <div key={note.id} className="tdk-trash-item">
                              <div className="tdk-ti-info">
                                <div className="tdk-ti-title">{note.title || 'Untitled Note'}</div>
                                <div className="tdk-ti-date">Deleted {new Date(note.deleted_at).toLocaleDateString()}</div>
                              </div>
                              <div className="tdk-ti-actions">
                                <button onClick={() => restoreNote(note.id)} title="Restore"><RotateCcw size={14} /></button>
                                <button onClick={() => permanentlyDeleteNote(note.id)} className="tdk-btn-hard-delete" title="Delete permanently"><Trash2 size={14} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <ToolIcon icon={Clock} tip="History Log" />
        </div>

        {/* Bottom Group */}
        <div className="tdk-group">
          
          {/* Appearance Menu */}
          <div className="tdk-wrapper">
            <button 
              className={`tdk-btn ${activePopover === 'appearance' ? 'active' : ''}`}
              onMouseEnter={(e) => injectTooltip(e, 'Appearance')}
              onMouseLeave={removeTooltip}
              onClick={() => togglePopover('appearance')}
            >
              {themeMode === 'light' ? <Sun size={16} /> : themeMode === 'dark' ? <Moon size={16} /> : <Monitor size={16}/>}
            </button>

            {/* Menu Popover */}
            <AnimatePresence>
              {activePopover === 'appearance' && (
                <motion.div
                  className="tdk-popover tdk-pop-menu"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 5 }}
                >
                  <div className="tdk-menu-panel" style={{ minWidth: '220px' }}>
                    <div className="tdk-menu-header">Appearance</div>
                    <button className={`tdk-menu-item ${themeMode === 'system' ? 'active' : ''}`} onClick={() => setThemeMode('system')}>
                      <Monitor size={14} /> Use system settings
                    </button>
                    <div className="tdk-menu-divider" />
                    <button className={`tdk-menu-item ${themeMode === 'light' ? 'active' : ''}`} onClick={() => setThemeMode('light')}>
                      <Sun size={14} /> Light mode
                    </button>
                    <button className={`tdk-menu-item ${themeMode === 'dark' ? 'active' : ''}`} onClick={() => setThemeMode('dark')}>
                      <Moon size={14} /> Night mode
                    </button>
                    <div className="tdk-menu-divider" />
                    <div style={{ padding: '6px 10px 4px', fontSize: '10px', fontWeight: 700, color: 'var(--gpt-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Theme Color</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '6px 10px 10px' }}>
                      {ACCENT_COLORS.map(({ id, color }) => (
                        <button
                          key={id}
                          onClick={() => setAccentColor(color)}
                          title={id.charAt(0).toUpperCase() + id.slice(1)}
                          style={{
                            width: '22px', height: '22px', borderRadius: '50%',
                            background: color, border: 'none', cursor: 'pointer',
                            outline: accentColor === color ? `2px solid ${color}` : '2px solid transparent',
                            outlineOffset: '2px',
                            transform: accentColor === color ? 'scale(1.2)' : 'scale(1)',
                            transition: 'transform 0.15s, outline 0.15s',
                            position: 'relative',
                            boxShadow: accentColor === color ? `0 0 8px ${color}60` : 'none',
                          }}
                        >
                          {accentColor === color && (
                            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 800 }}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <ToolIcon icon={MessageSquare} tip="Feedback" />
        </div>
      </div>

      {/* ── Attachment Viewer Modal Overlay ── */}
      <AnimatePresence>
        {activePopover === 'attachments' && (
          <motion.div 
            className="tdk-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="tdk-modal-content"
              initial={{ y: 20, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.98 }}
            >
              <div className="tdk-modal-header">
                <h2>My Attachments</h2>
                <button className="tdk-btn-close-modal" onClick={() => setActivePopover(null)}><X size={18} /></button>
              </div>
              <div className="tdk-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Drag and Drop Zone */}
                <div 
                  className="tdk-dropzone"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${isDragging ? 'var(--gpt-accent)' : 'var(--gpt-sidebar-border)'}`,
                    backgroundColor: isDragging ? 'rgba(56, 189, 248, 0.05)' : 'var(--gpt-surface)',
                    borderRadius: '12px',
                    padding: '36px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    position: 'relative'
                  }}
                >
                  <UploadCloud size={32} color={isDragging ? 'var(--gpt-accent)' : 'var(--gpt-sidebar-muted)'} style={{ marginBottom: '4px' }} />
                  <div style={{ fontSize: '14px', color: 'var(--gpt-text-primary)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--gpt-accent)' }}>Click to upload</span> or drag and drop
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gpt-sidebar-muted)' }}>SVG, PNG, JPG, PDF or Excel (max. 25MB)</div>
                  
                  <input type="file" multiple style={{ display: 'none' }} id="file-drop-input" onChange={(e) => {
                    if (e.target.files.length > 0) processDropFiles(Array.from(e.target.files));
                    e.target.value = null; // reset to allow same file retry
                  }} />
                  <label htmlFor="file-drop-input" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'pointer' }}></label>
                </div>
                
                <div className="tdk-attachments-content">
                  <h3 className="tdk-sec-title" style={{ marginBottom: '12px' }}>Images ({localAttachments.images.length})</h3>
                  <div className="tdk-grid-images">
                    {localAttachments.images.length > 0 ? localAttachments.images.map((img) => (
                      <div className="tdk-image-card" key={img.id} title={img.name} style={{ position: 'relative', overflow: 'visible' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeAttachment('images', img.id); }}
                          style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                          title="Remove image"
                        ><X size={12} /></button>
                        <div className="tdk-img-ph" style={{ backgroundImage: `url(${img.url})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 1, border: 'none' }}></div>
                        <div className="tdk-img-lbl">
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{img.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--gpt-sidebar-muted)' }}>{img.size}</div>
                        </div>
                      </div>
                    )) : <div style={{ fontSize: '13px', color: 'var(--gpt-sidebar-muted)', padding: '10px 0' }}>No image files uploaded yet.</div>}
                  </div>
                </div>

                <div className="tdk-attachments-content">
                  <div className="tdk-sec-header" style={{ marginBottom: '12px' }}>
                    <h3 className="tdk-sec-title">Documents ({localAttachments.documents.length})</h3>
                    {localAttachments.documents.length > 0 && <span className="tdk-link">Show all</span>}
                  </div>
                  
                  <div className="tdk-grid-docs">
                    {localAttachments.documents.length > 0 ? localAttachments.documents.map((doc, i) => {
                       const colors = ['#e06346', '#4caf50', '#fdd835', '#00bcd4', '#9c27b0'];
                       return (
                        <div className="tdk-doc-card" key={doc.id} title={doc.name} style={{ position: 'relative', overflow: 'visible' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeAttachment('documents', doc.id); }}
                            style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                            title="Remove document"
                          ><X size={12} /></button>
                          <div className="tdk-doc-cover" style={{ background: colors[i % colors.length] }}>
                            <FileCode2 size={28} color="rgba(255,255,255,0.9)" />
                          </div>
                          <div className="tdk-doc-lbl">
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--gpt-sidebar-muted)' }}>{doc.size}</div>
                          </div>
                        </div>
                       )
                    }) : <div style={{ fontSize: '13px', color: 'var(--gpt-sidebar-muted)', padding: '10px 0' }}>No document files uploaded yet.</div>}
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Jobber Calculator Modal ── */}
      <JobberCalculatorModal isOpen={showCalc} onClose={() => setShowCalc(false)} />
    </>
  );
}

// Global Faux-Tooltip system avoiding messy state per button
let tooltipEl = null;

function injectTooltip(e, text) {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'tdk-tooltip';
    document.body.appendChild(tooltipEl);
  }
  tooltipEl.textContent = text;
  tooltipEl.style.opacity = '1';
  
  const rect = e.currentTarget.getBoundingClientRect();
  // Place to the left of the button
  tooltipEl.style.top = `${rect.top + (rect.height / 2)}px`;
  tooltipEl.style.left = `${rect.left - 8}px`; // transform handles -100% and -50% translateY
}

function removeTooltip() {
  if (tooltipEl) {
    tooltipEl.style.opacity = '0';
    setTimeout(() => {
      if (tooltipEl && tooltipEl.style.opacity === '0') {
        tooltipEl.remove();
        tooltipEl = null;
      }
    }, 150);
  }
}

// Simple stateless button
function ToolIcon({ icon: Icon, tip, dot }) {
  return (
    <button className="tdk-btn" onMouseEnter={(e) => injectTooltip(e, tip)} onMouseLeave={removeTooltip}>
      <Icon size={16} />
      {dot && <span className="tdk-dot" />}
    </button>
  );
}

