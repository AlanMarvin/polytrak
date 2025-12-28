import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'polytrak_recent_wallets';
const MAX_ENTRIES = 12;

export interface RecentSearch {
  address: string;
  timestamp: number;
  smartScore: number;
  sharpeRatio: number;
  copySuitability: 'Low' | 'Medium' | 'High';
  totalPnl: number;
  winRate: number;
  volume: number;
}

export const useRecentSearches = () => {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Handle backwards compatibility - add default values for new fields
        const migrated = parsed.map((search: any) => ({
          ...search,
          totalPnl: search.totalPnl ?? 0,
          winRate: search.winRate ?? 0,
          volume: search.volume ?? 0,
        }));
        setRecentSearches(migrated);
      }
    } catch (e) {
      console.error('Failed to load recent searches:', e);
    }
  }, []);

  const addSearch = useCallback((search: Omit<RecentSearch, 'timestamp'>) => {
    setRecentSearches(prev => {
      // Remove existing entry for same address
      const filtered = prev.filter(s => s.address.toLowerCase() !== search.address.toLowerCase());
      
      // Add new entry at front
      const newEntry: RecentSearch = {
        ...search,
        timestamp: Date.now()
      };
      
      const updated = [newEntry, ...filtered].slice(0, MAX_ENTRIES);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save recent searches:', e);
      }
      
      return updated;
    });
  }, []);

  const clearSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear recent searches:', e);
    }
  }, []);

  return { recentSearches, addSearch, clearSearches };
};

// Standalone function to add search (for use outside hook context)
export const saveRecentSearch = (search: Omit<RecentSearch, 'timestamp'>) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const current: RecentSearch[] = stored ? JSON.parse(stored) : [];

    // Remove existing entry for same address
    const filtered = current.filter(s => s.address.toLowerCase() !== search.address.toLowerCase());

    // Add new entry at front
    const newEntry: RecentSearch = {
      ...search,
      timestamp: Date.now(),
      totalPnl: search.totalPnl ?? 0,
      winRate: search.winRate ?? 0,
      volume: search.volume ?? 0,
    };

    const updated = [newEntry, ...filtered].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save recent search:', e);
  }
};
