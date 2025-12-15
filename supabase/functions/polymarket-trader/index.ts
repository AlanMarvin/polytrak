import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const POLYMARKET_API = 'https://data-api.polymarket.com';

// Helper to fetch paginated data with endpoint-specific limits
async function fetchAllPaginated(baseUrl: string, maxItems = 5000, pageSize = 500): Promise<any[]> {
  const allItems: any[] = [];
  let offset = 0;
  
  while (allItems.length < maxItems) {
    const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}limit=${pageSize}&offset=${offset}`;
    const res = await fetch(url);
    
    if (!res.ok) break;
    
    const data = await res.json();
    const items = Array.isArray(data) ? data : [];
    
    if (items.length === 0) break;
    
    allItems.push(...items);
    
    // Stop if we got fewer items than requested (no more data)
    if (items.length < pageSize) break;
    offset += pageSize;
  }
  
  return allItems;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();

    if (!address) {
      console.error('No address provided');
      return new Response(
        JSON.stringify({ error: 'Address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching data for address: ${address}`);

    // Fetch profile first (quick)
    const profileRes = await fetch(`${POLYMARKET_API}/profiles/${address}`);
    const profile = profileRes.ok ? await profileRes.json() : null;
    console.log('Profile data:', JSON.stringify(profile));

    // Fetch all data with pagination for complete history
    // Note: closed-positions API has max 50 per page, positions/trades allow 500
    const [positions, trades, closedPositions] = await Promise.all([
      fetchAllPaginated(`${POLYMARKET_API}/positions?user=${address}`, 2000, 500),
      fetchAllPaginated(`${POLYMARKET_API}/trades?user=${address}`, 5000, 500),
      fetchAllPaginated(`${POLYMARKET_API}/closed-positions?user=${address}`, 10000, 50), // Max 50 per page per API docs
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

    // Calculate REALIZED PnL from:
    // 1. Resolved positions (were in "positions" but have settled)
    // 2. Closed positions from API (capped at 50)
    // 3. Partial closes on truly open positions (realizedPnl field)
    let realizedPnl = 0;

    // From resolved positions - their cashPnl is actually realized now
    resolvedPositions.forEach((pos: any) => {
      // cashPnl shows the gain/loss, which is now realized since market settled
      realizedPnl += pos.cashPnl || 0;
      // Also add any partial realized PnL they had
      realizedPnl += pos.realizedPnl || 0;
    });

    // From closed positions endpoint
    closed.forEach((pos: any) => {
      realizedPnl += pos.realizedPnl || 0;
    });

    // From partial closes on truly open positions
    trulyOpenPositions.forEach((pos: any) => {
      realizedPnl += pos.realizedPnl || 0;
    });

    const totalPnl = realizedPnl + unrealizedPnl;

    // Calculate win rate from resolved + closed positions
    const allResolvedAndClosed = [...resolvedPositions, ...closed];
    const winningSets = allResolvedAndClosed.filter((pos: any) => {
      const pnl = pos.cashPnl || pos.realizedPnl || 0;
      return pnl > 0;
    }).length;
    const winRate = allResolvedAndClosed.length > 0 ? (winningSets / allResolvedAndClosed.length) * 100 : 0;

    console.log(`PnL: realized=${realizedPnl}, unrealized=${unrealizedPnl}, total=${totalPnl}, winRate=${winRate}%`);

    // Calculate volume from trades
    let totalVolume = 0;
    allTrades.forEach((trade: any) => {
      totalVolume += (trade.size || 0) * (trade.price || 0);
    });

    // Get time-based PnL from trades
    const now = Date.now();
    const day = 86400 * 1000;
    
    let pnl24h = 0;
    let pnl7d = 0;
    let pnl30d = 0;

    // Build PnL history from trades (sorted by time)
    const pnlHistory: Array<{ timestamp: number; pnl: number; cumulative: number }> = [];
    
    // Sort trades by timestamp (oldest first)
    const sortedTrades = [...allTrades].sort((a: any, b: any) => {
      return (a.timestamp || 0) - (b.timestamp || 0);
    });

    // Track running PnL per market to calculate incremental changes
    const runningMarketPnl = new Map<string, { bought: number; sold: number; buyValue: number; sellValue: number }>();
    let runningTotalPnl = 0;

    sortedTrades.forEach((trade: any) => {
      const key = `${trade.conditionId || trade.market}-${trade.outcome}`;
      if (!runningMarketPnl.has(key)) {
        runningMarketPnl.set(key, { bought: 0, sold: 0, buyValue: 0, sellValue: 0 });
      }
      const market = runningMarketPnl.get(key)!;
      const size = trade.size || 0;
      const price = trade.price || 0;
      const value = size * price;
      const timestamp = trade.timestamp ? trade.timestamp * 1000 : now;
      
      // Calculate PnL change from this trade
      let pnlChange = 0;
      if (trade.side?.toLowerCase() === 'buy') {
        market.bought += size;
        market.buyValue += value;
      } else {
        // Selling - realize PnL
        const avgBuyPrice = market.bought > 0 ? market.buyValue / market.bought : 0;
        pnlChange = (price - avgBuyPrice) * size;
        market.sold += size;
        market.sellValue += value;
      }
      
      if (pnlChange !== 0) {
        runningTotalPnl += pnlChange;
        pnlHistory.push({ timestamp, pnl: pnlChange, cumulative: runningTotalPnl });
        
        // Time-based PnL
        const age = now - timestamp;
        if (age <= day) pnl24h += pnlChange;
        if (age <= day * 7) pnl7d += pnlChange;
        if (age <= day * 30) pnl30d += pnlChange;
      }
    });

    // Get last active timestamp
    const lastTrade = allTrades[0];
    const lastActive = lastTrade?.timestamp 
      ? new Date(lastTrade.timestamp * 1000).toISOString() 
      : new Date().toISOString();

    // Build trader profile response
    const traderData = {
      address,
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
      pnlHistory: pnlHistory.slice(-100), // Last 100 data points for chart
      // Raw data for detailed views
      openPositions: trulyOpenPositions.slice(0, 50).map((pos: any) => ({
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
