import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const POLYMARKET_API = 'https://data-api.polymarket.com';

// Sample PnL history to get evenly distributed points across the full timeframe
function samplePnlHistory(history: Array<{ timestamp: number; pnl: number; cumulative: number }>, targetCount: number) {
  if (history.length <= targetCount) return history;
  
  const result: typeof history = [];
  const step = (history.length - 1) / (targetCount - 1);
  
  for (let i = 0; i < targetCount - 1; i++) {
    const index = Math.floor(i * step);
    result.push(history[index]);
  }
  // Always include the last point
  result.push(history[history.length - 1]);
  
  return result;
}

// Reliability tracking for data accuracy warnings
interface ReliabilityMetrics {
  rateLimitHits: number;
  hitOffsetLimit: boolean;
  fetchErrors: number;
  requestedMax: number;
  receivedCount: number;
}

// Global reliability tracker (reset per request)
let reliabilityMetrics: ReliabilityMetrics = {
  rateLimitHits: 0,
  hitOffsetLimit: false,
  fetchErrors: 0,
  requestedMax: 0,
  receivedCount: 0,
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_BY_STAGE: Record<string, number> = {
  profile: 10 * 60 * 1000,
  openPositions: 2 * 60 * 1000,
  recentTrades: 15 * 60 * 1000,
  closedPositionsSummary: 15 * 60 * 1000,
};
let supabaseAdmin:
  | ReturnType<typeof createClient>
  | null = null;

function getSupabaseAdminClient() {
  if (supabaseAdmin) return supabaseAdmin;
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    Deno.env.get("SUPABASE_SERVICE_ROLE") ||
    Deno.env.get("SERVICE_ROLE_KEY") ||
    "";

  if (!supabaseUrl || !serviceRoleKey) return null;

  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  return supabaseAdmin;
}

async function getCachedStage<T>(address: string, stage: string): Promise<T | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  try {
    const result = await supabase
      .from("trader_analysis_cache")
      .select("data, updated_at")
      .eq("address", address)
      .eq("stage", stage)
      .maybeSingle();

    const data = result.data as { data: unknown; updated_at: string } | null;
    const error = result.error;

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
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  try {
    await (supabase
      .from("trader_analysis_cache") as unknown as { upsert: (data: Record<string, unknown>, opts: Record<string, string>) => Promise<unknown> })
      .upsert(
        {
          address,
          stage,
          data: value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "address,stage" },
      );
  } catch {
    // Ignore cache write failures to avoid impacting user-facing requests
  }
}

// Helper to fetch with retry and exponential backoff
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url);
      
      // Handle rate limiting (429) or server errors (5xx)
      if (res.status === 429 || res.status >= 500) {
        reliabilityMetrics.rateLimitHits++; // Track rate limit hits
        const delay = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s
        console.log(`Rate limited/error on ${url}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return res;
    } catch (error) {
      lastError = error as Error;
      reliabilityMetrics.fetchErrors++; // Track fetch errors
      const delay = Math.pow(2, attempt) * 500;
      console.log(`Fetch error on ${url}: ${lastError.message}, retrying in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

// Smart data fetching with quality prioritization
// Focuses on recent data and adapts to API limits
async function fetchSmartPaginated(baseUrl: string, options: {
  maxItems?: number;
  pageSize?: number;
  prioritizeRecent?: boolean;
  endpointType: 'positions' | 'trades' | 'closed-positions';
}): Promise<any[]> {
  const {
    maxItems = 2000,
    pageSize = 50,
    prioritizeRecent = true,
    endpointType
  } = options;

  const allItems: any[] = [];
  const seenIds = new Set<string>();

  // Adaptive batching - start conservative, adapt based on success
  let batchSize = 3; // Start with smaller batches
  let consecutiveErrors = 0;
  let offset = 0;
  let hasMore = true;

  console.log(`Starting smart fetch for ${endpointType} (${prioritizeRecent ? 'recent-first' : 'complete'} mode)`);

  while (hasMore && allItems.length < maxItems && offset <= 100000) {
    // Check API limits
    if (offset >= 100000) {
      reliabilityMetrics.hitOffsetLimit = true;
      console.log(`Hit API offset limit (100,000) for ${endpointType}`);
      break;
    }

    // Adaptive batch size based on error rate
    if (consecutiveErrors > 2) {
      batchSize = Math.max(1, batchSize - 1); // Reduce batch size on errors
      consecutiveErrors = 0;
    } else if (consecutiveErrors === 0 && batchSize < 5) {
      batchSize = Math.min(5, batchSize + 1); // Gradually increase on success
    }

    const batchPromises: Promise<any[]>[] = [];

    // Create batch requests
    for (let i = 0; i < batchSize && offset + (i * pageSize) <= 100000; i++) {
      const currentOffset = offset + (i * pageSize);
      const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}limit=${pageSize}&offset=${currentOffset}`;

      batchPromises.push(
        fetchWithRetry(url)
          .then(res => {
            if (res.ok) {
              consecutiveErrors = 0; // Reset error counter on success
              return res.json();
            } else {
              consecutiveErrors++;
              return [];
            }
          })
          .then(data => Array.isArray(data) ? data : [])
          .catch(() => {
            consecutiveErrors++;
            reliabilityMetrics.fetchErrors++;
            return [];
          })
      );
    }

    // Execute batch
    const batchResults = await Promise.all(batchPromises);

    let batchNewItems = 0;
    let batchHadData = false;

    // Process results
    for (const items of batchResults) {
      if (items.length > 0) {
        batchHadData = true;
        for (const item of items) {
          const id = item.asset || item.transactionHash || `${item.conditionId}-${item.outcome}` || `${item.timestamp}-${item.size}`;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            allItems.push(item);
            batchNewItems++;
          }
        }
      }
    }

    // Decide whether to continue
    if (!batchHadData) {
      hasMore = false;
    } else {
      offset += batchSize * pageSize;

      // For high-volume traders, be more conservative after getting initial data
      if (allItems.length > 1000 && endpointType === 'closed-positions') {
        reliabilityMetrics.receivedCount = allItems.length;
        if (allItems.length > 5000) {
          // This is a high-volume trader - limit further fetching to avoid timeouts
          console.log(`High-volume trader detected (${allItems.length} items), limiting further fetches`);
          break;
        }
      }

      // Adaptive delay based on error rate
      const delay = consecutiveErrors > 0 ? 500 : 200;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Early exit if we have enough quality data
    if (allItems.length >= maxItems) break;
  }

  console.log(`Smart fetch completed: ${allItems.length} items for ${endpointType} (batch size adapted to ${batchSize})`);
  return allItems;
}

// Calculate data reliability score with smarter assessment
function calculateReliability(metrics: ReliabilityMetrics, totalPositions: number, totalTrades: number): {
  score: 'high' | 'medium' | 'low';
  warnings: string[];
  positionsAnalyzed: number;
  rateLimitRetries: number;
  hitApiLimit: boolean;
  dataCompleteness: number; // 0-100 percentage
} {
  const warnings: string[] = [];
  let dataCompleteness = 100;

  // Assess data completeness based on what we got vs. expected
  if (metrics.receivedCount > 0) {
    // For traders with many positions, expect more data
    if (totalTrades > 1000 && metrics.receivedCount < 1000) {
      dataCompleteness = Math.min(100, (metrics.receivedCount / 1000) * 100);
      if (dataCompleteness < 50) {
        warnings.push('Limited historical data available - focus on recent performance');
      }
    }
  }

  // High-volume trader assessment
  if (metrics.receivedCount > 8000) {
    warnings.push('High-volume trader - using smart sampling for performance');
    dataCompleteness = Math.max(70, dataCompleteness * 0.8);
  }

  // API limit reached
  if (metrics.hitOffsetLimit) {
    warnings.push('Reached API data limits - older positions not included');
    dataCompleteness = Math.max(60, dataCompleteness * 0.7);
  }

  // Rate limiting issues
  if (metrics.rateLimitHits > 20) {
    warnings.push('API rate limiting encountered - some data may be missing');
    dataCompleteness = Math.max(50, dataCompleteness * 0.8);
  }

  // Multiple fetch errors
  if (metrics.fetchErrors > 5) {
    warnings.push('Network issues during data collection');
    dataCompleteness = Math.max(40, dataCompleteness * 0.6);
  }

  // Calculate reliability score based on completeness and warnings
  let score: 'high' | 'medium' | 'low' = 'high';

  if (dataCompleteness < 60 || warnings.length >= 2) {
    score = 'low';
  } else if (dataCompleteness < 80 || warnings.length === 1) {
    score = 'medium';
  }

  return {
    score,
    warnings,
    positionsAnalyzed: metrics.receivedCount,
    rateLimitRetries: metrics.rateLimitHits,
    hitApiLimit: metrics.hitOffsetLimit,
    dataCompleteness
  };
}

function getClosedPositionPnl(pos: any): number {
  // The realizedPnl field from Polymarket API is already the PnL in USD
  // No need to multiply by price difference - that was causing inflated PnL values
  const realized = Number(pos?.realizedPnl ?? 0);
  if (!Number.isFinite(realized)) return 0;
  return realized;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Reset reliability metrics for this request
    reliabilityMetrics = {
      rateLimitHits: 0,
      hitOffsetLimit: false,
      fetchErrors: 0,
      requestedMax: 20000,
      receivedCount: 0,
    };
    
    const { address, stage } = await req.json();
    const normalizedStage = (typeof stage === 'string' ? stage : 'full') as
      | 'profile'
      | 'openPositions'
      | 'recentTrades'
      | 'closedPositionsSummary'
      | 'full';

    if (!address || typeof address !== 'string') {
      console.error('No address provided');
      return new Response(
        JSON.stringify({ error: 'Address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedAddress = address.trim();

    // Validate Ethereum address format (0x + 40 hex characters)
    if (!/^0x[a-fA-F0-9]{40}$/i.test(trimmedAddress)) {
      console.error(`Invalid address format: ${trimmedAddress}`);
      return new Response(
        JSON.stringify({ error: 'Invalid Ethereum address format. Expected 0x followed by 40 hex characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching data for address: ${trimmedAddress}`);

    // ---------------------------------------------
    // Staged mode: return partial results quickly
    // ---------------------------------------------
    if (normalizedStage === 'profile') {
      const t0 = performance.now();
      reliabilityMetrics.requestedMax = 1;

      const cached = await getCachedStage<{
        address: string;
        username: string | null;
        profileImage: string | null;
      }>(trimmedAddress, "profile");
      if (cached) {
        console.log(`[stage=profile] cache hit in ${Math.round(performance.now() - t0)}ms`);
        return new Response(
          JSON.stringify({ stage: 'profile', data: cached, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const profileRes = await fetchWithRetry(`${POLYMARKET_API}/profiles/${trimmedAddress}`);
      const profile = profileRes.ok ? await profileRes.json() : null;

      const data = {
        address: trimmedAddress,
        username: profile?.name || profile?.username || profile?.pseudonym || null,
        profileImage: profile?.profileImage || profile?.profileImageOptimized || profile?.image || profile?.avatar || null,
      };

      await setCachedStage(trimmedAddress, "profile", data);
      console.log(`[stage=profile] computed in ${Math.round(performance.now() - t0)}ms`);
      return new Response(
        JSON.stringify({ stage: 'profile', data, cached: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (normalizedStage === 'openPositions') {
      const t0 = performance.now();
      reliabilityMetrics.requestedMax = 2000;

      const cached = await getCachedStage<any>(trimmedAddress, "openPositions");
      if (cached) {
        console.log(`[stage=openPositions] cache hit in ${Math.round(performance.now() - t0)}ms`);
        return new Response(
          JSON.stringify({ stage: 'openPositions', data: cached, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const positions = await fetchSmartPaginated(`${POLYMARKET_API}/positions?user=${trimmedAddress}`, {
        maxItems: 2000,
        pageSize: 50,
        prioritizeRecent: false,
        endpointType: 'positions'
      });

      const allPositions = Array.isArray(positions) ? positions : [];
      const trulyOpenPositions: any[] = [];
      const resolvedPositions: any[] = [];

      allPositions.forEach((pos: any) => {
        const curPrice = pos.curPrice ?? pos.currentPrice ?? 0.5;
        if (curPrice <= 0.001 || curPrice >= 0.999) resolvedPositions.push(pos);
        else trulyOpenPositions.push(pos);
      });

      let unrealizedPnl = 0;
      let realizedPnlOpenPartial = 0;
      let totalInvested = 0;
      let totalCurrentValue = 0;

      trulyOpenPositions.forEach((pos: any) => {
        unrealizedPnl += pos.cashPnl || 0;
        realizedPnlOpenPartial += pos.realizedPnl || 0;
        totalInvested += pos.initialValue || 0;
        totalCurrentValue += pos.currentValue || 0;
      });

      const data = {
        address: trimmedAddress,
        positions: trulyOpenPositions.length,
        resolvedPositions: resolvedPositions.length,
        unrealizedPnl,
        realizedPnlOpenPartial,
        totalInvested,
        totalCurrentValue,
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
        })),
      };

      await setCachedStage(trimmedAddress, "openPositions", data);
      console.log(`[stage=openPositions] computed in ${Math.round(performance.now() - t0)}ms (open=${data.positions})`);
      return new Response(
        JSON.stringify({ stage: 'openPositions', data, cached: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (normalizedStage === 'recentTrades') {
      const t0 = performance.now();
      reliabilityMetrics.requestedMax = 500;

      const cached = await getCachedStage<any>(trimmedAddress, "recentTrades");
      if (cached) {
        console.log(`[stage=recentTrades] cache hit in ${Math.round(performance.now() - t0)}ms`);
        return new Response(
          JSON.stringify({ stage: 'recentTrades', data: cached, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const trades = await fetchSmartPaginated(`${POLYMARKET_API}/trades?user=${trimmedAddress}`, {
        maxItems: 500, // fast-first: enough to derive activity + recent list
        pageSize: 50,
        prioritizeRecent: true,
        endpointType: 'trades'
      });

      const allTrades = Array.isArray(trades) ? trades : [];
      const now = Date.now();
      const day = 86400 * 1000;
      const thirtyDaysAgo = now - (30 * day);

      const trades30d = allTrades.filter((trade: any) => {
        const timestamp = trade.timestamp
          ? (trade.timestamp < 10000000000 ? trade.timestamp * 1000 : trade.timestamp)
          : 0;
        return timestamp >= thirtyDaysAgo;
      }).length;

      const marketsIn30d = new Set<string>();
      allTrades.forEach((trade: any) => {
        const timestamp = trade.timestamp
          ? (trade.timestamp < 10000000000 ? trade.timestamp * 1000 : trade.timestamp)
          : 0;
        if (timestamp >= thirtyDaysAgo && trade.side?.toLowerCase() === 'buy') {
          const marketId = trade.conditionId || trade.marketId || trade.title;
          if (marketId) marketsIn30d.add(marketId);
        }
      });
      const positions30d = marketsIn30d.size;

      const lastTrade = allTrades[0];
      const lastActive = lastTrade?.timestamp
        ? new Date(lastTrade.timestamp * 1000).toISOString()
        : new Date().toISOString();

      const data = {
        address: trimmedAddress,
        lastActive,
        totalTrades: allTrades.length,
        trades30d,
        positions30d,
        recentTrades: allTrades.slice(0, 50).map((trade: any) => ({
          id: trade.transactionHash || `${trade.timestamp}-${trade.conditionId}`,
          timestamp: trade.timestamp ? new Date(trade.timestamp * 1000).toISOString() : new Date().toISOString(),
          marketTitle: trade.title || 'Unknown Market',
          outcome: trade.outcome || 'Yes',
          side: trade.side?.toLowerCase() || 'buy',
          size: trade.size || 0,
          price: trade.price || 0,
          slug: trade.slug,
        })),
        tradeHistoryPartial: allTrades.length >= 490, // heuristic: indicates truncation vs full activity
      };

      await setCachedStage(trimmedAddress, "recentTrades", data);
      console.log(`[stage=recentTrades] computed in ${Math.round(performance.now() - t0)}ms (trades=${data.totalTrades})`);
      return new Response(
        JSON.stringify({ stage: 'recentTrades', data, cached: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (normalizedStage === 'closedPositionsSummary') {
      const t0 = performance.now();
      reliabilityMetrics.requestedMax = 1500;

      const cached = await getCachedStage<any>(trimmedAddress, "closedPositionsSummary");
      if (cached) {
        console.log(`[stage=closedPositionsSummary] cache hit in ${Math.round(performance.now() - t0)}ms`);
        return new Response(
          JSON.stringify({ stage: 'closedPositionsSummary', data: cached, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const closedPositions = await fetchSmartPaginated(`${POLYMARKET_API}/closed-positions?user=${trimmedAddress}`, {
        maxItems: 1500, // summary stage: cap for speed
        pageSize: 50,
        prioritizeRecent: true,
        endpointType: 'closed-positions'
      });

      const closed = Array.isArray(closedPositions) ? closedPositions : [];
      reliabilityMetrics.receivedCount = closed.length;

      // Deduplicate closed positions (partial closes) by conditionId+outcome, keep latest endDate
      const finalPositions = new Map<string, any>();
      closed.forEach((pos: any) => {
        const key = `${pos.conditionId}-${pos.outcome}`;
        const existing = finalPositions.get(key);
        if (!existing) {
          finalPositions.set(key, pos);
          return;
        }
        const existingEndDate = existing.endDate ? new Date(existing.endDate).getTime() : 0;
        const newEndDate = pos.endDate ? new Date(pos.endDate).getTime() : 0;
        if (newEndDate > existingEndDate) finalPositions.set(key, pos);
      });

      let realizedPnl = 0;
      let wins = 0;
      let totalClosed = 0;

      const now = Date.now();
      const day = 86400 * 1000;
      const allClosedForHistory: Array<{ timestamp: number; pnl: number }> = [];

      finalPositions.forEach((pos: any) => {
        const pnl = getClosedPositionPnl(pos);
        let timestamp: number;
        if (pos.endDate) timestamp = new Date(pos.endDate).getTime();
        else if (pos.timestamp) timestamp = pos.timestamp < 10000000000 ? pos.timestamp * 1000 : pos.timestamp;
        else timestamp = now;

        totalClosed += 1;
        realizedPnl += pnl;
        if (pnl > 0) wins += 1;
        if (pnl !== 0) allClosedForHistory.push({ timestamp, pnl });
      });

      allClosedForHistory.sort((a, b) => a.timestamp - b.timestamp);
      const pnlHistory: Array<{ timestamp: number; pnl: number; cumulative: number }> = [];
      let cumulativePnl = 0;
      let pnl24h = 0;
      let pnl7d = 0;
      let pnl30d = 0;

      allClosedForHistory.forEach(({ timestamp, pnl }) => {
        cumulativePnl += pnl;
        pnlHistory.push({ timestamp, pnl, cumulative: cumulativePnl });
        const age = now - timestamp;
        if (age <= day) pnl24h += pnl;
        if (age <= day * 7) pnl7d += pnl;
        if (age <= day * 30) pnl30d += pnl;
      });

      const winRate = totalClosed > 0 ? (wins / totalClosed) * 100 : 0;
      const dataReliability = calculateReliability(reliabilityMetrics, finalPositions.size, 0);
      if (closed.length >= 1490) {
        dataReliability.warnings.push('Partial history (summary) — full results still loading');
        if (dataReliability.score === 'high') dataReliability.score = 'medium';
      }

      const data = {
        address: trimmedAddress,
        realizedPnl,
        pnl24h,
        pnl7d,
        pnl30d,
        pnl: realizedPnl, // summary: realized-only until full stage arrives
        winRate,
        closedPositions: finalPositions.size,
        pnlHistory: samplePnlHistory(pnlHistory, 150),
        dataReliability,
        summaryOnly: true,
      };

      await setCachedStage(trimmedAddress, "closedPositionsSummary", data);
      console.log(`[stage=closedPositionsSummary] computed in ${Math.round(performance.now() - t0)}ms (uniqueClosed=${data.closedPositions})`);
      return new Response(
        JSON.stringify({ stage: 'closedPositionsSummary', data, cached: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch profile first (quick)
    const profileRes = await fetch(`${POLYMARKET_API}/profiles/${trimmedAddress}`);
    const profile = profileRes.ok ? await profileRes.json() : null;
    console.log('Profile data:', JSON.stringify(profile));

    // Smart data fetching with quality prioritization
    // Focus on recent, accurate data rather than trying to get everything
    console.log('Starting smart data collection...');
    const tAll = performance.now();

    const [positions, trades, closedPositions] = await Promise.all([
      // Get current positions (usually small, high priority)
      fetchSmartPaginated(`${POLYMARKET_API}/positions?user=${trimmedAddress}`, {
        maxItems: 2000,
        pageSize: 50,
        prioritizeRecent: false,
        endpointType: 'positions'
      }),

      // Get recent trades (most relevant for activity metrics)
      fetchSmartPaginated(`${POLYMARKET_API}/trades?user=${trimmedAddress}`, {
        maxItems: 5000, // Limit to recent trades
        pageSize: 50,
        prioritizeRecent: true,
        endpointType: 'trades'
      }),

      // Get closed positions (critical for PnL, but limit for performance)
      fetchSmartPaginated(`${POLYMARKET_API}/closed-positions?user=${trimmedAddress}`, {
        maxItems: 8000, // Reasonable limit to avoid timeouts
        pageSize: 50,
        prioritizeRecent: true, // Prioritize recent closed positions
        endpointType: 'closed-positions'
      })
    ]);

    console.log(`Fetched ${positions.length} positions, ${trades.length} trades, ${closedPositions.length} closed positions`);

    // Update reliability metrics with received counts
    reliabilityMetrics.receivedCount = closedPositions.length;

    // Calculate aggregated stats
    const allPositions = Array.isArray(positions) ? positions : [];
    const allTrades = Array.isArray(trades) ? trades : [];
    const closed = Array.isArray(closedPositions) ? closedPositions : [];

    console.log(`Raw data: ${allPositions.length} positions, ${allTrades.length} trades, ${closed.length} closed positions`);

    // CRITICAL: Separate truly open positions from resolved ones
    // Positions with currentPrice=0 or currentPrice=1 have RESOLVED (settled)
    // Only positions with 0 < currentPrice < 1 are truly open
    const trulyOpenPositions: any[] = [];
    const resolvedPositions: any[] = []; // Positions that settled but API still returns them

    allPositions.forEach((pos: any) => {
      const curPrice = pos.curPrice ?? pos.currentPrice ?? 0.5;
      // If price is exactly 0 or 1, the market has settled
      if (curPrice <= 0.001 || curPrice >= 0.999) {
        resolvedPositions.push(pos);
      } else {
        trulyOpenPositions.push(pos);
      }
    });

    console.log(`Positions breakdown: ${trulyOpenPositions.length} truly open, ${resolvedPositions.length} resolved`);

    // Calculate UNREALIZED PnL only from truly open positions
    let unrealizedPnl = 0;
    let totalInvested = 0;
    let totalCurrentValue = 0;

    trulyOpenPositions.forEach((pos: any) => {
      unrealizedPnl += pos.cashPnl || 0;
      totalInvested += pos.initialValue || 0;
      totalCurrentValue += pos.currentValue || 0;
    });

    // CRITICAL FIX: The /closed-positions API returns MULTIPLE entries per position (one per partial close)
    // We must GROUP by asset and take ONLY the entry with the LATEST endDate
    // That entry contains the FINAL cumulative realized PnL for that position
    
    // Step 1: Group closed positions by asset (unique outcome token) and keep only the LATEST entry
    const finalPositions = new Map<string, any>();
    
    // Debug: Log sample closed position structure and a few PnL values to understand the data
    if (closed.length > 0) {
      const sample = closed[0];
      console.log(`Sample closed position keys: ${Object.keys(sample).join(', ')}`);
      console.log(`Sample: conditionId=${sample.conditionId?.slice(0,20)}..., outcome=${sample.outcome}, realizedPnl=${sample.realizedPnl}, avgPrice=${sample.avgPrice}, curPrice=${sample.curPrice}, totalBought=${sample.totalBought}`);
      
      // Sample 5 positions to see PnL distribution
      const samplePnls = closed.slice(0, 5).map((p: any) => ({
        realizedPnl: p.realizedPnl,
        avgPrice: p.avgPrice,
        curPrice: p.curPrice,
        totalBought: p.totalBought,
      }));
      console.log(`Sample 5 PnLs: ${JSON.stringify(samplePnls)}`);
    }
    
    // Count multi-entry groups for diagnostic logging
    const groupSizes = new Map<string, number>();
    closed.forEach((pos: any) => {
      const groupKey = `${pos.conditionId}-${pos.outcome}`;
      groupSizes.set(groupKey, (groupSizes.get(groupKey) || 0) + 1);
    });
    const multiEntryGroups = Array.from(groupSizes.values()).filter(c => c > 1).length;
    console.log(`Found ${multiEntryGroups} positions with multiple entries (partial closes)`);
    
    closed.forEach((pos: any) => {
      // CRITICAL: Use conditionId+outcome as key, NOT asset (asset is unique per entry)
      // Multiple entries with same conditionId+outcome = partial closes of same position
      const key = `${pos.conditionId}-${pos.outcome}`;
      
      const existing = finalPositions.get(key);
      if (!existing) {
        finalPositions.set(key, pos);
      } else {
        // Keep the entry with the LATEST endDate - this has the final cumulative realized PnL
        const existingEndDate = existing.endDate ? new Date(existing.endDate).getTime() : 0;
        const newEndDate = pos.endDate ? new Date(pos.endDate).getTime() : 0;
        
        if (newEndDate > existingEndDate) {
          finalPositions.set(key, pos);
        }
      }
    });
    
    console.log(`DEDUP: ${closed.length} raw closed entries -> ${finalPositions.size} unique final positions`);
    
    // Step 2: Calculate realized PnL from FINAL position states only (closed/settled)
    // NOTE: We keep open-position partial-exit realized PnL separate to match Polymarket/Hashdive style totals.
    let realizedPnlClosed = 0;
    let realizedPnlOpenPartial = 0;
    let positivePnl = 0;
    let negativePnl = 0;
    
    finalPositions.forEach((pos) => {
      const pnl = getClosedPositionPnl(pos);
      realizedPnlClosed += pnl;
      if (pnl > 0) positivePnl += pnl;
      else negativePnl += pnl;
    });

    // Open positions can have partial exits; Polymarket often separates these from "closed PnL".
    trulyOpenPositions.forEach((pos: any) => {
      realizedPnlOpenPartial += pos.realizedPnl || 0;
    });
    
    const realizedPnl = realizedPnlClosed;
    console.log(
      `Realized PnL (closed)=${realizedPnlClosed.toFixed(2)}, ` +
      `Realized PnL (open partial)=${realizedPnlOpenPartial.toFixed(2)}, ` +
      `wins=${positivePnl.toFixed(2)}, losses=${negativePnl.toFixed(2)}`
    );
    console.log(`Unique closed: ${finalPositions.size}, Open positions: ${trulyOpenPositions.length}`);

    // "Total PnL" for display should align with Polymarket/Hashdive (closed realized + unrealized).
    const totalPnl = realizedPnlClosed + unrealizedPnl;
    // Optional: include partial-exit realized from open positions (previous behavior).
    const totalPnlIncludingOpenPartial = realizedPnlClosed + realizedPnlOpenPartial + unrealizedPnl;

    // Calculate win rate from DEDUPLICATED closed positions + resolved positions
    // Also deduplicate resolved positions to prevent any overlap
    const uniqueResolvedMap = new Map<string, any>();
    resolvedPositions.forEach((pos: any) => {
      const key = `${pos.conditionId}-${pos.outcome}`;
      if (!uniqueResolvedMap.has(key) && !finalPositions.has(key)) {
        uniqueResolvedMap.set(key, pos);
      }
    });
    
    const deduplicatedClosed = Array.from(finalPositions.values());
    const deduplicatedResolved = Array.from(uniqueResolvedMap.values());
    const allUniquePositions = [...deduplicatedResolved, ...deduplicatedClosed];
    
    const winningSets = allUniquePositions.filter((pos: any) => {
      const pnl = pos.cashPnl || pos.realizedPnl || 0;
      return pnl > 0;
    }).length;
    const winRate = allUniquePositions.length > 0 ? (winningSets / allUniquePositions.length) * 100 : 0;

    console.log(
      `PnL: realizedClosed=${realizedPnlClosed.toFixed(2)}, ` +
      `realizedOpenPartial=${realizedPnlOpenPartial.toFixed(2)}, ` +
      `unrealized=${unrealizedPnl.toFixed(2)}, ` +
      `total=${totalPnl.toFixed(2)}, ` +
      `totalInclPartial=${totalPnlIncludingOpenPartial.toFixed(2)}, ` +
      `winRate=${winRate.toFixed(1)}%`
    );

    // ============= TRUE VOLUME CALCULATION FOR ROV =============
    // ROV = Net Profit / Total Traded Volume
    // Total Traded Volume = sum of ALL buys + ALL sells (absolute notional values)
    // This is the true "churn" - every dollar that moved through trades
    
    let trueVolumeUsd = 0;
    let buyVolumeUsd = 0;
    let sellVolumeUsd = 0;
    
    // Method 1: Calculate from trade fills
    allTrades.forEach((trade: any) => {
      const size = Math.abs(trade.size || 0);
      const price = trade.price || 0;
      const notional = size * price;
      
      trueVolumeUsd += notional;
      
      if (trade.side?.toLowerCase() === 'buy') {
        buyVolumeUsd += notional;
      } else {
        sellVolumeUsd += notional;
      }
    });
    
    // Method 2: Estimate volume from closed positions using CORRECT fields
    // CRITICAL: closed positions use 'totalBought' not 'initialValue'
    // Each closed position required: entry (totalBought) + exit (totalBought + realizedPnl)
    let closedPositionVolume = 0;
    finalPositions.forEach((pos: any) => {
      // Use totalBought (available on closed positions) - NOT initialValue!
      const entryValue = Math.abs(pos.totalBought || pos.initialValue || 0);
      // Exit value = what they got back = entry + profit (or - loss)
      const exitValue = Math.abs(entryValue + (pos.realizedPnl || 0));
      // Round-trip volume = entry + exit
      closedPositionVolume += entryValue + exitValue;
    });
    
    // Estimate missing sell volume from resolution exits
    // If sellVolumeUsd is much lower than expected from closed positions, add the gap
    // Positions settled via resolution don't have explicit sell trades
    const expectedExitVolume = closedPositionVolume / 2; // Half of round-trip is exits
    const missingSellVolume = Math.max(0, expectedExitVolume - sellVolumeUsd);
    
    if (missingSellVolume > 1000) {
      console.log(`Adding estimated resolution exits: $${missingSellVolume.toFixed(2)} (sellVol=$${sellVolumeUsd.toFixed(2)}, expected=$${expectedExitVolume.toFixed(2)})`);
      trueVolumeUsd += missingSellVolume;
    }
    
    // Use closedPositionVolume as minimum floor if higher than trade-based volume
    if (closedPositionVolume > trueVolumeUsd) {
      console.log(`Volume floor adjustment: trades=$${trueVolumeUsd.toFixed(2)}, positions suggest=$${closedPositionVolume.toFixed(2)}`);
      trueVolumeUsd = closedPositionVolume;
    }
    
    // Also use the old volume calculation for backward compatibility
    let totalVolume = trueVolumeUsd;
    
    // ============= ROV CALCULATION WITH SANITY CHECKS =============
    // ROV = Net Profit / Total Traded Volume
    // Typical real-world values: 0.05% to 2% for most traders
    // > 5-10% is exceptional, > 10% is very rare
    let rovPercent: number | null = null;
    let rovPnlSource: 'realized' | 'total' = 'realized';
    let rovWarning: string | null = null;
    
    // Use realized PnL for ROV (more accurate for completed trades)
    const rovPnl = realizedPnl;
    
    // Calculate ROV if we have sufficient volume data
    if (trueVolumeUsd >= 1000) {
      rovPercent = (rovPnl / trueVolumeUsd) * 100;
      
      // Sanity check thresholds (based on real Polymarket data):
      // - ROV > 10% is exceptional (very selective/skilled trader)
      // - ROV > 20% is suspicious, likely missing volume
      if (rovPercent !== null && Math.abs(rovPercent) > 20) {
        console.log(`ROV WARNING: Very high ROV=${rovPercent.toFixed(3)}% - likely missing volume data`);
        rovWarning = 'Volume data may be incomplete - ROV could be lower';
      } else if (rovPercent !== null && Math.abs(rovPercent) > 10 && trueVolumeUsd > 20000) {
        console.log(`ROV CHECK: High ROV=${rovPercent.toFixed(3)}% - reviewing volume sources`);
        console.log(`  - Trade fills: buy=$${buyVolumeUsd.toFixed(2)}, sell=$${sellVolumeUsd.toFixed(2)}`);
        console.log(`  - Position estimate: $${closedPositionVolume.toFixed(2)}`);
        console.log(`  - Final volume used: $${trueVolumeUsd.toFixed(2)}`);
        rovWarning = 'Unusually high ROV - verify with external source';
      }
    } else {
      rovWarning = 'Insufficient trade volume data';
    }
    
    // ROV Debug logging
    console.log(`ROV Debug: pnl=$${rovPnl.toFixed(2)}, trueVolume=$${trueVolumeUsd.toFixed(2)}, buyVol=$${buyVolumeUsd.toFixed(2)}, sellVol=$${sellVolumeUsd.toFixed(2)}, closedPosVol=$${closedPositionVolume.toFixed(2)}, rovPercent=${rovPercent?.toFixed(3) ?? 'null'}%, trades=${allTrades.length}`);


    // Get time-based PnL
    const now = Date.now();
    const day = 86400 * 1000;
    
    let pnl24h = 0;
    let pnl7d = 0;
    let pnl30d = 0;

    // Build PnL history from DEDUPLICATED closed positions (they have timestamps when position was closed)
    // This is more accurate than trades because it shows when PnL was actually realized
    const pnlHistory: Array<{ timestamp: number; pnl: number; cumulative: number }> = [];
    
    // Use deduplicated closed positions for history
    const allClosedForHistory: Array<{ timestamp: number; pnl: number }> = [];
    
    // Add deduplicated closed positions from API
    finalPositions.forEach((pos: any) => {
      const pnl = pos.realizedPnl || 0;
      // CRITICAL: Use endDate (when position closed) NOT timestamp (when position opened)
      let timestamp: number;
      
      if (pos.endDate) {
        timestamp = new Date(pos.endDate).getTime();
      } else if (pos.timestamp) {
        timestamp = pos.timestamp < 10000000000 ? pos.timestamp * 1000 : pos.timestamp;
      } else {
        timestamp = now;
      }
      
      if (pnl !== 0) {
        allClosedForHistory.push({ timestamp, pnl });
      }
    });
    
    // Add deduplicated resolved positions
    uniqueResolvedMap.forEach((pos: any) => {
      const pnl = pos.cashPnl || 0;
      const timestamp = pos.endDate ? new Date(pos.endDate).getTime() : now - day;
      if (pnl !== 0) {
        allClosedForHistory.push({ timestamp, pnl });
      }
    });
    
    // Sort by timestamp (oldest first)
    allClosedForHistory.sort((a, b) => a.timestamp - b.timestamp);
    
    // Build cumulative PnL history
    let cumulativePnl = 0;
    allClosedForHistory.forEach(({ timestamp, pnl }) => {
      cumulativePnl += pnl;
      pnlHistory.push({ timestamp, pnl, cumulative: cumulativePnl });
      
      // Calculate time-based PnL
      const age = now - timestamp;
      if (age <= day) pnl24h += pnl;
      if (age <= day * 7) pnl7d += pnl;
      if (age <= day * 30) pnl30d += pnl;
    });
    
    console.log(`Time-based PnL: 24h=${pnl24h.toFixed(2)}, 7d=${pnl7d.toFixed(2)}, 30d=${pnl30d.toFixed(2)} from ${allClosedForHistory.length} closed positions`);

    // Calculate trades in last 30 days from trade history (fills)
    const thirtyDaysAgo = now - (30 * day);
    const trades30d = allTrades.filter((trade: any) => {
      const timestamp = trade.timestamp 
        ? (trade.timestamp < 10000000000 ? trade.timestamp * 1000 : trade.timestamp)
        : 0;
      return timestamp >= thirtyDaysAgo;
    }).length;
    
    // Calculate unique markets entered in last 30 days (positions/month)
    const marketsIn30d = new Set<string>();
    allTrades.forEach((trade: any) => {
      const timestamp = trade.timestamp 
        ? (trade.timestamp < 10000000000 ? trade.timestamp * 1000 : trade.timestamp)
        : 0;
      if (timestamp >= thirtyDaysAgo && trade.side?.toLowerCase() === 'buy') {
        // Use conditionId or market identifier
        const marketId = trade.conditionId || trade.marketId || trade.title;
        if (marketId) marketsIn30d.add(marketId);
      }
    });
    const positions30d = marketsIn30d.size;
    
    console.log(`Activity last 30d: ${trades30d} trades, ${positions30d} unique markets`);

    // Determine if trade history is incomplete (may undercount)
    // If we hit the 10k limit on trades, history may be truncated
    const tradeHistoryPartial = allTrades.length >= 9900;

    // Get last active timestamp
    const lastTrade = allTrades[0];
    const lastActive = lastTrade?.timestamp 
      ? new Date(lastTrade.timestamp * 1000).toISOString() 
      : new Date().toISOString();

    // Calculate data reliability with completeness assessment
    const dataReliability = calculateReliability(reliabilityMetrics, closed.length, allTrades.length);
    
    // Add trade history warning if partial
    if (tradeHistoryPartial) {
      dataReliability.warnings.push('Partial trade history — activity may be undercounted');
      if (dataReliability.score === 'high') dataReliability.score = 'medium';
    }
    
    console.log(`Data reliability: score=${dataReliability.score}, warnings=${dataReliability.warnings.length}, rateLimitRetries=${dataReliability.rateLimitRetries}`);

    // Build trader profile response
    const traderData = {
      address: trimmedAddress,
      username: profile?.name || profile?.username || profile?.pseudonym || null,
      profileImage: profile?.profileImage || profile?.profileImageOptimized || profile?.image || profile?.avatar || null,
      pnl: realizedPnl,
      pnlIncludingOpenPartial: totalPnlIncludingOpenPartial,
      pnl24h,
      pnl7d,
      pnl30d,
      realizedPnl,
      realizedPnlOpenPartial,
      unrealizedPnl,
      winRate,
      totalTrades: allTrades.length,
      trades30d, // Trades (fills) in last 30 days
      positions30d, // Unique markets entered in last 30 days
      volume: totalVolume,
      // New ROV fields - computed from trade fills
      trueVolumeUsd,
      rovPercent,
      rovPnlSource,
      rovWarning,
      volumeSource: 'fills' as const,
      totalInvested,
      totalCurrentValue,
      positions: trulyOpenPositions.length,
      closedPositions: resolvedPositions.length + closed.length, // Resolved + API closed
      lastActive,
      pnlHistory: samplePnlHistory(pnlHistory, 150), // Sample 150 points across full history
      dataReliability, // Include reliability info for UI warnings
      // Raw data for detailed views
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
      })),
      recentTrades: allTrades.slice(0, 50).map((trade: any) => ({
        id: trade.transactionHash || `${trade.timestamp}-${trade.conditionId}`,
        timestamp: trade.timestamp ? new Date(trade.timestamp * 1000).toISOString() : new Date().toISOString(),
        marketTitle: trade.title || 'Unknown Market',
        outcome: trade.outcome || 'Yes',
        side: trade.side?.toLowerCase() || 'buy',
        size: trade.size || 0,
        price: trade.price || 0,
        slug: trade.slug,
      })),
    };

    console.log(`Returning: PnL=${realizedPnl}, Realized=${realizedPnl}, Unrealized=${unrealizedPnl}, Open=${trulyOpenPositions.length}, Resolved=${resolvedPositions.length}, Closed=${closed.length}, Trades30d=${trades30d}, Positions30d=${positions30d}`);
    console.log(`[stage=full] computed in ${Math.round(performance.now() - tAll)}ms`);

    return new Response(
      JSON.stringify(traderData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch trader data';
    console.error('Error fetching trader data:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
