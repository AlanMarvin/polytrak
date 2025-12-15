import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const POLYMARKET_API = 'https://data-api.polymarket.com';

// Helper to fetch paginated data
async function fetchAllPaginated(baseUrl: string, maxItems = 5000): Promise<any[]> {
  const allItems: any[] = [];
  let offset = 0;
  const limit = 500; // Max per request
  
  while (allItems.length < maxItems) {
    const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}limit=${limit}&offset=${offset}`;
    const res = await fetch(url);
    
    if (!res.ok) break;
    
    const data = await res.json();
    const items = Array.isArray(data) ? data : [];
    
    if (items.length === 0) break;
    
    allItems.push(...items);
    
    if (items.length < limit) break; // No more data
    offset += limit;
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
    const [positions, trades, closedPositions] = await Promise.all([
      fetchAllPaginated(`${POLYMARKET_API}/positions?user=${address}`, 2000),
      fetchAllPaginated(`${POLYMARKET_API}/trades?user=${address}`, 5000), // More trades for accurate PnL calculation
      fetchAllPaginated(`${POLYMARKET_API}/closed-positions?user=${address}`, 5000),
    ]);

    console.log(`Fetched ${positions.length} positions, ${trades.length} trades, ${closedPositions.length} closed positions`);

    // Calculate aggregated stats
    const openPositions = Array.isArray(positions) ? positions : [];
    const allTrades = Array.isArray(trades) ? trades : [];
    const closed = Array.isArray(closedPositions) ? closedPositions : [];

    // Calculate PnL from open positions
    // The positions endpoint includes BOTH unrealized (cashPnl) AND realized PnL from that position
    let unrealizedPnl = 0;
    let openRealizedPnl = 0; // Realized PnL from open positions (partial closes)
    let totalInvested = 0;
    let totalCurrentValue = 0;

    openPositions.forEach((pos: any) => {
      unrealizedPnl += pos.cashPnl || 0;
      openRealizedPnl += pos.realizedPnl || 0; // Include realized PnL from open positions too!
      totalInvested += pos.initialValue || 0;
      totalCurrentValue += pos.currentValue || 0;
    });

    // Add realized PnL from closed positions
    let closedRealizedPnl = 0;
    closed.forEach((pos: any) => {
      closedRealizedPnl += pos.realizedPnl || 0;
    });

    // Total realized = from open positions + from closed positions
    const realizedPnl = openRealizedPnl + closedRealizedPnl;
    const totalPnl = realizedPnl + unrealizedPnl;

    console.log(`PnL breakdown: openRealized=${openRealizedPnl}, closedRealized=${closedRealizedPnl}, unrealized=${unrealizedPnl}, total=${totalPnl}`);

    // Calculate win rate from all positions that have realized PnL
    const allPositionsWithPnl = [...openPositions, ...closed].filter((pos: any) => pos.realizedPnl !== undefined && pos.realizedPnl !== 0);
    const winningPositions = allPositionsWithPnl.filter((pos: any) => (pos.realizedPnl || 0) > 0).length;
    const winRate = allPositionsWithPnl.length > 0 ? (winningPositions / allPositionsWithPnl.length) * 100 : 0;

    // Calculate volume from trades
    let totalVolume = 0;
    allTrades.forEach((trade: any) => {
      totalVolume += (trade.size || 0) * (trade.price || 0);
    });

    // Get time-based PnL from closed positions
    const now = Date.now();
    const day = 86400 * 1000;
    
    let pnl24h = 0;
    let pnl7d = 0;
    let pnl30d = 0;

    // Build PnL history from closed positions (sorted by time)
    const pnlHistory: Array<{ timestamp: number; pnl: number; cumulative: number }> = [];
    let cumulativePnl = 0;
    
    // Sort closed positions by timestamp (oldest first)
    const sortedClosed = [...closed].sort((a: any, b: any) => {
      const timeA = a.closedAt ? new Date(a.closedAt).getTime() : (a.timestamp ? a.timestamp * 1000 : 0);
      const timeB = b.closedAt ? new Date(b.closedAt).getTime() : (b.timestamp ? b.timestamp * 1000 : 0);
      return timeA - timeB;
    });

    sortedClosed.forEach((pos: any) => {
      const positionPnl = pos.realizedPnl || 0;
      const timestamp = pos.closedAt ? new Date(pos.closedAt).getTime() : (pos.timestamp ? pos.timestamp * 1000 : now);
      
      cumulativePnl += positionPnl;
      pnlHistory.push({ timestamp, pnl: positionPnl, cumulative: cumulativePnl });
      
      // Calculate time-based PnL
      const age = now - timestamp;
      if (age <= day) pnl24h += positionPnl;
      if (age <= day * 7) pnl7d += positionPnl;
      if (age <= day * 30) pnl30d += positionPnl;
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
      positions: openPositions.length,
      closedPositions: openPositions.length + closed.length, // Total positions count
      lastActive,
      pnlHistory: pnlHistory.slice(-100), // Last 100 data points for chart
      // Raw data for detailed views
      openPositions: openPositions.slice(0, 50).map((pos: any) => ({
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

    console.log(`Returning trader data: PnL=${totalPnl}, RealizedPnL=${realizedPnl}, UnrealizedPnL=${unrealizedPnl}, Positions=${openPositions.length}, Closed=${closed.length}`);

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
