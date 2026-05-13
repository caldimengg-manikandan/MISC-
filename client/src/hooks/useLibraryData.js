/**
 * useLibraryData.js
 * Fetches and caches library data per category with a 30-second TTL.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchCategory, fetchCategorySummary } from '../api/libraryApi';

const CACHE_TTL = 30 * 1000; // 30 seconds

// Module-level cache (shared across all hook instances)
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// ── useCategorySummary ────────────────────────────────────────────────────────
export function useCategorySummary() {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const cached = getCached('__summary__');
    if (cached) {
      setSummary(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchCategorySummary();
      setCache('__summary__', res.summary);
      setSummary(res.summary);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { summary, loading, error, refresh };
}

// ── useLibraryData ────────────────────────────────────────────────────────────
export function useLibraryData(category) {
  const [data, setData] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const refresh = useCallback(async (force = false) => {
    if (!category || category === '__rates__') return;

    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!force) {
      const cached = getCached(category);
      if (cached) {
        setData(cached.data);
        setMetadata(cached.metadata);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetchCategory(category);
      const payload = { data: res.data, metadata: res.metadata };
      setCache(category, payload);
      setData(res.data);
      setMetadata(res.metadata);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [category]);

  // Invalidate cache for this category
  const invalidate = useCallback(() => {
    cache.delete(category);
    cache.delete('__summary__');
  }, [category]);

  // Refresh when category changes
  useEffect(() => {
    refresh();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [refresh]);

  return { data, metadata, loading, error, refresh, invalidate };
}
