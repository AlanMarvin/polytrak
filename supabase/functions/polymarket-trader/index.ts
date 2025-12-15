import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const POLYMARKET_API = 'https://data-api.polymarket.com';

// Helper to fetch paginated data
async function fetchAllPaginated(baseUrl: string, maxItems = 10000): Promise<any[]> {
  const allItems: any[] = [];
  let offset = 0;
  const limit = 500;
  
  while (allItems.length < maxItems) {
    const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}limit=${limit}&offset=${offset}`;
    
    try {
      const res = await fetch(url);
      if (!res.ok) break;
      
      const data = await res.json();
      const items = Array.isArray(data) ? data : [];
      
      if (items.length === 0) break;
      
      allItems.push(...items);
      
      if (items.length < limit) break;
      offset += limit;
    } catch (e) {
      console.error(`Error fetching at offset ${offset}:`, e);
      break;
    }
  }
  
  return allItems;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();

    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching data for address: ${address}`);

    // Fetch profile
    const profileRes = await fetch(`${POLYMARKET_API}/profiles/${address}`);
    const profile = profileRes.ok ? await profileRes.json() : null;
    console.log('Profile:', profile?.name || profile?.pseudonym || 'anonymous');

    // Fetch all data in parallel
    const [positions, closedPositions, trades] = await Promise.all([
      fetchAllPaginated(`${POLYMARKET_API}/positions?user=${address}`, 5000),
      fetchAllPaginated(`${POLYMARKET_API}/closed-positions?user=${address}`, 10000),
      fetchAllPaginated(`${POLYMARKET_API}/trades?user=${address}`, 5000),
    ]);

    console.log(`Fetched ${positions.length} positions, ${closedPositions.length} closed, ${trades.length} trades`);

    const openPositions = Array.isArray(positions) ? positions : [];
    const closed = Array.isArray(closedPositions) ? closedPositions : [];
    const allTrades = Array.isArray(trades) ? trades : [];

    // Calculate PnL from open positions
    // cashPnl = unrealized profit/loss
    // realizedPnl = already realized profit from partial sales
    let totalUnrealizedPnl = 0;
    let totalRealizedFromOpen = 0;
    let totalInvested = 0;
    let totalCurrentValue = 0;

    openPositions.forEach((pos: any) => {
      totalUnrealizedPnl += pos.cashPnl || 0;
      totalRealizedFromOpen += pos.realizedPnl || 0;
      totalInvested += pos.initialValue || 0;
      totalCurrentValue += pos.currentValue || 0;
    });

    // Calculate realized PnL from closed positions (fully resolved markets)
    let totalRealizedFromClosed = 0;
    closed.forEach((pos: any) => {
      totalRealizedFromClosed += pos.realizedPnl || 0;
    });

    // Total PnL = unrealized + all realized
    const totalRealizedPnl = totalRealizedFromOpen + totalRealizedFromClosed;
    const totalPnl = totalUnrealizedPnl + totalRealizedPnl;

    console.log(`PnL: Unrealized=${totalUnrealizedPnl.toFixed(2)}, RealizedOpen=${totalRealizedFromOpen.toFixed(2)}, RealizedClosed=${totalRealizedFromClosed.toFixed(2)}, Total=${totalPnl.toFixed(2)}`);

    // Build PnL history from closed positions (sorted by timestamp)
    const sortedClosed = [...closed].sort((a: any, b: any) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return timeA - timeB;
    });

    let cumulativePnl = 0;
    const pnlHistory: Array<{ timestamp: number; pnl: number; cumulative: number }> = [];
    
    sortedClosed.forEach((pos: any) => {
      const pnl = pos.realizedPnl || 0;
      const timestamp = pos.timestamp ? pos.timestamp * 1000 : Date.now();
      cumulativePnl += pnl;
      pnlHistory.push({ timestamp, pnl, cumulative: cumulativePnl });
    });

    // Add current unrealized to history if we have open positions
    if (totalUnrealizedPnl !== 0 && pnlHistory.length > 0) {
      pnlHistory.push({
        timestamp: Date.now(),
        pnl: totalUnrealizedPnl,
        cumulative: cumulativePnl + totalUnrealizedPnl
      });
    }

    // Calculate time-based PnL from closed positions
    const now = Date.now();
    const day = 86400 * 1000;
    let pnl24h = 0, pnl7d = 0, pnl30d = 0;

    closed.forEach((pos: any) => {
      const pnl = pos.realizedPnl || 0;
      const timestamp = pos.timestamp ? pos.timestamp * 1000 : 0;
      const age = now - timestamp;
      
      if (age <= day) pnl24h += pnl;
      if (age <= day * 7) pnl7d += pnl;
      if (age <= day * 30) pnl30d += pnl;
    });

    // Win rate from closed positions
    const winningPositions = closed.filter((p: any) => (p.realizedPnl || 0) > 0).length;
    const winRate = closed.length > 0 ? (winningPositions / closed.length) * 100 : 50;

    // Volume from trades
    let totalVolume = 0;
    allTrades.forEach((trade: any) => {
      totalVolume += (trade.size || 0) * (trade.price || 0);
    });

    const lastTrade = allTrades[0];
    const lastActive = lastTrade?.timestamp 
      ? new Date(lastTrade.timestamp * 1000).toISOString() 
      : new Date().toISOString();

    const traderData = {
      address,
      username: profile?.name || profile?.username || profile?.pseudonym || null,
      profileImage: profile?.profileImage || profile?.profileImageOptimized || null,
      pnl: totalPnl,
      pnl24h,
      pnl7d,
      pnl30d,
      realizedPnl: totalRealizedPnl,
      unrealizedPnl: totalUnrealizedPnl,
      winRate,
      totalTrades: allTrades.length,
      volume: totalVolume,
      totalInvested,
      totalCurrentValue,
      positions: openPositions.length,
      closedPositions: closed.length,
      lastActive,
      pnlHistory: pnlHistory.slice(-100),
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

    console.log(`Final: PnL=${totalPnl.toFixed(2)}, Open=${openPositions.length}, Closed=${closed.length}`);

    return new Response(
      JSON.stringify(traderData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch trader data';
    console.error('Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
