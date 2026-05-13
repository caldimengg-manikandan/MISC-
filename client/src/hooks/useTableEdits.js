/**
 * useTableEdits.js
 * Tracks unsaved edits, validates, and saves rows in the LibraryTable.
 */

import { useState, useCallback, useEffect } from 'react';
import { createRow, updateRow, deleteRow } from '../api/libraryApi';

export function useTableEdits(category, { onSaved, onDeleted } = {}) {
  // Map of id → { original, edited } — key '__new__' for unsaved new rows
  const [editMap, setEditMap] = useState({});
  const [savingIds, setSavingIds] = useState(new Set());
  const [errors, setErrors] = useState({});

  const hasUnsavedChanges = Object.keys(editMap).length > 0;

  // ── Start editing a row ────────────────────────────────────────────────────
  const startEdit = useCallback((row) => {
    setEditMap(prev => {
      if (prev[row.id]) return prev; // already being edited
      return { ...prev, [row.id]: { original: row, edited: { ...row } } };
    });
  }, []);

  // ── Update a field while editing ───────────────────────────────────────────
  const setField = useCallback((id, field, value) => {
    setEditMap(prev => {
      const entry = prev[id];
      if (!entry) return prev;
      return {
        ...prev,
        [id]: { ...entry, edited: { ...entry.edited, [field]: value } },
      };
    });
    // Clear error for this field
    setErrors(prev => {
      const updated = { ...prev };
      if (updated[id]) {
        delete updated[id][field];
        if (Object.keys(updated[id]).length === 0) delete updated[id];
      }
      return updated;
    });
  }, []);

  // ── Cancel editing a row ───────────────────────────────────────────────────
  const cancelEdit = useCallback((id) => {
    setEditMap(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setErrors(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  // ── Cancel all edits ───────────────────────────────────────────────────────
  const cancelAll = useCallback(() => {
    setEditMap({});
    setErrors({});
  }, []);

  // ── Save a single row ──────────────────────────────────────────────────────
  const saveRow = useCallback(async (id) => {
    const entry = editMap[id];
    if (!entry) return;

    setSavingIds(prev => new Set([...prev, id]));
    try {
      let result;
      if (id === '__new__') {
        result = await createRow(category, entry.edited);
      } else {
        result = await updateRow(category, id, entry.edited);
      }

      setEditMap(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      onSaved?.(result.data, id === '__new__' ? 'created' : 'updated');
      return result.data;
    } catch (err) {
      setErrors(prev => ({ ...prev, [id]: { _row: err.message } }));
      throw err;
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [editMap, category, onSaved]);

  // ── Save all dirty rows ────────────────────────────────────────────────────
  const saveAll = useCallback(async () => {
    const ids = Object.keys(editMap);
    const results = await Promise.allSettled(ids.map(id => saveRow(id)));
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      throw new Error(`${failed.length} row(s) failed to save`);
    }
  }, [editMap, saveRow]);

  // ── Delete a row ───────────────────────────────────────────────────────────
  const removeRow = useCallback(async (id) => {
    setSavingIds(prev => new Set([...prev, id]));
    try {
      await deleteRow(category, id);
      onDeleted?.(id);
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [category, onDeleted]);

  // ── Add a blank new row ────────────────────────────────────────────────────
  const addNewRow = useCallback((defaultValues = {}) => {
    setEditMap(prev => ({
      ...prev,
      __new__: {
        original: null,
        edited: { id: '__new__', label: '', value: '', ...defaultValues },
      },
    }));
  }, []);

  // ── beforeunload guard ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  return {
    editMap,
    savingIds,
    errors,
    hasUnsavedChanges,
    startEdit,
    setField,
    cancelEdit,
    cancelAll,
    saveRow,
    saveAll,
    removeRow,
    addNewRow,
    isEditing: (id) => Boolean(editMap[id]),
    isSaving: (id) => savingIds.has(id),
    getEdited: (id) => editMap[id]?.edited || null,
    getError: (id) => errors[id] || null,
  };
}
