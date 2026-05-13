// client/src/components/library/UploadDialog.jsx
// 3-step Excel import wizard: Upload → Review (conflict resolution) → Confirm

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, X, FileSpreadsheet, Check, AlertTriangle,
  AlertCircle, RefreshCw, ChevronRight, ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import './UploadDialog.css';
import { validateUpload, commitImport } from '../../api/libraryApi';

const STEPS = ['Upload', 'Review', 'Confirm'];

export default function UploadDialog({ category, categoryLabel, onClose, onImportComplete }) {
  const [step, setStep] = useState(0);          // 0=upload, 1=review, 2=confirm
  const [file, setFile] = useState(null);
  const [dragover, setDragover] = useState(false);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [resolutions, setResolutions] = useState({});  // excelRow → 'merge'|'skip'|'rename'
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef();

  // ── File Selection ──────────────────────────────────────────────────────────
  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!f.name.endsWith('.xlsx')) {
      toast.error('Only .xlsx files are accepted');
      return;
    }
    setFile(f);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragover(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  // ── Step 1: Validate ────────────────────────────────────────────────────────
  const handleValidate = useCallback(async () => {
    if (!file) return;
    setValidating(true);
    try {
      const result = await validateUpload(category, file);

      // Default resolution for conflicts: 'skip' unless locked
      const defaultResolutions = {};
      result.conflicts?.forEach(c => {
        defaultResolutions[c.excelRow] = c._conflictType === 'update_locked' ? 'merge' : 'skip';
      });

      setParseResult(result);
      setResolutions(defaultResolutions);
      setStep(1);
    } catch (err) {
      toast.error(err.message || 'Validation failed');
    } finally {
      setValidating(false);
    }
  }, [file, category]);

  // ── Step 2: Set Resolution ──────────────────────────────────────────────────
  const setResolution = useCallback((excelRow, action) => {
    setResolutions(prev => ({ ...prev, [excelRow]: action }));
  }, []);

  // ── Step 3: Commit Import ───────────────────────────────────────────────────
  const handleImport = useCallback(async () => {
    setImporting(true);
    setStep(2);
    try {
      const resolutionArray = Object.entries(resolutions).map(([excelRow, action]) => ({
        excelRow: parseInt(excelRow),
        action,
      }));
      const result = await commitImport(category, file, resolutionArray);
      setImportResult(result);
    } catch (err) {
      toast.error(err.message || 'Import failed');
      setStep(1);
    } finally {
      setImporting(false);
    }
  }, [category, file, resolutions]);

  // ── Step complete → refresh data ────────────────────────────────────────────
  const handleDone = useCallback(() => {
    onImportComplete?.();
    onClose();
  }, [onImportComplete, onClose]);

  // ── Render helpers ──────────────────────────────────────────────────────────
  const hasErrors = parseResult?.errors?.length > 0;
  const conflictCount = parseResult?.conflicts?.length || 0;
  const canProceed = parseResult && !hasErrors;

  return (
    <div className="upload-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="upload-modal">
        {/* Header */}
        <div className="upload-modal-header">
          <div className="upload-modal-icon"><Upload size={16} /></div>
          <div>
            <div className="upload-modal-title">Import {categoryLabel}</div>
            <div className="upload-modal-subtitle">Upload an Excel file to bulk-import library entries</div>
          </div>
          <button className="upload-modal-close" onClick={onClose}><X size={15} /></button>
        </div>

        {/* Steps */}
        <div className="upload-steps">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <div className={`upload-step-line ${i <= step ? 'done' : ''}`} />}
              <div className={`upload-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                <div className="upload-step-num">
                  {i < step ? <Check size={10} /> : i + 1}
                </div>
                {s}
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Progress bar */}
        <div className="ud-progress-bar" style={{ margin: 0 }}>
          <div className="ud-progress-bar-fill" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
        </div>

        {/* Body */}
        <div className="upload-modal-body">

          {/* ── STEP 0: Drop Zone ────────────────────────────────────────────── */}
          {step === 0 && (
            <div>
              <div
                className={`ud-dropzone ${dragover ? 'dragover' : ''} ${file ? 'has-file' : ''}`}
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragover(true); }}
                onDragLeave={() => setDragover(false)}
                onDrop={onDrop}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx"
                  style={{ display: 'none' }}
                  onChange={e => handleFile(e.target.files[0])}
                />
                <div className="ud-dropzone-icon">
                  {file ? <FileSpreadsheet size={22} /> : <Upload size={22} />}
                </div>
                {file ? (
                  <>
                    <div className="ud-dropzone-title" style={{ color: '#10a37f' }}>
                      {file.name}
                    </div>
                    <div className="ud-dropzone-desc">
                      {(file.size / 1024).toFixed(1)} KB — Click to change file
                    </div>
                  </>
                ) : (
                  <>
                    <div className="ud-dropzone-title">Drag & Drop your Excel file here</div>
                    <div className="ud-dropzone-desc">or click to browse</div>
                    <div className="ud-dropzone-hint">.xlsx files only · Max 20 MB</div>
                  </>
                )}
              </div>

              <div style={{ marginTop: 16, padding: 12, background: 'rgba(16,163,127,0.06)', borderRadius: 8, border: '1px solid rgba(16,163,127,0.15)', fontSize: 12, color: '#94a3b8', lineHeight: 1.7 }}>
                <strong style={{ color: '#e2e8f0' }}>💡 Tip:</strong> Download the Excel template first to ensure the correct format.
                The Data sheet must contain headers matching the expected columns.
              </div>
            </div>
          )}

          {/* ── STEP 1: Review ───────────────────────────────────────────────── */}
          {step === 1 && parseResult && (
            <div className="ud-results">
              {/* Summary Cards */}
              <div className="ud-summary-grid">
                <div className="ud-summary-card added">
                  <div className="val">{parseResult.summary?.newRows ?? 0}</div>
                  <div className="lbl">New Rows</div>
                </div>
                <div className="ud-summary-card">
                  <div className="val">{parseResult.summary?.updateRows ?? 0}</div>
                  <div className="lbl">Updates</div>
                </div>
                <div className="ud-summary-card conflicts">
                  <div className="val">{parseResult.summary?.conflictCount ?? 0}</div>
                  <div className="lbl">Conflicts</div>
                </div>
                <div className="ud-summary-card errors">
                  <div className="val">{parseResult.summary?.errorCount ?? 0}</div>
                  <div className="lbl">Errors</div>
                </div>
              </div>

              {/* Errors */}
              {hasErrors && (
                <div>
                  <div className="ud-section-label">Validation Errors</div>
                  <div className="ud-error-list">
                    <div className="ud-error-header">
                      ✗ {parseResult.errors.length} error(s) — fix these in your file and re-upload
                    </div>
                    {parseResult.errors.map((e, i) => (
                      <div key={i} className="ud-error-item">
                        <span className="ud-error-row">Row {e.row}</span>
                        <span>{e.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {(parseResult.warnings?.length > 0) && (
                <div>
                  <div className="ud-section-label">Warnings</div>
                  {parseResult.warnings.map((w, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, padding: '7px 10px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 7, marginBottom: 4, fontSize: 11, color: '#fcd34d' }}>
                      <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                      {w.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Conflicts */}
              {conflictCount > 0 && (
                <div>
                  <div className="ud-section-label">
                    Conflict Resolution ({conflictCount} rows)
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                    Choose how to handle each conflicting row:
                  </div>
                  <div className="ud-conflict-list">
                    {parseResult.conflicts.map(c => {
                      const isLocked = c._conflictType === 'update_locked';
                      return (
                        <div key={c.excelRow} className="ud-conflict-row">
                          <span style={{ color: '#64748b', fontSize: 10, flexShrink: 0 }}>Row {c.excelRow}</span>
                          <span className={`ud-conflict-type ${isLocked ? 'locked' : ''}`}>
                            {isLocked ? '🔒 LOCKED' : c._conflictType === 'duplicate_label' ? 'DUPLICATE' : 'EXISTING'}
                          </span>
                          <span className="ud-conflict-label" title={c.label}>{c.label}</span>
                          <select
                            className="ud-resolution-select"
                            value={resolutions[c.excelRow] || 'skip'}
                            onChange={e => setResolution(c.excelRow, e.target.value)}
                            disabled={isLocked}
                          >
                            {isLocked ? (
                              <option value="merge">Update Values Only</option>
                            ) : (
                              <>
                                <option value="skip">Skip</option>
                                <option value="merge">Merge (Overwrite)</option>
                                <option value="rename">Add as New</option>
                              </>
                            )}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Clean rows preview */}
              {!hasErrors && parseResult.rows?.length > 0 && (
                <div style={{ padding: 10, background: 'rgba(16,163,127,0.06)', border: '1px solid rgba(16,163,127,0.15)', borderRadius: 8, fontSize: 12, color: '#94a3b8' }}>
                  <Check size={13} style={{ color: '#10a37f', verticalAlign: 'middle', marginRight: 6 }} />
                  <strong style={{ color: '#e2e8f0' }}>{parseResult.rows.length} rows</strong> are valid and ready to import without conflicts.
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Confirm / Result ─────────────────────────────────────── */}
          {step === 2 && (
            <div>
              {importing ? (
                <div className="ud-success">
                  <div className="ud-success-icon" style={{ animation: 'none', borderColor: 'rgba(16,163,127,0.3)' }}>
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                  <div className="ud-success-title">Importing…</div>
                  <div className="ud-success-desc">Writing rows to the database, please wait</div>
                </div>
              ) : importResult ? (
                <div className="ud-success">
                  <div className="ud-success-icon"><Check size={26} /></div>
                  <div className="ud-success-title">Import Successful!</div>
                  <div className="ud-success-desc">{importResult.message}</div>
                  <div className="ud-summary-grid" style={{ marginTop: 8 }}>
                    <div className="ud-summary-card added">
                      <div className="val">{importResult.rowsAdded}</div>
                      <div className="lbl">Added</div>
                    </div>
                    <div className="ud-summary-card">
                      <div className="val">{importResult.rowsUpdated}</div>
                      <div className="lbl">Updated</div>
                    </div>
                    <div className="ud-summary-card">
                      <div className="val">{importResult.rowsSkipped}</div>
                      <div className="lbl">Skipped</div>
                    </div>
                    <div className="ud-summary-card added">
                      <div className="val">{importResult.rowsAdded + importResult.rowsUpdated}</div>
                      <div className="lbl">Total Changes</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="upload-modal-footer">
          <div>
            {step > 0 && !importResult && (
              <button className="ud-btn ud-btn-secondary" onClick={() => setStep(s => s - 1)} disabled={validating || importing}>
                <ArrowLeft size={13} /> Back
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ud-btn ud-btn-secondary" onClick={onClose}>
              {importResult ? 'Close' : 'Cancel'}
            </button>

            {step === 0 && (
              <button className="ud-btn ud-btn-primary" onClick={handleValidate} disabled={!file || validating}>
                {validating ? <><RefreshCw size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> Validating…</> : <>Validate <ChevronRight size={13} /></>}
              </button>
            )}

            {step === 1 && !hasErrors && (
              <button className="ud-btn ud-btn-primary" onClick={handleImport} disabled={importing}>
                Import {parseResult?.summary?.totalParsed ?? 0} rows <ChevronRight size={13} />
              </button>
            )}

            {importResult && (
              <button className="ud-btn ud-btn-primary" onClick={handleDone}>
                <Check size={13} /> Done — View Updates
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
