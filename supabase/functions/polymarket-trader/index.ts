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

    console.log(`Processing: ${openPositions.length} open, ${allTrades.length} trades, ${closed.length} closed positions`);

    // Calculate unrealized PnL from open positions
    let unrealizedPnl = 0;
    let totalInvested = 0;
    let totalCurrentValue = 0;

    openPositions.forEach((pos: any) => {
      unrealizedPnl += pos.cashPnl || 0;
      totalInvested += pos.initialValue || 0;
      totalCurrentValue += pos.currentValue || 0;
    });

    // Calculate REALIZED PnL from TRADES (more reliable than closed-positions which caps at 50)
    // Group trades by market/outcome to calculate net PnL
    const marketPnl = new Map<string, { bought: number; sold: number; buyValue: number; sellValue: number; trades: any[] }>();
    
    allTrades.forEach((trade: any) => {
      const key = `${trade.conditionId || trade.market}-${trade.outcome}`;
      if (!marketPnl.has(key)) {
        marketPnl.set(key, { bought: 0, sold: 0, buyValue: 0, sellValue: 0, trades: [] });
      }
      const market = marketPnl.get(key)!;
      const size = trade.size || 0;
      const price = trade.price || 0;
      const value = size * price;
      
      if (trade.side?.toLowerCase() === 'buy') {
        market.bought += size;
        market.buyValue += value;
      } else {
        market.sold += size;
        market.sellValue += value;
      }
      market.trades.push(trade);
    });

    // Calculate realized PnL per market (only from sold shares)
    let realizedPnlFromTrades = 0;
    let totalVolume = 0;
    let winningMarkets = 0;
    let closedMarkets = 0;

    marketPnl.forEach((market, key) => {
      totalVolume += market.buyValue + market.sellValue;
      
      // Only count as realized if shares were sold
      if (market.sold > 0) {
        const avgBuyPrice = market.bought > 0 ? market.buyValue / market.bought : 0;
        const avgSellPrice = market.sold > 0 ? market.sellValue / market.sold : 0;
        // Realized = what we got from selling - what we paid for those shares
        const soldSharesCost = market.sold * avgBuyPrice;
        const realizedForMarket = market.sellValue - soldSharesCost;
        realizedPnlFromTrades += realizedForMarket;
        
        // If fully closed position
        if (market.sold >= market.bought * 0.9) { // 90% or more sold = closed
          closedMarkets++;
          if (realizedForMarket > 0) winningMarkets++;
        }
      }
    });

    // Also add realized PnL from open positions (partial sells already captured)
    let openRealizedPnl = 0;
    openPositions.forEach((pos: any) => {
      openRealizedPnl += pos.realizedPnl || 0;
    });

    const realizedPnl = realizedPnlFromTrades;
    const totalPnl = realizedPnl + unrealizedPnl;
    const winRate = closedMarkets > 0 ? (winningMarkets / closedMarkets) * 100 : 0;

    console.log(`PnL from trades: realized=${realizedPnlFromTrades}, unrealized=${unrealizedPnl}, total=${totalPnl}, winRate=${winRate}%`);

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
