import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const POLYMARKET_API = 'https://data-api.polymarket.com';

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

    // Fetch all data in parallel
    const [positionsRes, tradesRes, profileRes, closedPositionsRes] = await Promise.all([
      fetch(`${POLYMARKET_API}/positions?user=${address}`),
      fetch(`${POLYMARKET_API}/trades?user=${address}&limit=100`),
      fetch(`${POLYMARKET_API}/profiles/${address}`),
      fetch(`${POLYMARKET_API}/closed-positions?user=${address}&limit=100`),
    ]);

    const [positions, trades, profile, closedPositions] = await Promise.all([
      positionsRes.ok ? positionsRes.json() : [],
      tradesRes.ok ? tradesRes.json() : [],
      profileRes.ok ? profileRes.json() : null,
      closedPositionsRes.ok ? closedPositionsRes.json() : [],
    ]);

    console.log(`Fetched ${positions?.length || 0} positions, ${trades?.length || 0} trades`);

    // Calculate aggregated stats
    const openPositions = Array.isArray(positions) ? positions : [];
    const allTrades = Array.isArray(trades) ? trades : [];
    const closed = Array.isArray(closedPositions) ? closedPositions : [];

    // Calculate total PnL from open positions
    let totalPnl = 0;
    let totalInvested = 0;
    let totalCurrentValue = 0;

    openPositions.forEach((pos: any) => {
      totalPnl += pos.cashPnl || 0;
      totalInvested += pos.initialValue || 0;
      totalCurrentValue += pos.currentValue || 0;
    });

    // Add realized PnL from closed positions
    let realizedPnl = 0;
    closed.forEach((pos: any) => {
      realizedPnl += pos.realizedPnl || 0;
    });

    totalPnl += realizedPnl;

    // Calculate win rate from closed positions
    const winningTrades = closed.filter((pos: any) => (pos.realizedPnl || 0) > 0).length;
    const winRate = closed.length > 0 ? (winningTrades / closed.length) * 100 : 0;

    // Calculate volume from trades
    let totalVolume = 0;
    allTrades.forEach((trade: any) => {
      totalVolume += (trade.size || 0) * (trade.price || 0);
    });

    // Get time-based PnL (approximation from trades)
    const now = Date.now() / 1000;
    const day = 86400;
    
    let pnl24h = 0;
    let pnl7d = 0;
    let pnl30d = 0;

    // Calculate from recent trades (simplified - actual would need price history)
    allTrades.forEach((trade: any) => {
      const tradeAge = now - (trade.timestamp || 0);
      const tradePnl = trade.side === 'SELL' ? (trade.size || 0) * (trade.price || 0) : 0;
      
      if (tradeAge <= day) pnl24h += tradePnl;
      if (tradeAge <= day * 7) pnl7d += tradePnl;
      if (tradeAge <= day * 30) pnl30d += tradePnl;
    });

    // Get last active timestamp
    const lastTrade = allTrades[0];
    const lastActive = lastTrade?.timestamp 
      ? new Date(lastTrade.timestamp * 1000).toISOString() 
      : new Date().toISOString();

    // Build trader profile response
    const traderData = {
      address,
      username: profile?.name || profile?.pseudonym || null,
      profileImage: profile?.profileImage || profile?.profileImageOptimized || null,
      pnl: totalPnl,
      pnl24h,
      pnl7d,
      pnl30d,
      realizedPnl,
      unrealizedPnl: totalPnl - realizedPnl,
      winRate,
      totalTrades: allTrades.length,
      volume: totalVolume,
      totalInvested,
      totalCurrentValue,
      positions: openPositions.length,
      closedPositions: closed.length,
      lastActive,
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

    console.log(`Returning trader data: PnL=${totalPnl}, Positions=${openPositions.length}`);

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
