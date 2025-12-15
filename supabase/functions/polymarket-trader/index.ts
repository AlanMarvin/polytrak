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

    // Fetch all positions (open) and trades
    // Note: closed-positions API has limited data, so we calculate from positions
    const [positions, trades] = await Promise.all([
      fetchAllPaginated(`${POLYMARKET_API}/positions?user=${address}`, 5000),
      fetchAllPaginated(`${POLYMARKET_API}/trades?user=${address}`, 5000),
    ]);

    console.log(`Fetched ${positions.length} positions, ${trades.length} trades`);

    const openPositions = Array.isArray(positions) ? positions : [];
    const allTrades = Array.isArray(trades) ? trades : [];

    // Calculate PnL from positions
    // Each position has cashPnl (unrealized) and realizedPnl (if partially closed)
    let totalUnrealizedPnl = 0;
    let totalRealizedPnlFromPositions = 0;
    let totalInvested = 0;
    let totalCurrentValue = 0;

    openPositions.forEach((pos: any) => {
      totalUnrealizedPnl += pos.cashPnl || 0;
      totalRealizedPnlFromPositions += pos.realizedPnl || 0;
      totalInvested += pos.initialValue || 0;
      totalCurrentValue += pos.currentValue || 0;
    });

    // For a more complete picture, we can also look at trade history
    // Calculate realized PnL from sell trades vs buy trades by market
    const tradesByMarket: Map<string, { buys: number[], sells: number[] }> = new Map();
    
    allTrades.forEach((trade: any) => {
      const key = `${trade.conditionId}-${trade.outcomeIndex}`;
      if (!tradesByMarket.has(key)) {
        tradesByMarket.set(key, { buys: [], sells: [] });
      }
      const data = tradesByMarket.get(key)!;
      const value = (trade.size || 0) * (trade.price || 0);
      
      if (trade.side?.toUpperCase() === 'BUY') {
        data.buys.push(value);
      } else if (trade.side?.toUpperCase() === 'SELL') {
        data.sells.push(value);
      }
    });

    // Calculate approximate realized PnL from completed sell trades
    // This is an estimate since we don't have perfect FIFO matching
    let tradeBasedRealizedPnl = 0;
    tradesByMarket.forEach((data) => {
      const totalBuyValue = data.buys.reduce((a, b) => a + b, 0);
      const totalSellValue = data.sells.reduce((a, b) => a + b, 0);
      // If there are sells, calculate the profit/loss
      if (data.sells.length > 0 && data.buys.length > 0) {
        // Proportional cost basis
        const sellRatio = Math.min(1, data.sells.length / data.buys.length);
        const costBasis = totalBuyValue * sellRatio;
        tradeBasedRealizedPnl += totalSellValue - costBasis;
      }
    });

    // Use the better of position-based or trade-based realized PnL
    const realizedPnl = Math.abs(totalRealizedPnlFromPositions) > 0 
      ? totalRealizedPnlFromPositions 
      : tradeBasedRealizedPnl;
    
    const totalPnl = totalUnrealizedPnl + realizedPnl;

    console.log(`PnL: Unrealized=${totalUnrealizedPnl.toFixed(2)}, Realized=${realizedPnl.toFixed(2)}, Total=${totalPnl.toFixed(2)}`);

    // Build PnL history from trades (daily aggregation)
    const pnlByDay: Map<string, { realized: number, unrealized: number }> = new Map();
    const now = Date.now();
    const day = 86400 * 1000;
    
    // Track daily trade activity for PnL estimation
    allTrades.forEach((trade: any) => {
      const timestamp = trade.timestamp ? trade.timestamp * 1000 : now;
      const dateKey = new Date(timestamp).toISOString().split('T')[0];
      
      if (!pnlByDay.has(dateKey)) {
        pnlByDay.set(dateKey, { realized: 0, unrealized: 0 });
      }
      
      const data = pnlByDay.get(dateKey)!;
      const tradeValue = (trade.size || 0) * (trade.price || 0);
      
      // For sells at high prices, estimate profit
      if (trade.side?.toUpperCase() === 'SELL') {
        const profitEstimate = tradeValue * ((trade.price || 0.5) - 0.5); // vs 0.5 baseline
        data.realized += profitEstimate;
      }
    });

    // Build cumulative history
    const sortedDays = Array.from(pnlByDay.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    let cumulative = 0;
    const pnlHistory = sortedDays.map(([dateStr, data]) => {
      const dailyPnl = data.realized;
      cumulative += dailyPnl;
      return {
        timestamp: new Date(dateStr).getTime(),
        pnl: dailyPnl,
        cumulative
      };
    });

    // Add current unrealized to the end
    if (pnlHistory.length > 0) {
      pnlHistory[pnlHistory.length - 1].cumulative = cumulative + totalUnrealizedPnl;
    }

    // Calculate time-based PnL from trades
    let pnl24h = 0, pnl7d = 0, pnl30d = 0;
    
    allTrades.forEach((trade: any) => {
      const timestamp = trade.timestamp ? trade.timestamp * 1000 : 0;
      const age = now - timestamp;
      
      if (trade.side?.toUpperCase() === 'SELL') {
        const tradeValue = (trade.size || 0) * (trade.price || 0);
        const profit = tradeValue * ((trade.price || 0.5) - 0.5);
        
        if (age <= day) pnl24h += profit;
        if (age <= day * 7) pnl7d += profit;
        if (age <= day * 30) pnl30d += profit;
      }
    });

    // Win rate from positions
    const profitablePositions = openPositions.filter((p: any) => (p.cashPnl || 0) > 0).length;
    const winRate = openPositions.length > 0 ? (profitablePositions / openPositions.length) * 100 : 50;

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
      realizedPnl,
      unrealizedPnl: totalUnrealizedPnl,
      winRate,
      totalTrades: allTrades.length,
      volume: totalVolume,
      totalInvested,
      totalCurrentValue,
      positions: openPositions.length,
      closedPositions: 0, // Can't accurately determine from available data
      lastActive,
      pnlHistory: pnlHistory.slice(-365),
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

    console.log(`Final PnL=${totalPnl.toFixed(2)}, Positions=${openPositions.length}`);

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
