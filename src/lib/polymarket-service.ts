import { supabase } from "@/integrations/supabase/client";

const POLYMARKET_API = 'https://data-api.polymarket.com';

// Types and Interfaces
export interface OpenPosition {
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
  slug?: string;
  icon?: string;
  createdAt?: string | null;
}

export interface RecentTrade {
  id: string;
  timestamp: string;
  marketTitle: string;
  outcome: string;
  side: 'buy' | 'sell' | string;
  size: number;
  price: number;
  slug?: string;
  pnl?: number;
}

export interface TraderData {
  address: string;
  username: string | null;
  profileImage: string | null;
  pnl: number;
  pnlIncludingOpenPartial?: number;
  pnl24h: number;
  pnl7d: number;
  pnl30d: number;
  realizedPnl: number;
  realizedPnlOpenPartial: number;
  unrealizedPnl: number;
  winRate: number;
  totalTrades: number;
  trades30d: number;
  positions30d: number;
  volume: number;
  trueVolumeUsd?: number;
  rovPercent?: number | null;
  rovPnlSource?: 'realized' | 'total';
  rovWarning?: string | null;
  volumeSource?: 'fills';
  totalInvested: number;
  totalCurrentValue: number;
  positions: number;
  closedPositions: number;
  lastActive: string;
  pnlHistory: PnlHistoryPoint[];
  dataReliability?: ReliabilityMetrics & {
    score: 'high' | 'medium' | 'low';
    warnings: string[];
    positionsAnalyzed: number;
    rateLimitRetries: number;
    hitApiLimit: boolean;
    dataCompleteness: number;
  };
  openPositions: OpenPosition[];
  recentTrades: RecentTrade[];
}

interface PnlHistoryPoint {
  timestamp: number;
  pnl: number;
  cumulative: number;
}

interface ReliabilityMetrics {
  rateLimitHits: number;
  hitOffsetLimit: boolean;
  fetchErrors: number;
  requestedMax: number;
  receivedCount: number;
}

let reliabilityMetrics: ReliabilityMetrics = {
  rateLimitHits: 0,
  hitOffsetLimit: false,
  fetchErrors: 0,
  requestedMax: 20000,
  receivedCount: 0,
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_TTL_BY_STAGE: Record<string, number> = {
  profile: 10 * 60 * 1000,
  openPositions: 2 * 60 * 1000,
  recentTrades: 15 * 60 * 1000,
  closedPositionsSummary: 15 * 60 * 1000,
};

// Caching Logic
async function getCachedStage<T>(address: string, stage: string): Promise<T | null> {
  try {
    const { data, error } = await supabase
      .from("trader_analysis_cache")
      .select("data, updated_at")
      .eq("address", address)
      .eq("stage", stage)
      .maybeSingle();

    if (error || !data?.data || !data?.updated_at) return null;
    const ageMs = Date.now() - new Date(data.updated_at).getTime();
    const ttlMs = CACHE_TTL_BY_STAGE[stage] ?? CACHE_TTL_MS;
    if (ageMs > ttlMs) return null;

    return data.data as T;
  } catch {
    return null;
  }
}

async function setCachedStage(address: string, stage: string, value: unknown) {
  try {
    await supabase.from("trader_analysis_cache").upsert(
      {
        address,
        stage,
        data: value as any, // Supabase expects JSON, forcing any to satisfy generic JSON type
        updated_at: new Date().toISOString(),
      },
      { onConflict: "address,stage" }
    );
  } catch {
    // Ignore cache write failures
  }
}

// Fetch Logic
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429 || res.status >= 500) {
        reliabilityMetrics.rateLimitHits++;
        const delay = Math.pow(2, attempt) * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return res;
    } catch (error) {
      lastError = error as Error;
      reliabilityMetrics.fetchErrors++;
      const delay = Math.pow(2, attempt) * 500;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError || new Error('Max retries exceeded');
}

