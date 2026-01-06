import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TraderAnalysisStage =
  | "profile"
  | "openPositions"
  | "recentTrades"
  | "closedPositionsSummary"
  | "full";

type StageEnvelope<T> = {
  stage: Exclude<TraderAnalysisStage, "full">;
  data: T;
  cached?: boolean;
};

async function invokeStage<T>(address: string, stage: Exclude<TraderAnalysisStage, "full">) {
  const t0 = performance.now();
  const { data, error } = await supabase.functions.invoke("polymarket-trader", {
    body: { address, stage },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (!data?.data || data.stage !== stage) {
    throw new Error("Unexpected stage response");
  }

  console.debug(`[analysis] stage=${stage} ${Math.round(performance.now() - t0)}ms`, {
    cached: Boolean((data as any).cached),
  });
  return data as StageEnvelope<T>;
}

// Back-compat: the legacy (full) response returns the trader object directly (no envelope).
async function invokeFull<T>(address: string) {
  const t0 = performance.now();
  const { data, error } = await supabase.functions.invoke("polymarket-trader", {
    body: { address },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  console.debug(`[analysis] stage=full ${Math.round(performance.now() - t0)}ms`);
  return data as T;
}

export function useTraderAnalysis(address: string) {
  const enabled = Boolean(address);

  const profile = useQuery({
    queryKey: ["trader-analysis", address, "profile"],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: () =>
      invokeStage<{
        address: string;
        username: string | null;
        profileImage: string | null;
      }>(address, "profile"),
  });

  const openPositions = useQuery({
    queryKey: ["trader-analysis", address, "openPositions"],
    enabled,
    staleTime: 60 * 1000,
    queryFn: () => invokeStage<any>(address, "openPositions"),
  });

  const recentTrades = useQuery({
    queryKey: ["trader-analysis", address, "recentTrades"],
    enabled,
    staleTime: 60 * 1000,
    queryFn: () => invokeStage<any>(address, "recentTrades"),
  });

  const closedPositionsSummary = useQuery({
    queryKey: ["trader-analysis", address, "closedPositionsSummary"],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: () => invokeStage<any>(address, "closedPositionsSummary"),
  });

  // Full history is intentionally manual (avoid duplicating Polymarket fetches by default).
  const full = useQuery({
    queryKey: ["trader-analysis", address, "full"],
    enabled: false,
    staleTime: 5 * 60 * 1000,
    queryFn: () => invokeFull<any>(address),
  });

  // Auto-fetch full history after fast stages succeed.
  useEffect(() => {
    if (!enabled) return;
    if (full.isFetching || full.isSuccess) return;

    const fastDone =
      profile.isSuccess &&
      openPositions.isSuccess &&
      recentTrades.isSuccess &&
      closedPositionsSummary.isSuccess;

    if (fastDone) {
      full.refetch();
    }
  }, [
    enabled,
    profile.isSuccess,
    openPositions.isSuccess,
    recentTrades.isSuccess,
    closedPositionsSummary.isSuccess,
    full.isFetching,
    full.isSuccess,
    full.refetch,
  ]);

  const mergedTrader = useMemo(() => {
    if (!enabled) return null;
    const parts = [
      profile.data?.data,
      closedPositionsSummary.data?.data,
      openPositions.data?.data,
      recentTrades.data?.data,
      full.data,
    ].filter(Boolean);

    if (parts.length === 0) return null;
    const merged = Object.assign({}, ...parts);

    // Provide safe defaults so the UI can render progressively without crashing.
    return {
      address,
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
    full.data,
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
    closedPositionsSummary.isFetching ||
    full.isFetching;

  const error =
    (profile.error as Error | null) ||
    (openPositions.error as Error | null) ||
    (recentTrades.error as Error | null) ||
    (closedPositionsSummary.error as Error | null) ||
    (full.error as Error | null) ||
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

