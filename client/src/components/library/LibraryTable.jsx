// client/src/components/library/LibraryTable.jsx
import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, flexRender,
} from '@tanstack/react-table';
import {
  Lock, Globe, Check, X, Trash2, Edit2,
  ArrowUpDown, ArrowUp, ArrowDown, Plus, AlertCircle, Columns
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Editable Cell ─────────────────────────────────────────────────────────────
function EditableCell({ value, isEditing, onChange, type = 'text', placeholder = '', hasError, color }) {
  const inputRef = useRef();

  React.useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  if (!isEditing) {
    return (
      <div className="lib-cell-view">
        <span 
          className={value?.isEstimated ? 'is-estimated' : ''}
          style={{
            color: (value === null || value === undefined || value === '') ? 'var(--lib-text-muted)' : (color || (value?.isEstimated ? 'var(--lib-accent)' : 'var(--lib-text)')),
            fontFamily: type === 'number' ? 'var(--lib-mono)' : 'inherit',
            fontSize: type === 'number' ? 11 : 12,
            fontStyle: value?.isEstimated ? 'italic' : 'normal',
          }}
        >
          {value !== null && value !== undefined && value !== '' ? (value?.isEstimated ? `$${value.val}` : value) : '—'}
        </span>
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      className={`lib-cell-input ${hasError ? 'has-error' : ''}`}
      type={type}
      value={value ?? ''}
      placeholder={placeholder}
      step={type === 'number' ? 'any' : undefined}
      onChange={e => onChange(type === 'number' ? parseFloat(e.target.value) || '' : e.target.value)}
      onClick={e => e.stopPropagation()}
    />
  );
}

// ── Skeleton Rows ─────────────────────────────────────────────────────────────
function SkeletonRows({ count = 8, colCount = 5 }) {
  return Array.from({ length: count }, (_, i) => (
    <tr key={i} className="lib-skeleton-row">
      {Array.from({ length: colCount }, (__, j) => (
        <td key={j}>
          <div className="lib-skeleton-cell" style={{ width: `${60 + (j * 15) % 30}%` }} />
        </td>
      ))}
    </tr>
  ));
}

// ── Lock Tooltip ──────────────────────────────────────────────────────────────
function LockedTooltip({ children, tip }) {
  return (
    <div className="lib-tooltip-wrap">
      {children}
      <div className="lib-tooltip">{tip}</div>
    </div>
  );
}

// ── Main Table ────────────────────────────────────────────────────────────────
export default function LibraryTable({
  data = [],
  metadata,
  loading = false,
  error = null,
  editMap = {},
  savingIds = new Set(),
  errors = {},
  onStartEdit,
  onSetField,
  onSave,
  onCancel,
  onDelete,
  onAddRow,
  hasUnsavedChanges = false,
  onSaveAll,
  onCancelAll,
  systemConfig,
  category,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
}) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);

  // Add column form state
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [newColHeader, setNewColHeader] = useState('');
  const [newColType, setNewColType] = useState('text');
  const [isSubmittingCol, setIsSubmittingCol] = useState(false);

  // Edit column state
  const [editingColKey, setEditingColKey] = useState(null); // field key being edited
  const [editColHeader, setEditColHeader] = useState('');
  const [editColType, setEditColType] = useState('text');
  const [isUpdatingCol, setIsUpdatingCol] = useState(false);

  const fields = metadata?.fields || [];
  const isEditing = useCallback((id) => Boolean(editMap[id]), [editMap]);
  const isSaving = useCallback((id) => savingIds.has(id), [savingIds]);

  // ── Build TanStack columns ──────────────────────────────────────────────────
  const columns = useMemo(() => {
    const cols = [];

    // Dynamic field columns from category schema
    fields.forEach(field => {
      cols.push({
        id: field.key,
        header: field.header,
        accessorKey: field.key,
        cell: ({ row, table }) => {
          const { editMap, errors, onSetField, isEditing, category, systemConfig } = table.options.meta;
          const r = row.original;
          const id = r.id;
          const editing = isEditing(id);
          const editedRow = editMap[id]?.edited;
          const rowErr = errors[id];
          
          const fieldValue = editing ? (editedRow?.[field.key] ?? '') : (r[field.key] ?? '');
          let displayVal = fieldValue;
          
          const isWeightBased = ['guardRail_type', 'wallRail_type', 'grabRail_type', 'caneRail_type', 'stringer_size'].includes(category);
          
          if (!editing) {
            // Handle TBD for weight in Pan Plate config
            if (category === 'pan_plate_config' && field.key === 'steelLbsLf' && (fieldValue === 0 || fieldValue === null || fieldValue === undefined)) {
              displayVal = 'TBD';
            }
            
            // Existing Price Estimations
            else if (field.key === 'price' && (fieldValue === null || fieldValue === undefined || fieldValue === '' || fieldValue === 0)) {
              // 1. Weight-based Items (Rails, Stringers)
              if (isWeightBased) {
                const steelLbs = parseFloat(r.steelLbsLf);
                const globalSteelPrice = parseFloat(systemConfig?.steel_price_per_lb || 0.75);
                if (steelLbs > 0) {
                  const est = (steelLbs * globalSteelPrice).toFixed(2);
                  displayVal = { val: est, isEstimated: true };
                }
              } 
              // 2. Finish Options
              else if (category === 'finish_option') {
                const lbl = (r.label || '').toLowerCase();
                const valCode = (r.value || '').toLowerCase();
                let est = null;
                if (lbl.includes('galv') || valCode.includes('galv')) est = systemConfig?.galvanize_charge || systemConfig?.galvanize_rate || 0.75;
                else if (lbl.includes('powder') || valCode.includes('powder')) est = systemConfig?.powder_coat_rate || 1.7587;
                else if (lbl.includes('primer') || valCode.includes('primer')) est = systemConfig?.primer_rate || 0;
                
                if (est !== null) displayVal = { val: parseFloat(est).toFixed(2), isEstimated: true };
              }
              // 3. Mounting & Hardware
              else if (category === 'mounting_type') {
                const lbl = (r.label || '').toLowerCase();
                let est = null;
                if (lbl.includes('embedded')) est = systemConfig?.mounting_embedded_rate || 5.00;
                else if (lbl.includes('anchored')) est = (systemConfig?.por_rok_anchor_rate > 0) ? systemConfig?.por_rok_anchor_rate : (systemConfig?.mounting_anchored_rate || 6.00);
                
                if (est !== null) displayVal = { val: parseFloat(est).toFixed(2), isEstimated: true };
              }
              // 4. Platform Types (Fallback to Pan Rate if applicable)
              else if (category === 'platform_type') {
                const lbl = (r.label || '').toLowerCase();
                if (lbl.includes('pan')) {
                  const est = systemConfig?.stair_pan_rate || 1.00;
                  displayVal = { val: parseFloat(est).toFixed(2), isEstimated: true };
                }
              }
            }
          }

          return (
            <EditableCell
              value={displayVal}
              isEditing={editing}
              type={field.type}
              placeholder={field.header}
              hasError={Boolean(rowErr?.[field.key])}
              onChange={(v) => onSetField(id, field.key, v)}
              color={field.key === 'price' ? 'var(--lib-accent)' : undefined}
            />
          );
        },
      });
    });

    // Actions column
    cols.push({
      id: 'actions',
      header: '',
      size: 100,
      enableSorting: false,
      cell: ({ row, table }) => {
        const { onSave, onCancel, onDelete, onStartEdit, isEditing, isSaving, errors } = table.options.meta;
        const r = row.original;
        const id = r.id;
        const editing = isEditing(id);
        const saving = isSaving(id);
        const rowErr = errors[id]?._row;

        return (
          <div className="lib-row-actions">
            {rowErr && (
              <LockedTooltip tip={rowErr}>
                <AlertCircle size={14} style={{ color: 'var(--lib-danger)', flexShrink: 0 }} />
              </LockedTooltip>
            )}

            {editing ? (
              <>
                <button
                  className="lib-action-btn save"
                  onClick={() => onSave(id)}
                  disabled={saving}
                  title="Save"
                >
                  {saving ? <span style={{ fontSize: 9 }}>…</span> : <Check size={13} />}
                </button>
                <button
                  className="lib-action-btn cancel"
                  onClick={() => onCancel(id)}
                  disabled={saving}
                  title="Cancel"
                >
                  <X size={13} />
                </button>
              </>
            ) : (
              <>
                <button
                  className="lib-action-btn"
                  onClick={() => onStartEdit(r)}
                  title="Edit row"
                >
                  <Edit2 size={12} />
                </button>

                <button
                  className="lib-action-btn delete"
                  onClick={async () => {
                    if (!window.confirm(`Delete "${r.label}"? This cannot be undone.`)) return;
                    try {
                      await onDelete(id);
                      toast.success('Row deleted');
                    } catch (err) {
                      toast.error(err.message || 'Delete failed');
                    }
                  }}
                  title="Delete row"
                >
                  <Trash2 size={12} />
                </button>
              </>
            )}
          </div>
        );
      },
    });

    return cols;
  }, [fields]); // Stabilized: only re-create if fields change (e.g. category change)

  // ── Table data including new row ────────────────────────────────────────────
  const tableData = useMemo(() => {
    const rows = [...data];
    if (editMap['__new__']) {
      rows.unshift({ id: '__new__', ...editMap['__new__'].edited, isSystemDefault: false, isGlobalDefault: false });
    }
    return rows;
  }, [data, editMap]);

  const handleAddColumnSubmit = async (e) => {
    e.preventDefault();
    if (!newColHeader.trim()) return toast.error('Column header is required');
    if (!onAddColumn) return;

    setIsSubmittingCol(true);
    try {
      await onAddColumn(newColHeader.trim(), newColType);
      setNewColHeader('');
      setIsAddingCol(false);
    } catch (err) {
      // toast handled in parent
    } finally {
      setIsSubmittingCol(false);
    }
  };

  const handleUpdateColumnSubmit = async (e) => {
    e.preventDefault();
    if (!editColHeader.trim()) return toast.error('Column header is required');
    if (!onUpdateColumn || !editingColKey) return;

    setIsUpdatingCol(true);
    try {
      await onUpdateColumn(editingColKey, editColHeader.trim(), editColType);
      setEditingColKey(null);
    } catch (err) {
      // toast handled in parent
    } finally {
      setIsUpdatingCol(false);
    }
  };

  const handleDeleteColumnClick = async (key) => {
    if (!onDeleteColumn) return;
    try {
      await onDeleteColumn(key);
    } catch (err) {
      // toast handled in parent
    }
  };

  const table = useReactTable({
    data: tableData,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: 'includesString',
    meta: {
      editMap,
      errors,
      onSetField,
      onSave,
      onCancel,
      onDelete,
      onStartEdit,
      isEditing,
      isSaving,
      category,
      systemConfig
    }
  });

  const filteredRowCount = table.getRowModel().rows.length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="lib-content" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Content Header */}
      <div className="lib-content-header">
        <div>
          <div className="lib-content-title">{metadata?.label || 'Library'}</div>
          <div className="lib-content-meta">{metadata?.description || ''}</div>
        </div>

        <div className="lib-stat-row" style={{ marginLeft: 12 }}>
          <div className="lib-stat-pill accent">
            <span className="val">{metadata?.total ?? 0}</span> rows
          </div>
          {/* Stats removed per user request for no default/locked entries */}
        </div>

        <div className="lib-toolbar">
          {hasUnsavedChanges && (
            <>
              <button className="lib-btn lib-btn-secondary" onClick={onCancelAll} style={{ fontSize: 11 }}>
                <X size={12} /> Discard All
              </button>
              <button className="lib-btn lib-btn-primary" onClick={async () => {
                try { await onSaveAll(); toast.success('All changes saved!'); }
                catch (e) { toast.error(e.message); }
              }}>
                <Check size={12} /> Save All
              </button>
            </>
          )}
          <button
            className="lib-btn lib-btn-secondary"
            onClick={() => setIsAddingCol(!isAddingCol)}
            title="Add a custom column to this category"
          >
            <Columns size={12} /> Add Column
          </button>
          <button className="lib-btn lib-btn-secondary" onClick={onAddRow}>
            <Plus size={12} /> Add Row
          </button>
        </div>
      </div>

      {/* Add Column Form Inline */}
      {isAddingCol && (
        <form className="lib-add-col-form" onSubmit={handleAddColumnSubmit}>
          <div className="lib-add-col-fields">
            <div className="lib-input-group">
              <label>Column Header</label>
              <input
                type="text"
                className="lib-add-col-input"
                value={newColHeader}
                onChange={(e) => setNewColHeader(e.target.value)}
                placeholder="e.g. Material Grade"
                autoFocus
              />
            </div>
            <div className="lib-input-group">
              <label>Data Type</label>
              <select
                className="lib-add-col-select"
                value={newColType}
                onChange={(e) => setNewColType(e.target.value)}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
              </select>
            </div>
          </div>
          <div className="lib-add-col-actions">
            <button
              type="button"
              className="lib-btn lib-btn-ghost"
              onClick={() => setIsAddingCol(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="lib-btn lib-btn-primary"
              disabled={isSubmittingCol}
            >
              {isSubmittingCol ? 'Adding...' : 'Confirm'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="lib-filter-bar">
        <div className="lib-filter-input-wrap">
          <svg className="lib-filter-input-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="lib-filter-input"
            placeholder="Search rows..."
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
          />
        </div>
        <span className="lib-filter-info">
          {globalFilter ? `${filteredRowCount} of ${tableData.length} rows` : `${tableData.length} rows`}
        </span>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="lib-error-banner">
          <AlertCircle size={14} />
          <span>Failed to load data: {error}</span>
        </div>
      )}

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="lib-unsaved-banner">
          <span>⚠ You have unsaved changes in this category</span>
        </div>
      )}

      {/* Table */}
      <div className="lib-table-wrap">
        <table className="lib-table">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className={`${sorted ? 'sorted' : ''} ${header.column.id.startsWith('custom_') ? 'is-custom' : ''}`}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      {editingColKey === header.column.id ? (
                        <form className="lib-header-edit-form" onClick={e => e.stopPropagation()} onSubmit={handleUpdateColumnSubmit}>
                          <input
                            className="lib-header-edit-input"
                            value={editColHeader}
                            onChange={e => setEditColHeader(e.target.value)}
                            autoFocus
                            onKeyDown={e => e.key === 'Escape' && setEditingColKey(null)}
                          />
                          <select 
                            className="lib-header-edit-select"
                            value={editColType}
                            onChange={e => setEditColType(e.target.value)}
                          >
                            <option value="text">abc</option>
                            <option value="number">123</option>
                          </select>
                          <div className="lib-header-edit-actions">
                            <button type="submit" disabled={isUpdatingCol} title="Save Column"><Check size={10} /></button>
                            <button type="button" onClick={() => setEditingColKey(null)} title="Cancel"><X size={10} /></button>
                          </div>
                        </form>
                      ) : (
                        <div className="lib-header-content" onClick={header.column.getToggleSortingHandler()}>
                          <span className="lib-header-label">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          
                          <div className="lib-header-meta">
                            {header.column.getCanSort() && (
                              <div className="lib-header-sort">
                                {sorted === 'asc' ? <ArrowUp size={10} /> :
                                 sorted === 'desc' ? <ArrowDown size={10} /> :
                                 <ArrowUpDown size={10} style={{ opacity: 0.1 }} />}
                              </div>
                            )}

                            {header.column.id.startsWith('custom_') && (
                              <div className="lib-header-custom-actions" onClick={e => e.stopPropagation()}>
                                <button 
                                  className="lib-col-action-btn edit"
                                  title="Edit Column"
                                  onClick={() => {
                                    setEditingColKey(header.column.id);
                                    setEditColHeader(header.column.columnDef.header);
                                    setEditColType(header.column.columnDef.meta?.type || 'text');
                                  }}
                                >
                                  <Edit2 size={10} />
                                </button>
                                <button 
                                  className="lib-col-action-btn delete"
                                  title="Remove Column"
                                  onClick={() => handleDeleteColumnClick(header.column.id)}
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows count={8} colCount={columns.length} />
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="lib-empty">
                    <div className="lib-empty-icon">📋</div>
                    <div className="lib-empty-title">
                      {globalFilter ? 'No matching rows' : 'No entries yet'}
                    </div>
                    <div className="lib-empty-desc">
                      {globalFilter ? `No rows match "${globalFilter}"` : 'Click "Add Row" to create the first entry.'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => {
                const r = row.original;
                const dirty = Boolean(editMap[r.id]);
                const isNew = r.id === '__new__';
                return (
                  <tr
                    key={row.id}
                    className={`
                      ${r.isSystemDefault ? 'is-locked' : ''}
                      ${dirty && !isNew ? 'is-dirty' : ''}
                      ${isNew ? 'is-new' : ''}
                    `.trim()}
                    onDoubleClick={() => {
                      if (!dirty) onStartEdit(r);
                    }}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
