import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

// Helper to fetch with retry and exponential backoff
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url);
      
      // Handle rate limiting (429) or server errors (5xx)
      if (res.status === 429 || res.status >= 500) {
        const delay = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s
        console.log(`Rate limited/error on ${url}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return res;
    } catch (error) {
      lastError = error as Error;
      const delay = Math.pow(2, attempt) * 500;
      console.log(`Fetch error on ${url}: ${lastError.message}, retrying in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

// Helper to fetch paginated data with PARALLEL batch fetching for speed
// IMPORTANT: closed-positions API has max 50 per page
async function fetchAllPaginated(baseUrl: string, maxItems = 5000, pageSize = 50): Promise<any[]> {
  const allItems: any[] = [];
  const seenIds = new Set<string>();
  
  // Fetch pages in parallel batches for speed
  const BATCH_SIZE = 10; // Fetch 10 pages at once
  let offset = 0;
  let hasMore = true;
  
  while (hasMore && allItems.length < maxItems && offset <= 100000) {
    // Create batch of page requests
    const batchPromises: Promise<any[]>[] = [];
    
    for (let i = 0; i < BATCH_SIZE && offset + (i * pageSize) <= 100000; i++) {
      const currentOffset = offset + (i * pageSize);
      const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}limit=${pageSize}&offset=${currentOffset}`;
      
      batchPromises.push(
        fetchWithRetry(url)
          .then(res => res.ok ? res.json() : [])
          .then(data => Array.isArray(data) ? data : [])
          .catch(() => [])
      );
    }
    
    // Execute batch in parallel
    const batchResults = await Promise.all(batchPromises);
    
    let batchNewItems = 0;
    let batchHadData = false;
    
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
    
    // Stop if no pages in this batch had data
    if (!batchHadData) {
      hasMore = false;
    } else {
      offset += BATCH_SIZE * pageSize;
      // Small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Early exit if we have enough data
    if (allItems.length >= maxItems) break;
  }
  
  console.log(`Fetched ${allItems.length} unique items from ${baseUrl.split('?')[0]}`);
  return allItems;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();

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

    // Fetch profile first (quick)
    const profileRes = await fetch(`${POLYMARKET_API}/profiles/${trimmedAddress}`);
    const profile = profileRes.ok ? await profileRes.json() : null;
    console.log('Profile data:', JSON.stringify(profile));

    // Fetch all data with pagination for complete history
    // IMPORTANT: Must fetch ALL closed positions for accurate PnL calculation
    // closed-positions API has max 50 per page per API docs
    // Some traders have 5000+ positions, so we need high limits
    const [positions, trades, closedPositions] = await Promise.all([
      fetchAllPaginated(`${POLYMARKET_API}/positions?user=${trimmedAddress}`, 5000, 50),
      fetchAllPaginated(`${POLYMARKET_API}/trades?user=${trimmedAddress}`, 10000, 50),
      fetchAllPaginated(`${POLYMARKET_API}/closed-positions?user=${trimmedAddress}`, 20000, 50), // High limit for whale traders
    ]);

    console.log(`Fetched ${positions.length} positions, ${trades.length} trades, ${closedPositions.length} closed positions`);

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
    
    closed.forEach((pos: any) => {
      // Use asset as primary unique key (it's the outcome token address)
      // Fallback to conditionId+outcome if asset not available
      const key = pos.asset || `${pos.conditionId}-${pos.outcome}`;
      
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
    
    // Step 2: Calculate realized PnL from FINAL position states only
    let realizedPnl = 0;
    let positivePnl = 0;
    let negativePnl = 0;
    
    finalPositions.forEach((pos) => {
      const pnl = pos.realizedPnl || 0;
      realizedPnl += pnl;
      if (pnl > 0) positivePnl += pnl;
      else negativePnl += pnl;
    });

    // Add realized PnL from partial closes on truly open positions (these are separate - active positions with some profit taken)
    trulyOpenPositions.forEach((pos: any) => {
      realizedPnl += pos.realizedPnl || 0;
    });
    
    console.log(`Realized PnL: total=${realizedPnl.toFixed(2)}, wins=${positivePnl.toFixed(2)}, losses=${negativePnl.toFixed(2)}`);
    console.log(`Unique closed: ${finalPositions.size}, Open positions: ${trulyOpenPositions.length}`);

    const totalPnl = realizedPnl + unrealizedPnl;

    // Calculate win rate from DEDUPLICATED closed positions + resolved positions
    // Also deduplicate resolved positions to prevent any overlap
    const uniqueResolvedMap = new Map<string, any>();
    resolvedPositions.forEach((pos: any) => {
      const key = pos.asset || `${pos.conditionId}-${pos.outcome}`;
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

    console.log(`PnL: realized=${realizedPnl.toFixed(2)}, unrealized=${unrealizedPnl.toFixed(2)}, total=${totalPnl.toFixed(2)}, winRate=${winRate.toFixed(1)}%`);

    // Calculate volume from trades
    let totalVolume = 0;
    allTrades.forEach((trade: any) => {
      totalVolume += (trade.size || 0) * (trade.price || 0);
    });

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

    // Get last active timestamp
    const lastTrade = allTrades[0];
    const lastActive = lastTrade?.timestamp 
      ? new Date(lastTrade.timestamp * 1000).toISOString() 
      : new Date().toISOString();

    // Build trader profile response
    const traderData = {
      address: trimmedAddress,
      username: profile?.name || profile?.username || profile?.pseudonym || null,
      profileImage: profile?.profileImage || profile?.profileImageOptimized || profile?.image || profile?.avatar || null,
      pnl: totalPnl,
      pnl24h,
      pnl7d,
      pnl30d,
      realizedPnl,
      unrealizedPnl,
      winRate,
      totalTrades: allTrades.length,
      volume: totalVolume,
      totalInvested,
      totalCurrentValue,
      positions: trulyOpenPositions.length,
      closedPositions: resolvedPositions.length + closed.length, // Resolved + API closed
      lastActive,
      pnlHistory: samplePnlHistory(pnlHistory, 150), // Sample 150 points across full history
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

    console.log(`Returning: PnL=${totalPnl}, Realized=${realizedPnl}, Unrealized=${unrealizedPnl}, Open=${trulyOpenPositions.length}, Resolved=${resolvedPositions.length}, Closed=${closed.length}`);

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
