"use client";

import { useCallback, useRef, useState } from "react";

export interface GeocodeResult {
  id: string;
  name: string;
  fullName: string;
  lat: number;
  lng: number;
  type?: string;
  confidence?: "high" | "medium" | "low";
  inSudItalia?: boolean;
}

export function useGeocodeSearch(initialQuery = "") {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchPlaces = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.results ?? []);
      } else {
        setSuggestions([]);
      }
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInput = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => searchPlaces(value), 350);
    },
    [searchPlaces]
  );

  const clearSuggestions = useCallback(() => setSuggestions([]), []);

  const syncQuery = useCallback((value: string) => {
    setQuery(value);
    setSuggestions([]);
  }, []);

  return {
    query,
    suggestions,
    searching,
    handleInput,
    clearSuggestions,
    syncQuery,
    setQuery,
  };
}
