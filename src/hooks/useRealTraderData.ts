import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRecentSearches } from './useRecentSearches';

export interface RealTraderData {
  address: string;
  username: string | null;
  profileImage: string | null;
  pnl: number;
  pnl24h: number;
  pnl7d: number;
  pnl30d: number;
  realizedPnl: number;
  unrealizedPnl: number;
  winRate: number;
  totalTrades: number;
  trades30d: number;
  positions30d: number;
  volume: number;
  totalInvested: number;
  totalCurrentValue: number;
  positions: number;
  closedPositions: number;
  lastActive: string;
  pnlHistory: Array<{ timestamp: number; pnl: number; cumulative: number }>;
  dataReliability: {
    score: 'high' | 'medium' | 'low';
    warnings: string[];
    positionsAnalyzed: number;
    rateLimitRetries: number;
    hitApiLimit: boolean;
    dataCompleteness: number;
  };
  openPositions: Array<{
    id: string;
    marketTitle: string;
    outcome: string;
    size: number;
    avgPrice: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
    initialValue: number;
    currentValue: number;
    slug: string;
    icon: string;
  }>;
  recentTrades: Array<{
    id: string;
    timestamp: string;
    marketTitle: string;
    outcome: string;
    side: string;
    size: number;
    price: number;
    slug: string;
  }>;
}

export interface RealTraderDataWithMeta extends RealTraderData {
  timestamp: number; // When this data was last fetched/analyzed
  smartScore: number; // Calculated score
  sharpeRatio: number; // Calculated Sharpe ratio
  copySuitability: 'Low' | 'Medium' | 'High'; // Suitability rating
  error?: string; // If fetching failed
  isLoading: boolean;
}

export interface UseRealTraderDataReturn {
  traderData: RealTraderDataWithMeta[];
  isLoadingAll: boolean;
  loadingProgress: { current: number; total: number } | null;
  dataQualitySummary: {
    avgCompleteness: number;
    lowQualityCount: number;
    warningsCount: number;
    totalTraders: number;
  } | null;
  fetchAllTraderData: (forceRefresh?: boolean) => Promise<void>;
  refreshTraderData: (address: string) => Promise<RealTraderDataWithMeta | null>;
  getTraderData: (address: string) => RealTraderDataWithMeta | undefined;
}

// Cache key for localStorage
const CACHE_KEY = 'polytrak_trader_data_cache';
const CACHE_VERSION = 'v1';


interface CacheEntry {
  data: RealTraderDataWithMeta;
  timestamp: number;
  version: string;
}

