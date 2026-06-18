import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * useRecommendations hook
 *
 * Returns personalised event recommendations for the given userId.
 * Also exposes helpers for tracking interactions and saving preferences.
 */
export function useRecommendations(userId, { limit = 10, page = 1 } = {}) {
  const [recommendations, setRecommendations] = useState([]);
  const [source, setSource] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/recommendations?userId=${encodeURIComponent(userId)}&limit=${limit}&page=${page}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRecommendations(data.recommendations ?? []);
      setSource(data.source);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error('[useRecommendations] fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, limit, page]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const trackInteraction = useCallback(
    async (eventId, type) => {
      if (!userId) return;
      try {
        await fetch(`${API_BASE}/api/recommendations/interact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, eventId, type }),
        });
      } catch (err) {
        console.error('[useRecommendations] track error:', err);
      }
    },
    [userId]
  );

  const savePreferences = useCallback(
    async (interests, preferredDays = []) => {
      if (!userId) return;
      try {
        const res = await fetch(`${API_BASE}/api/recommendations/preferences/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interests, preferredDays }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await fetchRecommendations(); // refresh after saving
      } catch (err) {
        console.error('[useRecommendations] savePreferences error:', err);
      }
    },
    [userId, fetchRecommendations]
  );

  return {
    recommendations,
    source,
    total,
    loading,
    error,
    refresh: fetchRecommendations,
    trackInteraction,
    savePreferences,
  };
}

/**
 * useSimilarEvents hook
 */
export function useSimilarEvents(eventId, { limit = 6 } = {}) {
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/recommendations/similar/${encodeURIComponent(eventId)}?limit=${limit}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setSimilar(data.similar ?? []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, limit]);

  return { similar, loading, error };
}

/**
 * useTrendingEvents hook
 */
export function useTrendingEvents({ limit = 10 } = {}) {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/recommendations/trending?limit=${limit}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setTrending(data.trending ?? []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { trending, loading, error };
}
