import React, { useState } from 'react';
import {
  FileCode2, CheckSquare, Zap, Megaphone, Clock,
  MessageSquare, Sun, Moon, Monitor, X, Download, PlusSquare, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './ToolsDock.css';

export default function ToolsDock() {
  const [activePopover, setActivePopover] = useState(null); // 'calc', 'notes', 'appearance', 'attachments'
  const [themeMode, setThemeMode] = useState('light'); // 'light', 'dark', 'system'

  const togglePopover = (popover) => {
    setActivePopover(activePopover === popover ? null : popover);
  };

  return (
    <>
      <div className="tdk-root">
        
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
              onMouseEnter={(e) => injectTooltip(e, 'Sticky Notes')}
              onMouseLeave={removeTooltip}
              onClick={() => togglePopover('notes')}
            >
              <PlusSquare size={16} className="tdk-accent-yellow" />
            </button>

            {/* Sticky Notes Popover */}
            <AnimatePresence>
              {activePopover === 'notes' && (
                <motion.div
                  className="tdk-popover tdk-pop-notes"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 5 }}
                >
                  <div className="tdk-note-card">
                    <div className="tdk-note-header">
                      <div className="tdk-note-icon"><CheckSquare size={12} /></div>
                      <button className="tdk-close-btn" onClick={() => setActivePopover(null)}><X size={12} /></button>
                    </div>
                    <textarea className="tdk-note-title" placeholder="Name your note" />
                    <textarea className="tdk-note-body" placeholder="Start typing..." />
                    <div className="tdk-note-footer">
                      My Personal notes <span>›</span> General
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tekla Calculator */}
          <div className="tdk-wrapper">
            <button 
              className={`tdk-btn ${activePopover === 'calc' ? 'active' : ''}`}
              onMouseEnter={(e) => injectTooltip(e, 'Tekla Structural Calculator')}
              onMouseLeave={removeTooltip}
              onClick={() => togglePopover('calc')}
            >
              <Zap size={16} />
            </button>

            {/* Calculator Popover */}
            <AnimatePresence>
              {activePopover === 'calc' && (
                <motion.div
                  className="tdk-popover tdk-pop-calc"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 5 }}
                >
                  <div className="tdk-calc-panel">
                    <div className="tdk-calc-header">
                      <span>Formula Calculator (Tekla)</span>
                      <button onClick={() => setActivePopover(null)}><X size={12} /></button>
                    </div>
                    <div className="tdk-calc-body">
                      <div className="tdk-field">
                        <label>Profile Designation</label>
                        <input type="text" placeholder="e.g. W12x14" className="tdk-input" />
                      </div>
                      <div className="tdk-row">
                        <div className="tdk-field">
                          <label>Unit Wt (lbs/ft)</label>
                          <input type="number" placeholder="14" className="tdk-input" />
                        </div>
                        <div className="tdk-field">
                          <label>Length (ft)</label>
                          <input type="number" placeholder="20.5" className="tdk-input" />
                        </div>
                      </div>
                      <div className="tdk-row">
                        <div className="tdk-field">
                          <label>Quantity</label>
                          <input type="number" placeholder="1" className="tdk-input" defaultValue={1} />
                        </div>
                        <div className="tdk-field">
                          <label>Total Wt (lbs)</label>
                          <input type="text" className="tdk-input tdk-input-result" readOnly value="287.00" />
                        </div>
                      </div>
                      <button className="tdk-calc-btn">Calculate Profile</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <ToolIcon icon={Megaphone} tip="Announcements" dot={true} />
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
                  <div className="tdk-menu-panel">
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
              <div className="tdk-modal-body">
                
                <h3 className="tdk-sec-title">Images</h3>
                <div className="tdk-grid-images">
                  {[1,2].map(i => (
                    <div className="tdk-image-card" key={i}>
                      <div className="tdk-img-ph"><ImageIcon size={24} opacity={0.3} /></div>
                      <div className="tdk-img-lbl">Screenshot 2026-03...</div>
                    </div>
                  ))}
                </div>

                <div className="tdk-sec-header">
                  <h3 className="tdk-sec-title">Documents</h3>
                  <span className="tdk-link">Show all</span>
                </div>
                
                <div className="tdk-grid-docs">
                  {['Misc est fron end.pdf', 'MiscMetalsEstimate...', 'Misc est fron end.pdf', 'Updated Report.pdf', 'CalTIMS_QA_Test...', 'Lancaster Archery - ...', 'Misc Worksheet re...'].map((txt, i) => {
                     // Colors from Screenshot 4
                     const colors = ['#e06346', '#4caf50', '#e06346', '#e06346', '#e06346', '#fdd835', '#4caf50'];
                     return (
                      <div className="tdk-doc-card" key={i}>
                        <div className="tdk-doc-cover" style={{ background: colors[i] || '#e06346' }}>
                          <FileCode2 size={28} color="rgba(255,255,255,0.9)" />
                        </div>
                        <div className="tdk-doc-lbl">{txt}</div>
                      </div>
                     )
                  })}
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
