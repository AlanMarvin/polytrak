
import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client"; // No longer needed for invocation
import { analyzeTrader, TraderData } from "@/lib/polymarket-service";

export type TraderAnalysisStage =
  | "profile"
  | "openPositions"
  | "recentTrades"
  | "closedPositionsSummary"
  | "full";

export function useTraderAnalysis(address: string) {
  const enabled = Boolean(address);
  const lastAutoFullAddressRef = useRef<string | null>(null);
  const autoFullEnabled = true; // Kept for logic structure, but we rely on stages mostly

  const profile = useQuery({
    queryKey: ["trader-analysis", address, "profile"],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: () => analyzeTrader(address, "profile"),
  });

  const openPositions = useQuery({
    queryKey: ["trader-analysis", address, "openPositions"],
    enabled,
    staleTime: 60 * 1000,
    queryFn: () => analyzeTrader(address, "openPositions"),
  });

  const recentTrades = useQuery({
    queryKey: ["trader-analysis", address, "recentTrades"],
    enabled,
    staleTime: 60 * 1000,
    queryFn: () => analyzeTrader(address, "recentTrades"),
  });

  const closedPositionsSummary = useQuery({
    queryKey: ["trader-analysis", address, "closedPositionsSummary"],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: () => analyzeTrader(address, "closedPositionsSummary"),
  });

  // Client-side 'full' aggregation or background fetch is less critical now 
  // since the stages provide the data. We keep the hook structure but disable 'full' fetch
  // or point it to a harmless no-op if logic requires it.
  const full = useQuery({
    queryKey: ["trader-analysis", address, "full"],
    enabled: false,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => ({}), // No-op
  });

  const mergedTrader = useMemo(() => {
    if (!enabled) return null;
    const parts = [
      profile.data?.data,
      closedPositionsSummary.data?.data,
      openPositions.data?.data,
      recentTrades.data?.data,
    ].filter(Boolean);

    if (parts.length === 0) return null;
    const merged = Object.assign({}, ...parts);

    // Provide safe defaults so the UI can render progressively without crashing.
    return {
      address,
      username: null,
      profileImage: null,
      pnl: 0,
      pnlIncludingOpenPartial: 0,
      pnl24h: 0,
      pnl7d: 0,
      pnl30d: 0,
      realizedPnl: 0,
      realizedPnlOpenPartial: 0,
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
        score: "low",
        warnings: [],
        positionsAnalyzed: 0,
        rateLimitRetries: 0,
        hitApiLimit: false,
        dataCompleteness: 0,
      },
      openPositions: [],
      recentTrades: [],
      ...merged,
    };
  }, [
    enabled,
    profile.data?.data,
    closedPositionsSummary.data?.data,
    openPositions.data?.data,
    recentTrades.data?.data,
    address
  ]);

  const hasAnyData = Boolean(mergedTrader);
  const isLoadingAny =
    profile.isLoading ||
    openPositions.isLoading ||
    recentTrades.isLoading ||
    closedPositionsSummary.isLoading;

  const isFetchingAny =
    profile.isFetching ||
    openPositions.isFetching ||
    recentTrades.isFetching ||
    closedPositionsSummary.isFetching;

  const error =
    (profile.error as Error | null) ||
    (openPositions.error as Error | null) ||
    (recentTrades.error as Error | null) ||
    (closedPositionsSummary.error as Error | null) ||
    null;

  return {
    trader: mergedTrader,
    hasAnyData,
    isLoadingAny,
    isFetchingAny,
    error,
    stages: {
      profile,
      openPositions,
      recentTrades,
      closedPositionsSummary,
      full,
    },
  };
}
