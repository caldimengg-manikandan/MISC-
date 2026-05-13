// client/src/pages/Library/LibraryHub.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Download, Upload, RefreshCw, History, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import API_BASE_URL from '../../config/api';
import './LibraryHub.css';

import LibrarySidebar from '../../components/library/LibrarySidebar';
import LibraryTable from '../../components/library/LibraryTable';
import LibraryRatesPanel from '../../components/library/LibraryRatesPanel';
import UploadDialog from '../../components/library/UploadDialog';
import AuditLogViewer from '../../components/library/AuditLogViewer';
import { useLibraryData, useCategorySummary } from '../../hooks/useLibraryData';
import { useTableEdits } from '../../hooks/useTableEdits';
import { downloadTemplate, addColumn, updateColumn, deleteColumn } from '../../api/libraryApi';

// ── Category label map (for page title) ──────────────────────────────────────
const CATEGORY_LABELS = {
  finish_option:     'Finish Options',
  stringer_size:     'Stringer Sizes',
  guardRail_type:    'Guard Rail Types',
  wallRail_type:     'Wall Rail Types',
  grabRail_type:     'Grab Rail Types',
  caneRail_type:     'Cane Rail Types',
  stair_type:        'Stair Types',
  platform_type:     'Platform Types',
  grating_type:      'Grating Types',
  mounting_type:     'Mounting & Hardware',
  connection_type:   'Connection Types',
  material_type:     'Material Types',
  steel_grade_stair: 'Steel Grades (Stair)',
  steel_grade_rail:  'Steel Grades (Rail)',
  pan_plate_config:  'Pan Plate Configurations',
  __rates__:         'Global Configuration',
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function LibraryHub() {
  const { category: urlCategory } = useParams();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState(urlCategory || null);
  const [activeTab, setActiveTab] = useState('data'); // 'data' | 'audit'
  const [showUpload, setShowUpload] = useState(false);
  const [systemConfig, setSystemConfig] = useState(null);

  // Fetch system config for live price estimation
  useEffect(() => {
    const token = localStorage.getItem('steel_token');
    fetch(`${API_BASE_URL}/api/v1/admin/config`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Backend returns { success: true, data: { key: value } }
          setSystemConfig(data.data || {});
        }
      })
      .catch(err => console.error('Failed to fetch system config:', err));
  }, []);

  // Is the pricing engine panel active?
  const isRatesMode = activeCategory === '__rates__';

  // ── Data ──────────────────────────────────────────────────────────────────
  const { summary, loading: summaryLoading, refresh: refreshSummary } = useCategorySummary();
  const { data, metadata, loading, error, refresh, invalidate } = useLibraryData(activeCategory);

  // ── Edits ─────────────────────────────────────────────────────────────────
  const {
    editMap, savingIds, errors,
    hasUnsavedChanges,
    startEdit, setField, cancelEdit, cancelAll,
    saveRow, saveAll, removeRow, addNewRow,
  } = useTableEdits(activeCategory, {
    onSaved: (savedRow, action) => {
      invalidate();
      refresh(true);
      refreshSummary();
      toast.success(action === 'created' ? 'Row added!' : 'Changes saved!');
    },
    onDeleted: () => {
      invalidate();
      refresh(true);
      refreshSummary();
    },
  });

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleSelectCategory = useCallback((cat) => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Switch category and discard them?')) return;
      cancelAll();
    }
    setActiveCategory(cat);
    setActiveTab('data');
    navigate(`/library/${cat}`, { replace: true });
  }, [hasUnsavedChanges, cancelAll, navigate]);

  // ── Excel Download ─────────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (!activeCategory) return;
    const t = toast.loading('Generating Excel template…');
    try {
      const blob = await downloadTemplate(activeCategory);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Library_${CATEGORY_LABELS[activeCategory] || activeCategory}_${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Template downloaded!', { id: t });
    } catch (e) {
      toast.error(e.message || 'Download failed', { id: t });
    }
  }, [activeCategory]);

  const handleAddColumn = useCallback(async (header, type) => {
    if (!activeCategory) return;
    const t = toast.loading('Adding column…');
    try {
      await addColumn(activeCategory, { header, type });
      toast.success('Column added successfully!', { id: t });
      refresh(true); // reload category with new field
    } catch (e) {
      toast.error(e.message || 'Failed to add column', { id: t });
      throw e;
    }
  }, [activeCategory, refresh]);

  const handleUpdateColumn = useCallback(async (key, header, type) => {
    if (!activeCategory) return;
    const t = toast.loading('Updating column…');
    try {
      await updateColumn(activeCategory, key, { header, type });
      toast.success('Column updated!', { id: t });
      refresh(true);
    } catch (e) {
      toast.error(e.message || 'Failed to update column', { id: t });
      throw e;
    }
  }, [activeCategory, refresh]);

  const handleDeleteColumn = useCallback(async (key) => {
    if (!activeCategory) return;
    if (!window.confirm('Are you sure you want to remove this column? Custom data for this column will be hidden but not deleted.')) return;
    
    const t = toast.loading('Removing column…');
    try {
      await deleteColumn(activeCategory, key);
      toast.success('Column removed!', { id: t });
      refresh(true);
    } catch (e) {
      toast.error(e.message || 'Failed to remove column', { id: t });
      throw e;
    }
  }, [activeCategory, refresh]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="lib-shell">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="lib-header">
        <div className="lib-header-left">
          <div className="lib-header-icon">
            <BookOpen size={15} />
          </div>
          <div>
            <div className="lib-header-title">Library Hub</div>
            <div className="lib-header-subtitle">
              Centralized dictionary management — all reference data in one place
            </div>
          </div>
        </div>

        <div className="lib-header-actions">
          <button
            className="lib-btn lib-btn-ghost lib-btn-icon"
            onClick={() => { invalidate(); refresh(true); refreshSummary(); }}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            className="lib-btn lib-btn-secondary"
            onClick={handleDownload}
            disabled={!activeCategory || isRatesMode}
            title="Download Excel template for this category"
          >
            <Download size={13} /> Download
          </button>
          <button
            className="lib-btn lib-btn-secondary"
            onClick={() => setShowUpload(true)}
            disabled={!activeCategory || isRatesMode}
            title="Upload Excel to bulk-import"
          >
            <Upload size={13} /> Upload
          </button>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="lib-body">
        {/* Sidebar */}
        <LibrarySidebar
          activeCategory={activeCategory}
          onSelect={handleSelectCategory}
          summary={summary}
          loading={summaryLoading}
        />

        {/* Content Area */}
        {!activeCategory ? (
          <div className="lib-no-category lib-content">
            <div className="lib-no-category-icon">
              <BookOpen size={28} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--lib-text-dim)' }}>
              Select a category
            </div>
            <div style={{ fontSize: 12, color: 'var(--lib-text-muted)', maxWidth: 280, textAlign: 'center' }}>
              Choose a library category from the left panel to view and edit its entries.
            </div>
          </div>
        ) : isRatesMode ? (
          <div className="lib-content" style={{ overflowY: 'auto' }}>
            <LibraryRatesPanel />
          </div>
        ) : (
          <div className="lib-content" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Tabs */}
            <div className="lib-tabs">
              <button
                className={`lib-tab ${activeTab === 'data' ? 'active' : ''}`}
                onClick={() => setActiveTab('data')}
              >
                <BookOpen size={12} /> Data
              </button>
              <button
                className={`lib-tab ${activeTab === 'audit' ? 'active' : ''}`}
                onClick={() => setActiveTab('audit')}
              >
                <History size={12} /> Audit Log
              </button>
              <button
                className={`lib-tab ${activeTab === 'help' ? 'active' : ''}`}
                onClick={() => setActiveTab('help')}
              >
                <HelpCircle size={12} /> Help
              </button>
            </div>

            {/* Tab Panels */}
            {activeTab === 'data' && (
              <LibraryTable
                data={data}
                metadata={metadata}
                systemConfig={systemConfig}
                category={activeCategory}
                loading={loading}
                error={error}
                editMap={editMap}
                savingIds={savingIds}
                errors={errors}
                hasUnsavedChanges={hasUnsavedChanges}
                onStartEdit={startEdit}
                onSetField={setField}
                onSave={async (id) => {
                  try { await saveRow(id); }
                  catch (e) { toast.error(e.message || 'Save failed'); }
                }}
                onCancel={cancelEdit}
                onDelete={removeRow}
                onSaveAll={saveAll}
                onCancelAll={cancelAll}
                onAddRow={() => addNewRow()}
                onAddColumn={handleAddColumn}
                onUpdateColumn={handleUpdateColumn}
                onDeleteColumn={handleDeleteColumn}
              />
            )}

            {activeTab === 'audit' && (
              <AuditLogViewer filterModule={activeCategory} />
            )}

            {activeTab === 'help' && (
              <div style={{ padding: 24, color: 'var(--lib-text-dim)', lineHeight: 1.7, fontSize: 13, maxWidth: 600 }}>
                <h3 style={{ color: 'var(--lib-text)', marginBottom: 12 }}>Using the Library Hub</h3>
                <ul style={{ paddingLeft: 18, color: 'var(--lib-text-muted)' }}>
                  <li><strong>Double-click</strong> a row to edit it inline</li>
                  <li>Click <strong>Add Row</strong> to create a new entry</li>
                  <li>You can <strong>edit or delete any row</strong> in the list</li>
                  <li><strong>GLOBAL</strong> rows are shared reference data</li>
                  <li>Use <strong>Download</strong> to get an Excel template for bulk editing</li>
                  <li>Use <strong>Upload</strong> to bulk-import from Excel (Phase 3)</li>
                  <li>All changes are logged in the Audit Log tab</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      {showUpload && activeCategory && (
        <UploadDialog
          category={activeCategory}
          categoryLabel={CATEGORY_LABELS[activeCategory] || activeCategory}
          onClose={() => setShowUpload(false)}
          onImportComplete={() => {
            invalidate();
            refresh(true);
            refreshSummary();
          }}
        />
      )}
    </div>
  );
}