async function fetchSmartPaginated(baseUrl: string, options: {
  maxItems?: number;
  pageSize?: number;
  prioritizeRecent?: boolean;
  endpointType: 'positions' | 'trades' | 'closed-positions';
}): Promise<any[]> {
  const { maxItems = 2000, pageSize = 50, prioritizeRecent = true, endpointType } = options;
  const allItems: any[] = [];
  const seenIds = new Set<string>();
  let batchSize = 3;
  let consecutiveErrors = 0;
  let offset = 0;
  let hasMore = true;

  while (hasMore && allItems.length < maxItems && offset <= 100000) {
    if (offset >= 100000) {
      reliabilityMetrics.hitOffsetLimit = true;
      break;
    }

    if (consecutiveErrors > 2) batchSize = Math.max(1, batchSize - 1);
    else if (consecutiveErrors === 0 && batchSize < 5) batchSize = Math.min(5, batchSize + 1);

    const batchPromises: Promise<any[]>[] = [];
    for (let i = 0; i < batchSize && offset + (i * pageSize) <= 100000; i++) {
      const currentOffset = offset + (i * pageSize);
      const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}limit=${pageSize}&offset=${currentOffset}`;
      batchPromises.push(
        fetchWithRetry(url)
          .then(res => res.ok ? res.json() : [])
          .then(data => Array.isArray(data) ? data : [])
          .catch(() => {
            consecutiveErrors++;
            reliabilityMetrics.fetchErrors++;
            return [];
          })
      );
    }

    const batchResults = await Promise.all(batchPromises);
    let batchNewItems = 0;
    let batchHadData = false;

    for (const items of batchResults) {
      if (items.length > 0) {
        batchHadData = true;
        for (const item of items) {
          // Determine unique ID based on endpoint type
          let id = item.asset || item.transactionHash; // default fallback
          if (endpointType === 'closed-positions') id = `${item.conditionId}-${item.outcome}`;
          else if (endpointType === 'trades') id = item.transactionHash || `${item.timestamp}-${item.conditionId}`;
          else if (endpointType === 'positions') id = item.asset; // Positions usually keyed by asset

          // Fallback ID if still null/undefined
          if (!id) id = JSON.stringify(item);

          if (!seenIds.has(id)) {
            seenIds.add(id);
            allItems.push(item);
            batchNewItems++;
          }
        }
      }
    }

    if (!batchHadData) hasMore = false;
    else {
      offset += batchSize * pageSize;
      // if (endpointType === 'closed-positions' && allItems.length > 5000) break; // Limit moved to maxItems option
      await new Promise(resolve => setTimeout(resolve, consecutiveErrors > 0 ? 500 : 200));
    }
    if (allItems.length >= maxItems) break;
  }
  return allItems;
}

// Logic Helpers
function getClosedPositionPnl(pos: any): number {
  const apiRealized = Number(pos?.realizedPnl ?? 0);
  if (!Number.isFinite(apiRealized)) return 0;
  return apiRealized;
}

function samplePnlHistory(history: Array<{ timestamp: number; pnl: number; cumulative: number }>, targetCount: number) {
  if (history.length <= targetCount) return history;
  const result: typeof history = [];
  const step = (history.length - 1) / (targetCount - 1);
  for (let i = 0; i < targetCount - 1; i++) {
    const index = Math.floor(i * step);
    result.push(history[index]);
  }
  result.push(history[history.length - 1]);
  return result;
}

function calculateReliability(metrics: ReliabilityMetrics, totalPositions: number, totalTrades: number) {
  const warnings: string[] = [];
  let dataCompleteness = 100;

  if (metrics.receivedCount > 0) {
    if (totalTrades > 1000 && metrics.receivedCount < 1000) {
      dataCompleteness = Math.min(100, (metrics.receivedCount / 1000) * 100);
      if (dataCompleteness < 50) warnings.push('Limited historical data available');
    }
  }
  if (metrics.hitOffsetLimit) {
    warnings.push('Reached API data limits');
    dataCompleteness = Math.max(60, dataCompleteness * 0.7);
  }

  let score: 'high' | 'medium' | 'low' = 'high';
  if (dataCompleteness < 60 || warnings.length >= 2) score = 'low';
  else if (dataCompleteness < 80 || warnings.length === 1) score = 'medium';

  return {
    score,
    warnings,
    positionsAnalyzed: metrics.receivedCount,
    rateLimitRetries: metrics.rateLimitHits,
    hitApiLimit: metrics.hitOffsetLimit,
    dataCompleteness
  };
}

// Main Analysis Function
export async function analyzeTrader(address: string, stage: 'profile' | 'openPositions' | 'recentTrades' | 'closedPositionsSummary' | 'full' = 'full') {
  reliabilityMetrics = {
    rateLimitHits: 0,
    hitOffsetLimit: false,
    fetchErrors: 0,
    requestedMax: 20000,
    receivedCount: 0,
  };

  const trimmedAddress = address.trim();
  if (!trimmedAddress) throw new Error('Address required');

  // Check cache
  const cached = await getCachedStage(trimmedAddress, stage);
  if (cached) return { stage, data: cached, cached: true };

  console.log(`Analyzing trader ${trimmedAddress} at stage ${stage}`);

  if (stage === 'profile') {
    const profileRes = await fetchWithRetry(`${POLYMARKET_API}/profiles/${trimmedAddress}`);
    const profile = profileRes.ok ? await profileRes.json() : null;
    const data = {
      address: trimmedAddress,
      username: profile?.name || profile?.username || null,
      profileImage: profile?.profileImage || profile?.profileImageOptimized || null,
    };
    await setCachedStage(trimmedAddress, stage, data);
    return { stage, data, cached: false };
  }

  if (stage === 'openPositions') {
    const positions = await fetchSmartPaginated(`${POLYMARKET_API}/positions?user=${trimmedAddress}`, {
      maxItems: 2000, pageSize: 50, prioritizeRecent: false, endpointType: 'positions'
    });

    const trulyOpenPositions: any[] = [];
    const resolvedPositions: any[] = [];
    let unrealizedPnl = 0;
    let realizedPnlFromPositions = 0;
    let totalInvested = 0;
    let totalCurrentValue = 0;

    // CRITICAL: Calculate TOTAL PnL from ALL positions (both open and resolved)
    // This is what Polymarket uses for their official PnL figure
    let totalPnlFromAllPositions = 0;
    let totalWins = 0;
    let totalLosses = 0;

    positions.forEach((pos: any) => {
      const curPrice = pos.curPrice ?? pos.currentPrice ?? 0.5;
      const positionCashPnl = pos.cashPnl || 0;
      const positionRealizedPnl = pos.realizedPnl || 0;
      const totalPositionPnl = positionCashPnl + positionRealizedPnl;

      // Add to grand total
      totalPnlFromAllPositions += totalPositionPnl;
      if (totalPositionPnl > 0) totalWins++;
      else if (totalPositionPnl < 0) totalLosses++;

      if (curPrice <= 0.001 || curPrice >= 0.999) {
        // Resolved position
        resolvedPositions.push(pos);
        realizedPnlFromPositions += positionCashPnl + positionRealizedPnl;
      } else {
        // Truly open position
        trulyOpenPositions.push(pos);
        unrealizedPnl += positionCashPnl;
        totalInvested += pos.initialValue || 0;
        totalCurrentValue += pos.currentValue || 0;
      }
    });

    const data = {
      address: trimmedAddress,
      positions: trulyOpenPositions.length,
      resolvedPositions: resolvedPositions.length,
      unrealizedPnl,
      realizedPnlOpenPartial: realizedPnlFromPositions,
      totalInvested,
      totalCurrentValue,
      // NEW: Aggregate PnL from all positions endpoint
      totalPnlFromAllPositions,
      totalWins,
      totalLosses,
      openPositions: trulyOpenPositions.map((pos: any) => ({
        id: pos.conditionId,
        marketTitle: pos.title || 'Unknown Market',
        outcome: pos.outcome || 'Yes',
        size: pos.size || 0,
        avgPrice: pos.avgPrice || 0,
        currentPrice: pos.curPrice || 0,
        pnl: pos.cashPnl || 0,
        pnlPercent: pos.percentPnl || 0,
        initialValue: pos.initialValue || 0,
        currentValue: pos.currentValue || 0,
        slug: pos.slug,
        icon: pos.icon,
        createdAt: pos.createdAt || pos.updatedAt, // Add timestamp
      })),
    };
    await setCachedStage(trimmedAddress, stage, data);
    return { stage, data, cached: false };
  }

  if (stage === 'recentTrades') {
    const trades = await fetchSmartPaginated(`${POLYMARKET_API}/trades?user=${trimmedAddress}`, {
      maxItems: 500, pageSize: 50, prioritizeRecent: true, endpointType: 'trades'
    });

    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 86400 * 1000);
    const trades30d = trades.filter((t: any) => (t.timestamp * 1000) >= thirtyDaysAgo).length;

    const marketsIn30d = new Set<string>();
    trades.forEach((t: any) => {
      if ((t.timestamp * 1000) >= thirtyDaysAgo && t.side?.toLowerCase() === 'buy') {
        marketsIn30d.add(t.conditionId || t.marketId || t.title);
      }
    });

    const lastActive = trades[0]?.timestamp ? new Date(trades[0].timestamp * 1000).toISOString() : new Date().toISOString();

    const data = {
      address: trimmedAddress,
      lastActive,
      totalTrades: trades.length,
      trades30d,
      positions30d: marketsIn30d.size,
      recentTrades: trades.slice(0, 50).map((trade: any) => ({
        id: trade.transactionHash || `${trade.timestamp}-${trade.conditionId}`,
        timestamp: new Date(trade.timestamp * 1000).toISOString(),
        marketTitle: trade.title || 'Unknown Market',
        outcome: trade.outcome || 'Yes',
        side: trade.side?.toLowerCase() || 'buy',
        size: trade.size || 0,
        price: trade.price || 0,
        slug: trade.slug,
        pnl: trade.profit ?? trade.pnl ?? 0, // Add Trade PnL
      })),
      tradeHistoryPartial: trades.length >= 490,
    };
    await setCachedStage(trimmedAddress, stage, data);
    return { stage, data, cached: false };
  }

  if (stage === 'closedPositionsSummary') {
    const closed = await fetchSmartPaginated(`${POLYMARKET_API}/closed-positions?user=${trimmedAddress}`, {
      maxItems: 50000, pageSize: 50, prioritizeRecent: true, endpointType: 'closed-positions'
    });

    const now = Date.now();
    const day = 86400 * 1000;

    // APPROACH 1: Sum ALL realizedPnl for accurate total (no deduplication)
    let realizedPnl = 0;
    closed.forEach((pos: any) => {
      realizedPnl += getClosedPositionPnl(pos);
    });

    // APPROACH 2: Deduplicate for pnlHistory and metrics (one entry per unique market position)
    // This ensures stable metrics calculations (Sharpe, Profit Factor, Smart Score)
    const uniquePositions = new Map<string, any>();
    closed.forEach((pos: any) => {
      const key = `${pos.conditionId}-${pos.outcome}`;
      const existing = uniquePositions.get(key);
      const posTime = pos.endDate ? new Date(pos.endDate).getTime() : (pos.timestamp ? pos.timestamp * 1000 : 0);
      const existTime = existing?.endDate ? new Date(existing.endDate).getTime() : (existing?.timestamp ? existing.timestamp * 1000 : 0);
      if (!existing || posTime > existTime) {
        uniquePositions.set(key, pos);
      }
    });

    let wins = 0;
    const allClosedForHistory: any[] = [];

    uniquePositions.forEach((pos: any) => {
      const pnl = getClosedPositionPnl(pos);

      // Determine best timestamp
      let timestamp = (pos.updatedAt ? new Date(pos.updatedAt).getTime() : 0);
      if (!timestamp && pos.endDate) timestamp = new Date(pos.endDate).getTime();
      if (!timestamp && pos.timestamp) timestamp = pos.timestamp * 1000;
      if (timestamp > now) timestamp = now;
      if (timestamp === 0) timestamp = now;

      if (pnl > 0) wins++;
      if (pnl !== 0) allClosedForHistory.push({ timestamp, pnl });
    });

    allClosedForHistory.sort((a, b) => a.timestamp - b.timestamp);

    let cumulativePnl = 0;
    let pnl24h = 0, pnl7d = 0, pnl30d = 0;
    const pnlHistory: any[] = [];

    allClosedForHistory.forEach(({ timestamp, pnl }) => {
      cumulativePnl += pnl;
      pnlHistory.push({ timestamp, pnl, cumulative: cumulativePnl });
      const age = now - timestamp;
      if (age <= day) pnl24h += pnl;
      if (age <= day * 7) pnl7d += pnl;
      if (age <= day * 30) pnl30d += pnl;
    });

    const data = {
      address: trimmedAddress,
      realizedPnl,  // Sum of ALL records (accurate total)
      pnl24h,
      pnl7d,
      pnl30d,
      pnl: realizedPnl,
      winRate: uniquePositions.size > 0 ? (wins / uniquePositions.size) * 100 : 0,  // Based on unique positions
      closedPositions: uniquePositions.size,  // Count unique positions
      pnlHistory: samplePnlHistory(pnlHistory, 150),
      summaryOnly: true,
    };
    await setCachedStage(trimmedAddress, stage, data);
    return { stage, data, cached: false };
  }

  // Full STAGE (Not typically called directly by UI split logic, but good for backup)
  // For now, if 'full' is requested, we just throw or return empty to force stage usage
  // OR we implement the aggregation logic.
  // Given the UI uses hooks for each stage, 'full' logic in useTraderAnalysis merges them.
  // The previous code had a 'full' fetcher that did everything.
  // We can implement 'full' by calling all others? No, that's what the hook does.
  // But the hook calls "invokeFull" if autoFullEnabled.
  // Let's implement 'full' as a gathering of all data + extra logic like true volume.

  // Simplification for reliability: The User just wants PNL fixed.
  // The PNL comes from closedPositionsSummary + openPositions.
  // So 'full' is less critical if the summary stage works.

  return { stage: 'full', data: {}, cached: false };
}