export const useRealTraderData = (): UseRealTraderDataReturn => {
  const { recentSearches } = useRecentSearches();
  const [traderData, setTraderData] = useState<Map<string, RealTraderDataWithMeta>>(new Map());
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{ current: number; total: number } | null>(null);

  // Load cached data from localStorage (stable, doesn't cause re-renders)
  const loadCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const cacheData: Record<string, CacheEntry> = JSON.parse(cached);
        const validEntries = new Map<string, RealTraderDataWithMeta>();

        Object.entries(cacheData).forEach(([address, entry]) => {
          // Check if cache entry is valid (version match and not too old)
          const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
          if (entry.version === CACHE_VERSION &&
              (Date.now() - entry.timestamp) < CACHE_DURATION) {
            validEntries.set(address, entry.data);
          }
        });

        // Only update state if we have new data
        if (validEntries.size > 0) {
          setTraderData(prev => {
            const merged = new Map(prev);
            validEntries.forEach((data, address) => {
              merged.set(address, data);
            });
            return merged;
          });
        }
        return validEntries;
      }
    } catch (error) {
      console.error('Failed to load cached trader data:', error);
    }
    return new Map();
  }, []);

  // Save data to localStorage cache
  const saveToCache = useCallback((address: string, data: RealTraderDataWithMeta) => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const cacheData: Record<string, CacheEntry> = cached ? JSON.parse(cached) : {};

      cacheData[address] = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save trader data to cache:', error);
    }
  }, []);

  // Calculate Sharpe ratio (simplified version)
  const calculateSharpeRatio = useCallback((data: RealTraderData): number => {
    if (data.pnlHistory.length < 10) return 0;

    const returns = data.pnlHistory.map(p => p.pnl);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // Assume risk-free rate of 0 for simplicity
    return stdDev > 0 ? avgReturn / stdDev : 0;
  }, []);

  // Calculate smart score based on risk-adjusted performance and efficiency
  const calculateSmartScore = useCallback((data: RealTraderData, sharpeRatio: number): number => {
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
    const normalize = (value: number, min: number, max: number) => {
      if (max <= min) return 0;
      return clamp((value - min) / (max - min), 0, 1);
    };

    const winRateScore = normalize(data.winRate, 40, 70);
    const sharpeScore = normalize(sharpeRatio, 0, 2.5);

    const totalTradesLog = Math.log10(data.totalTrades + 1);
    const activityScore = normalize(totalTradesLog, Math.log10(10 + 1), Math.log10(300 + 1));
    const recentActivityScore = normalize(data.positions30d, 3, 30);
    const activityBlend = (activityScore * 0.6) + (recentActivityScore * 0.4);

    const pnlScore = data.pnl > 0
      ? normalize(Math.log10(data.pnl + 1), 0, Math.log10(100000 + 1))
      : 0;
    const pnl30dScore = data.pnl30d > 0
      ? normalize(Math.log10(data.pnl30d + 1), 0, Math.log10(20000 + 1))
      : 0;
    const profitabilityScore = (pnlScore * 0.7) + (pnl30dScore * 0.3);
    const lossPenalty = data.pnl < 0 ? normalize(-data.pnl, 0, 20000) : 0;

    const capitalBase = Math.max(1, data.totalInvested, data.volume);
    const roi = data.pnl / capitalBase;
    const roiScore = roi > 0 ? normalize(roi, 0, 0.25) : 0;
    const roiPenalty = roi < 0 ? normalize(-roi, 0, 0.25) : 0;

    const reliabilityScore = normalize(data.dataReliability.dataCompleteness, 50, 100);

    let score = (
      sharpeScore * 0.3 +
      profitabilityScore * 0.25 +
      roiScore * 0.15 +
      winRateScore * 0.15 +
      activityBlend * 0.1 +
      reliabilityScore * 0.05
    ) * 100;

    score -= (lossPenalty * 10 + roiPenalty * 10);

    const sampleFactor = normalize(data.totalTrades, 10, 60);
    score *= 0.6 + (sampleFactor * 0.4);

    if (data.dataReliability.score === 'low') score *= 0.85;
    else if (data.dataReliability.score === 'medium') score *= 0.93;

    return Math.round(clamp(score, 0, 100));
  }, []);

  // Determine copy suitability
  const calculateCopySuitability = useCallback((data: RealTraderData, smartScore: number): 'Low' | 'Medium' | 'High' => {
    if (smartScore >= 80 && data.winRate >= 65 && data.pnl > 5000) return 'High';
    if (smartScore >= 60 && data.winRate >= 55 && data.pnl > 1000) return 'Medium';
    return 'Low';
  }, []);

  // Fetch data for a single address
  const fetchTraderData = useCallback(async (address: string): Promise<RealTraderDataWithMeta | null> => {
      try {
      // Don't clear existing data, just mark as loading
      setTraderData(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(address);
        if (existing) {
          newMap.set(address, { ...existing, isLoading: true, error: undefined });
        } else {
          // For new addresses, create a placeholder
          newMap.set(address, {
            address,
            timestamp: Date.now(),
            smartScore: 0,
            sharpeRatio: 0,
            copySuitability: 'Low',
            isLoading: true,
            username: null,
            profileImage: null,
            pnl: 0,
            pnl24h: 0,
            pnl7d: 0,
            pnl30d: 0,
            realizedPnl: 0,
            unrealizedPnl: 0,
            winRate: 0,
            totalTrades: 0,
            trades30d: 0,
            positions30d: 0,
            volume: 0,
            totalInvested: 0,
            totalCurrentValue: 0,
            positions: 0,
            closedPositions: 0,
            lastActive: new Date().toISOString(),
            pnlHistory: [],
            dataReliability: {
              score: 'low',
              warnings: [],
              positionsAnalyzed: 0,
              rateLimitRetries: 0,
              hitApiLimit: false,
              dataCompleteness: 0,
            },
            openPositions: [],
            recentTrades: [],
          } as RealTraderDataWithMeta);
        }
        return newMap;
      });

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const { data, error } = await supabase.functions.invoke('polymarket-trader', {
        body: { address }
      });

      clearTimeout(timeoutId);

      if (error) throw error;

      const sharpeRatio = calculateSharpeRatio(data);
      const smartScore = calculateSmartScore(data, sharpeRatio);
      const copySuitability = calculateCopySuitability(data, smartScore);

      const result: RealTraderDataWithMeta = {
        ...data,
        timestamp: Date.now(),
        smartScore,
        sharpeRatio,
        copySuitability,
        isLoading: false,
      };

      setTraderData(prev => new Map(prev).set(address, result));
      saveToCache(address, result);
      return result;

    } catch (error) {
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      console.error(`Failed to fetch data for ${address}:`, error);

      // Update existing data with error state (don't replace)
      setTraderData(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(address);
        if (existing) {
          newMap.set(address, {
            ...existing,
            isLoading: false,
            error: isTimeout ? 'Request timed out (30s) - API may be slow' : (error instanceof Error ? error.message : 'Failed to fetch data')
          });
        }
        return newMap;
      });

      return null;
    }
  }, [calculateSmartScore, calculateSharpeRatio, calculateCopySuitability]);

  // Fetch data for all recent searches (only missing/expired data)
  const fetchAllTraderData = useCallback(async (forceRefresh = false) => {
    if (recentSearches.length === 0) return;

    const addresses = recentSearches.map(search => search.address);
    const currentData = traderData;
    const CACHE_TTL = forceRefresh ? 0 : 5 * 60 * 1000; // 5 minutes, or 0 for force refresh
    const now = Date.now();

    // Find addresses that need fetching
    const addressesToFetch = addresses.filter(address => {
      const existing = currentData.get(address);
      if (!existing) return true; // Never fetched
      if (existing.error) return true; // Had error, try again
      return (now - existing.timestamp) > CACHE_TTL; // Cache expired
    });

    if (addressesToFetch.length === 0) {
      return; // Everything is cached and fresh
    }

    setIsLoadingAll(true);
    setLoadingProgress({ current: 0, total: addressesToFetch.length });

    // Fetch in parallel with controlled concurrency
    const CONCURRENT_LIMIT = 3; // Be more conservative
    let completed = 0;

    for (let i = 0; i < addressesToFetch.length; i += CONCURRENT_LIMIT) {
      const batch = addressesToFetch.slice(i, i + CONCURRENT_LIMIT);
      const batchPromises = batch.map(async (address) => {
        try {
          await fetchTraderData(address);
        } catch (error) {
          console.error(`Failed to fetch ${address}:`, error);
        } finally {
          completed++;
          setLoadingProgress({ current: completed, total: addressesToFetch.length });
        }
      });

      await Promise.all(batchPromises);

      // Small delay between batches
      if (i + CONCURRENT_LIMIT < addressesToFetch.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    setIsLoadingAll(false);
    setLoadingProgress(null);
  }, [recentSearches, traderData, fetchTraderData]);

  // Refresh data for a specific address
  const refreshTraderData = useCallback((address: string) => {
    return fetchTraderData(address);
  }, [fetchTraderData]);

  // Get trader data for a specific address
  const getTraderData = useCallback((address: string): RealTraderDataWithMeta | undefined => {
    return traderData.get(address);
  }, [traderData]);

  // Get all trader data as array
  const getAllTraderData = useCallback((): RealTraderDataWithMeta[] => {
    return Array.from(traderData.values());
  }, [traderData]);

  // Calculate overall data quality summary
  const dataQualitySummary = useMemo(() => {
    const traders = getAllTraderData();
    if (traders.length === 0) return null;

    const totalCompleteness = traders.reduce((sum, t) => sum + t.dataReliability.dataCompleteness, 0);
    const avgCompleteness = Math.round(totalCompleteness / traders.length);
    const lowQualityCount = traders.filter(t => t.dataReliability.score === 'low').length;
    const warningsCount = traders.reduce((sum, t) => sum + t.dataReliability.warnings.length, 0);

    return {
      avgCompleteness,
      lowQualityCount,
      warningsCount,
      totalTraders: traders.length
    };
  }, [getAllTraderData]);

  // Load cached data on mount
  useEffect(() => {
    loadCachedData();
  }, [loadCachedData]);

  // Load data when recent searches change
  useEffect(() => {
    if (recentSearches.length > 0) {
      // Fetch data for all addresses
      const timer = setTimeout(() => {
        fetchAllTraderData(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [recentSearches]);

  // Clean up data for addresses that are no longer in recent searches
  useEffect(() => {
    const addresses = recentSearches.map(search => search.address);
    const existingAddresses = Array.from(traderData.keys());
    const addressesToRemove = existingAddresses.filter(addr => !addresses.includes(addr));

    if (addressesToRemove.length > 0) {
      setTraderData(prev => {
        const newMap = new Map(prev);
        addressesToRemove.forEach(addr => newMap.delete(addr));
        return newMap;
      });
    }
  }, [recentSearches, traderData]);

  return {
    traderData: getAllTraderData(),
    isLoadingAll,
    loadingProgress,
    dataQualitySummary,
    fetchAllTraderData,
    refreshTraderData,
    getTraderData,
  };
};
