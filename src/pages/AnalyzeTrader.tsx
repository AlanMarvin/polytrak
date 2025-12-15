import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { 
  Star, Copy, ExternalLink, TrendingUp, TrendingDown, 
  Wallet, Activity, Target, Clock, Search, ArrowRight,
  BarChart3, PieChart, Calendar, Zap, Brain, Gauge, Loader2, Info
} from 'lucide-react';

type ChartTimeFilter = '1D' | '1W' | '1M' | 'ALL';

interface PnlHistoryPoint {
  timestamp: number;
  pnl: number;
  cumulative: number;
}

interface TraderData {
  address: string;
  username: string | null;
  profileImage: string | null;
  pnl: number;
  pnl24h: number;
  pnl7d: number;
  pnl30d: number;
  realizedPnl: number;
  unrealizedPnl: number;
  winRate: number;
  totalTrades: number;
  volume: number;
  totalInvested: number;
  totalCurrentValue: number;
  positions: number;
  closedPositions: number;
  lastActive: string;
  pnlHistory: PnlHistoryPoint[];
  openPositions: Array<{
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
  }>;
  recentTrades: Array<{
    id: string;
    timestamp: string;
    marketTitle: string;
    outcome: string;
    side: string;
    size: number;
    price: number;
    slug?: string;
  }>;
}

// Generate PnL chart data from real history
const generatePnlChartData = (traderData: TraderData, timeFilter: ChartTimeFilter) => {
  const now = Date.now();
  const day = 86400 * 1000;
  
  // Filter period
  let cutoffTime: number;
  switch (timeFilter) {
    case '1D':
      cutoffTime = now - day;
      break;
    case '1W':
      cutoffTime = now - day * 7;
      break;
    case '1M':
      cutoffTime = now - day * 30;
      break;
    case 'ALL':
    default:
      cutoffTime = 0;
      break;
  }
  
  const history = traderData.pnlHistory || [];
  
  // Filter history by time period
  const filteredHistory = history.filter(point => point.timestamp >= cutoffTime);
  
  if (filteredHistory.length === 0) {
    // No data for period - show flat line at current PnL
    return [
      { date: 'Start', pnl: traderData.realizedPnl },
      { date: 'Now', pnl: traderData.realizedPnl }
    ];
  }
  
  // Find starting cumulative PnL before this period
  const historyBeforePeriod = history.filter(point => point.timestamp < cutoffTime);
  const startingPnl = historyBeforePeriod.length > 0 
    ? historyBeforePeriod[historyBeforePeriod.length - 1].cumulative 
    : 0;
  
  // Build chart data starting from period start
  const data: Array<{ date: string; pnl: number }> = [];
  
  // Add starting point
  const startDate = new Date(cutoffTime || (filteredHistory[0]?.timestamp || now));
  data.push({
    date: formatChartDate(startDate, timeFilter),
    pnl: startingPnl
  });
  
  // Add each position close
  filteredHistory.forEach(point => {
    const date = new Date(point.timestamp);
    data.push({
      date: formatChartDate(date, timeFilter),
      pnl: point.cumulative
    });
  });
  
  return data;
};

const formatChartDate = (date: Date, timeFilter: ChartTimeFilter): string => {
  if (timeFilter === '1D') {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else if (timeFilter === '1W') {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Calculate Smart Score
// Calculate Smart Score - weighted composite of trading metrics
const calculateSmartScore = (trader: TraderData) => {
  // Win rate component (max 30 pts) - scaled exponentially for high win rates
  const winRateScore = Math.min(30, Math.pow(trader.winRate / 100, 0.8) * 35);
  
  // Profitability component (max 25 pts) - log scale for large PnLs
  const profitScore = trader.pnl > 0 
    ? Math.min(25, Math.log10(trader.pnl + 1) * 5) 
    : Math.max(-10, Math.log10(Math.abs(trader.pnl) + 1) * -3);
  
  // Volume/activity component (max 20 pts) - shows market engagement
  const volumeScore = Math.min(20, Math.log10(trader.volume + 1) * 3.5);
  
  // Experience component (max 15 pts) - based on closed positions
  const experienceScore = Math.min(15, Math.log10(trader.closedPositions + 1) * 8);
  
  // ROI efficiency (max 10 pts) - profit relative to volume
  const roi = trader.volume > 0 ? (trader.pnl / trader.volume) : 0;
  const roiScore = Math.max(0, Math.min(10, roi * 50));
  
  const total = winRateScore + profitScore + volumeScore + experienceScore + roiScore;
  return Math.round(Math.max(0, Math.min(100, total)));
};

// Calculate Sharpe Ratio - based on PnL history returns
const calculateSharpeRatio = (trader: TraderData) => {
  // Use PnL history if available for more accurate calculation
  const history = trader.pnlHistory || [];
  
  if (history.length < 2) {
    // Fallback: simple return/risk approximation
    if (trader.volume === 0) return 0;
    const returnRate = trader.pnl / trader.volume;
    // Scale by win rate as a volatility proxy
    const volatilityProxy = 1 - (trader.winRate / 100) + 0.1;
    return parseFloat((returnRate / volatilityProxy * 10).toFixed(2));
  }
  
  // Calculate individual position returns
  const returns = history.map(h => h.pnl);
  
  // Mean return
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  
  // Standard deviation of returns
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) {
    return trader.pnl > 0 ? 10 : 0;
  }
  
  // Sharpe = Mean Return / Std Dev (annualization factor for daily returns ~sqrt(365))
  // For position-level returns, we use a simpler scaling
  const sharpe = (meanReturn / stdDev) * Math.sqrt(history.length);
  
  return parseFloat(sharpe.toFixed(2));
};

// Calculate optimal copy trading strategy based on trader analysis
interface CopyStrategy {
  tradeSize: number; // % of bankroll per trade
  copyPercentage: number; // % of trader's trade to copy
  followExits: boolean;
  riskLevel: 'Conservative' | 'Moderate' | 'Aggressive';
  reasoning: string[];
}

const calculateOptimalStrategy = (trader: TraderData, allocatedFunds: number): CopyStrategy => {
  const reasoning: string[] = [];
  
  // Analyze trader metrics
  const winRate = trader.winRate;
  const sharpeRatio = calculateSharpeRatio(trader);
  const avgTradeSize = trader.volume / Math.max(trader.totalTrades, 1);
  const profitability = trader.pnl > 0;
  const experience = trader.closedPositions;
  
  // Calculate volatility from PnL history
  const history = trader.pnlHistory || [];
  
  // Determine risk level based on metrics
  let riskLevel: 'Conservative' | 'Moderate' | 'Aggressive' = 'Moderate';
  
  if (winRate >= 60 && sharpeRatio > 1 && profitability) {
    riskLevel = 'Aggressive';
    reasoning.push(`High win rate (${winRate.toFixed(1)}%) supports larger position sizes`);
  } else if (winRate < 45 || sharpeRatio < 0 || !profitability) {
    riskLevel = 'Conservative';
    reasoning.push(`Lower win rate (${winRate.toFixed(1)}%) suggests smaller position sizes`);
  } else {
    reasoning.push(`Moderate metrics suggest balanced position sizing`);
  }
  
  // Calculate trade size % (how much of bankroll per trade)
  let tradeSize: number;
  
  if (riskLevel === 'Aggressive') {
    tradeSize = Math.min(10, Math.max(3, winRate / 10));
    reasoning.push(`Recommended ${tradeSize.toFixed(0)}% per trade based on strong track record`);
  } else if (riskLevel === 'Conservative') {
    tradeSize = Math.min(5, Math.max(1, winRate / 20));
    reasoning.push(`Recommended ${tradeSize.toFixed(0)}% per trade to limit downside risk`);
  } else {
    tradeSize = Math.min(7, Math.max(2, winRate / 15));
    reasoning.push(`Recommended ${tradeSize.toFixed(0)}% per trade for balanced exposure`);
  }
  
  // Calculate copy percentage based on trader's avg trade size vs your bankroll
  let copyPercentage: number;
  const traderAvgTradeVsBankroll = avgTradeSize / allocatedFunds;
  
  if (traderAvgTradeVsBankroll > 0.5) {
    copyPercentage = Math.max(5, Math.min(15, 100 / (traderAvgTradeVsBankroll * 10)));
    reasoning.push(`Trader's avg trade ($${avgTradeSize.toFixed(0)}) is large vs your bankroll - copying ${copyPercentage.toFixed(0)}%`);
  } else if (traderAvgTradeVsBankroll > 0.1) {
    copyPercentage = Math.min(30, Math.max(15, 50 / traderAvgTradeVsBankroll));
    reasoning.push(`Trader's avg trade ($${avgTradeSize.toFixed(0)}) is moderate - copying ${copyPercentage.toFixed(0)}%`);
  } else {
    copyPercentage = Math.min(50, Math.max(25, 100 / (traderAvgTradeVsBankroll * 5)));
    reasoning.push(`Trader's avg trade ($${avgTradeSize.toFixed(0)}) is small - can copy ${copyPercentage.toFixed(0)}%`);
  }
  
  // Follow exits decision
  const followExits = trader.realizedPnl > 0 && winRate > 50;
  if (followExits) {
    reasoning.push(`Follow exits enabled - trader shows good exit timing`);
  } else {
    reasoning.push(`Follow exits disabled - consider manual exit timing`);
  }
  
  // Experience adjustment
  if (experience > 100) {
    reasoning.push(`Experienced trader with ${experience} closed positions`);
  } else if (experience < 20) {
    tradeSize = Math.max(1, tradeSize - 2);
    reasoning.push(`Limited track record (${experience} trades) - reduced size`);
  }
  
  return {
    tradeSize: Math.round(tradeSize),
    copyPercentage: Math.round(copyPercentage),
    followExits,
    riskLevel,
    reasoning
  };
};

const getSmartScoreInfo = (score: number) => {
  if (score >= 80) return { color: 'text-green-500', bg: 'bg-green-500/20', label: 'Excellent' };
  if (score >= 60) return { color: 'text-primary', bg: 'bg-primary/20', label: 'Good' };
  if (score >= 40) return { color: 'text-yellow-500', bg: 'bg-yellow-500/20', label: 'Average' };
  if (score >= 20) return { color: 'text-orange-500', bg: 'bg-orange-500/20', label: 'Below Avg' };
  return { color: 'text-red-500', bg: 'bg-red-500/20', label: 'Poor' };
};

export default function AnalyzeTrader() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputAddress, setInputAddress] = useState(searchParams.get('address') || '');
  const [analyzedAddress, setAnalyzedAddress] = useState(searchParams.get('address') || '');
  const [chartTimeFilter, setChartTimeFilter] = useState<ChartTimeFilter>('1M');
  const [trader, setTrader] = useState<TraderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allocatedFunds, setAllocatedFunds] = useState(1000);
  
  const { user } = useAuth();
  const { isWatching, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const { toast } = useToast();

  // Fetch trader data when address changes
  useEffect(() => {
    if (!analyzedAddress) {
      setTrader(null);
      return;
    }

    const fetchTraderData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching trader data for:', analyzedAddress);
        
        const { data, error: fnError } = await supabase.functions.invoke('polymarket-trader', {
          body: { address: analyzedAddress }
        });

        if (fnError) {
          throw new Error(fnError.message);
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        console.log('Received trader data:', data);
        setTrader(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch trader data';
        console.error('Error fetching trader:', message);
        setError(message);
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTraderData();
  }, [analyzedAddress, toast]);

  const chartData = useMemo(() => 
    trader ? generatePnlChartData(trader, chartTimeFilter) : [],
    [trader, chartTimeFilter]
  );

  const smartScore = useMemo(() => trader ? calculateSmartScore(trader) : 0, [trader]);
  const sharpeRatio = useMemo(() => trader ? calculateSharpeRatio(trader) : 0, [trader]);
  const smartScoreInfo = getSmartScoreInfo(smartScore);
  const copyStrategy = useMemo(() => 
    trader ? calculateOptimalStrategy(trader, allocatedFunds) : null,
    [trader, allocatedFunds]
  );

  const watching = trader ? isWatching(trader.address) : false;

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputAddress.trim();
    if (trimmed) {
      setAnalyzedAddress(trimmed);
      setSearchParams({ address: trimmed });
    }
  };

  const formatPnl = (value: number) => {
    const formatted = Math.abs(value).toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    });
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const formatAddress = (addr: string) => {
    if (addr.length <= 13) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = () => {
    if (trader) {
      navigator.clipboard.writeText(trader.address);
      toast({ title: "Copied!", description: "Address copied to clipboard" });
    }
  };

  const handleWatchlist = () => {
    if (!trader) return;
    if (watching) {
      removeFromWatchlist(trader.address);
    } else {
      addToWatchlist(trader.address, trader.username || undefined);
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary">
              <Zap className="h-4 w-4" />
              <span>Real Polymarket Data</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">Analyze Any Trader</h1>
            <p className="text-muted-foreground">
              Paste a Polygon wallet address to view real trading performance from Polymarket
            </p>
            
            <form onSubmit={handleAnalyze} className="flex gap-2 max-w-xl mx-auto mt-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="0x... (Polygon address)"
                  value={inputAddress}
                  onChange={(e) => setInputAddress(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-border/50 font-mono"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-6" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Analyze <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="glass-card">
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="glass-card">
              <CardContent className="p-6">
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/20 mb-4">
              <TrendingDown className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Failed to load trader data</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">{error}</p>
            <Button onClick={() => setAnalyzedAddress(analyzedAddress)}>
              Try Again
            </Button>
          </div>
        )}

        {/* Results Section */}
        {trader && !loading && (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                      {trader.profileImage ? (
                        <img 
                          src={trader.profileImage} 
                          alt="Profile" 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-lg font-bold text-primary">
                          {(trader.username || trader.address).slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold">
                      {trader.username || formatAddress(trader.address)}
                    </h2>
                    {trader.totalInvested > 1000000 && (
                      <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                        💰 Millionaire
                      </Badge>
                    )}
                    {trader.totalInvested > 100000 && trader.totalInvested <= 1000000 && (
                      <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                        🐋 Whale
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                      {trader.address}
                    </code>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyAddress}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <a 
                      href={`https://polygonscan.com/address/${trader.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>

                <div className="flex gap-2">
                  {user && (
                    <Button 
                      variant={watching ? 'default' : 'outline'}
                      onClick={handleWatchlist}
                    >
                      <Star className={`h-4 w-4 mr-2 ${watching ? 'fill-current' : ''}`} />
                      {watching ? 'Watching' : 'Add to Watchlist'}
                    </Button>
                  )}
                  <a 
                    href={`https://polyhub.bot?copy=${trader.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="glow-primary">
                      Copy on PolyHub
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* Smart Score & Sharpe Ratio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Brain className="h-5 w-5" />
                        <span className="text-sm font-medium">Smart Score</span>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                              <Info className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </Button>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold">What is Smart Score?</h4>
                              <p className="text-sm text-muted-foreground">
                                A composite score (0-100) evaluating trader quality based on multiple factors:
                              </p>
                              <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                                <li><strong>Win Rate (40%)</strong> - Percentage of profitable trades</li>
                                <li><strong>Consistency (25%)</strong> - Low PnL volatility over time</li>
                                <li><strong>Volume (20%)</strong> - Total trading volume</li>
                                <li><strong>Activity (10%)</strong> - Number of trades executed</li>
                                <li><strong>Profitability (5%)</strong> - Overall profit achieved</li>
                              </ul>
                              <p className="text-xs text-muted-foreground pt-2 border-t">
                                Higher scores indicate more reliable, consistent traders.
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <span className={`text-4xl font-bold font-mono ${smartScoreInfo.color}`}>
                          {smartScore}
                        </span>
                        <span className="text-muted-foreground">/100</span>
                        <Badge className={`${smartScoreInfo.bg} ${smartScoreInfo.color} border-0`}>
                          {smartScoreInfo.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Based on win rate, consistency, volume & trade history
                      </p>
                    </div>
                    <div className={`h-20 w-20 rounded-full ${smartScoreInfo.bg} flex items-center justify-center`}>
                      <span className={`text-2xl font-bold ${smartScoreInfo.color}`}>{smartScore}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Gauge className="h-5 w-5" />
                        <span className="text-sm font-medium">Sharpe Ratio</span>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                              <Info className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </Button>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold">What is Sharpe Ratio?</h4>
                              <p className="text-sm text-muted-foreground">
                                A measure of risk-adjusted returns developed by Nobel laureate William Sharpe.
                              </p>
                              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded font-mono">
                                Sharpe = (Return - Risk Free Rate) / Volatility
                              </div>
                              <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                                <li><strong>&lt; 0</strong> - Negative returns or high risk</li>
                                <li><strong>0 - 1</strong> - Average performance</li>
                                <li><strong>1 - 2</strong> - Good risk-adjusted returns</li>
                                <li><strong>&gt; 2</strong> - Excellent performance</li>
                                <li><strong>&gt; 3</strong> - Outstanding (rare)</li>
                              </ul>
                              <p className="text-xs text-muted-foreground pt-2 border-t">
                                Higher values indicate better returns relative to the risk taken.
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <span className={`text-4xl font-bold font-mono ${sharpeRatio >= 1 ? 'text-green-500' : sharpeRatio >= 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {sharpeRatio.toFixed(2)}
                        </span>
                        <Badge className={`${sharpeRatio >= 1 ? 'bg-green-500/20 text-green-500' : sharpeRatio >= 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'} border-0`}>
                          {sharpeRatio >= 2 ? 'Excellent' : sharpeRatio >= 1 ? 'Good' : sharpeRatio >= 0 ? 'Average' : 'Poor'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Risk-adjusted return metric (higher is better)
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Benchmark</div>
                      <div className="text-lg font-mono">&gt; 1.0</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* PnL Chart */}
            <Card className="glass-card mb-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  PnL Performance
                </CardTitle>
                <div className="flex gap-1">
                  {(['1D', '1W', '1M', 'ALL'] as ChartTimeFilter[]).map((filter) => (
                    <Button
                      key={filter}
                      variant={chartTimeFilter === filter ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setChartTimeFilter(filter)}
                      className="px-3"
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const periodPnl = chartTimeFilter === '1D' ? trader.pnl24h 
                    : chartTimeFilter === '1W' ? trader.pnl7d 
                    : chartTimeFilter === '1M' ? trader.pnl30d 
                    : trader.pnl;
                  const isProfit = periodPnl >= 0;
                  const chartColor = isProfit ? '#22c55e' : '#ef4444';
                  
                  return (
                    <div className="h-[300px] w-full">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                            <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis 
                              stroke="#888"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => {
                                if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                                if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                                return `$${value}`;
                              }}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                              formatter={(value: number) => [`${value >= 0 ? '+' : ''}$${value.toLocaleString()}`, 'PnL']}
                            />
                            <Area type="monotone" dataKey="pnl" stroke={chartColor} strokeWidth={2} fill="url(#pnlGradient)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No chart data available
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Wallet className="h-4 w-4" />
                    <span className="text-sm">Total PnL</span>
                  </div>
                  <p className={`text-2xl font-bold font-mono ${trader.pnl >= 0 ? 'stat-profit' : 'stat-loss'}`}>
                    {formatPnl(trader.pnl)}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Target className="h-4 w-4" />
                    <span className="text-sm">Win Rate</span>
                  </div>
                  <p className="text-2xl font-bold font-mono">{trader.winRate.toFixed(1)}%</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm">Total Trades</span>
                  </div>
                  <p className="text-2xl font-bold font-mono">{trader.totalTrades.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-sm">Total Invested</span>
                  </div>
                  <p className="text-2xl font-bold font-mono">
                    ${(trader.totalInvested / 1000000).toFixed(2)}M
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* PnL Breakdown */}
            <Card className="glass-card mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  PnL Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Realized</p>
                    <p className={`text-xl font-bold font-mono ${trader.realizedPnl >= 0 ? 'stat-profit' : 'stat-loss'}`}>
                      {formatPnl(trader.realizedPnl)}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Unrealized</p>
                    <p className={`text-xl font-bold font-mono ${trader.unrealizedPnl >= 0 ? 'stat-profit' : 'stat-loss'}`}>
                      {formatPnl(trader.unrealizedPnl)}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Open Positions</p>
                    <p className="text-xl font-bold font-mono">{trader.positions}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Closed</p>
                    <p className="text-xl font-bold font-mono">{trader.closedPositions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TradeFox Copy Trading Configuration */}
            <Card className="mb-8 border-2 border-orange-500/50 bg-gradient-to-br from-orange-500/10 via-background to-amber-500/10 shadow-lg shadow-orange-500/10">
              <CardHeader className="border-b border-orange-500/20 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <span className="text-3xl">🦊</span>
                      <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent font-bold">
                        AI-Optimized Copy Trading
                      </span>
                    </CardTitle>
                    <p className="text-muted-foreground text-sm mt-1">
                      Strategy calculated from trader's {trader.closedPositions} trades, {trader.winRate.toFixed(1)}% win rate
                    </p>
                  </div>
                  {copyStrategy && (
                    <Badge className={
                      copyStrategy.riskLevel === 'Aggressive' 
                        ? 'bg-green-500/20 text-green-500 border-green-500/30'
                        : copyStrategy.riskLevel === 'Conservative'
                        ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                        : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                    }>
                      {copyStrategy.riskLevel} Strategy
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Allocation Input */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    How much do you want to allocate to this trader?
                  </label>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-orange-500/30">
                    <span className="text-muted-foreground">Allocated Funds</span>
                    <div className="flex items-center gap-1">
                      <span className="text-orange-400 font-mono text-2xl">$</span>
                      <input 
                        type="text"
                        inputMode="numeric"
                        value={allocatedFunds}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setAllocatedFunds(Math.max(100, Number(val) || 100));
                        }}
                        className="w-28 text-right bg-transparent border-none font-mono text-2xl text-orange-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* AI Recommended Settings */}
                {copyStrategy && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">% Size for each trade</span>
                          <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-400">AI Recommended</Badge>
                        </div>
                        <p className="text-3xl font-bold text-orange-400 font-mono">{copyStrategy.tradeSize}%</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          = ${((allocatedFunds * copyStrategy.tradeSize) / 100).toFixed(0)} max per trade
                        </p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">% of each trade to copy</span>
                          <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-400">AI Recommended</Badge>
                        </div>
                        <p className="text-3xl font-bold text-orange-400 font-mono">{copyStrategy.copyPercentage}%</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          of trader's order size
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-background/50 border border-orange-500/30">
                      <div className="flex items-start gap-3">
                        <input 
                          type="checkbox" 
                          checked={copyStrategy.followExits}
                          readOnly
                          className="mt-1 h-5 w-5 rounded border-orange-500 text-orange-500 focus:ring-orange-500 accent-orange-500"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">Follow Exits</p>
                            <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-400">AI Recommended</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            When the trader reduces or closes a position, you sell the same percentage of your copied position.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Strategy Reasoning */}
                    <div className="p-4 rounded-lg bg-background/30 border border-border/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="h-4 w-4 text-orange-400" />
                        <span className="text-sm font-medium">Strategy Analysis</span>
                      </div>
                      <ul className="space-y-1">
                        {copyStrategy.reasoning.map((reason, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-orange-400">•</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                <div className="flex justify-center">
                  <a 
                    href={`https://thetradefox.com?copy=${trader.address}&tradeSize=${copyStrategy?.tradeSize || 5}&copyPercentage=${copyStrategy?.copyPercentage || 25}&followExits=${copyStrategy?.followExits ?? true}&bankroll=${allocatedFunds}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full md:w-auto"
                  >
                    <Button size="lg" className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25">
                      <span className="mr-2">🦊</span>
                      Start Copy Trading with AI Settings
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Positions and Trade History */}
            <Tabs defaultValue="positions">
              <TabsList className="mb-4">
                <TabsTrigger value="positions">Open Positions ({trader.openPositions.length})</TabsTrigger>
                <TabsTrigger value="history">Trade History ({trader.recentTrades.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="positions">
                <Card className="glass-card">
                  <CardContent className="p-0">
                    {trader.openPositions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Market</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Avg Price</TableHead>
                            <TableHead>Current</TableHead>
                            <TableHead>PnL</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trader.openPositions.map((position) => (
                            <TableRow key={position.id}>
                              <TableCell className="max-w-[200px]">
                                <p className="truncate font-medium">{position.marketTitle}</p>
                              </TableCell>
                              <TableCell>
                                <Badge variant={position.outcome === 'Yes' ? 'default' : 'secondary'}>
                                  {position.outcome}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono">
                                ${Math.round(position.size).toLocaleString()}
                              </TableCell>
                              <TableCell className="font-mono">
                                {(position.avgPrice * 100).toFixed(1)}¢
                              </TableCell>
                              <TableCell className="font-mono">
                                {(position.currentPrice * 100).toFixed(1)}¢
                              </TableCell>
                              <TableCell className={`font-mono font-semibold ${position.pnl >= 0 ? 'stat-profit' : 'stat-loss'}`}>
                                {formatPnl(position.pnl)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        No open positions
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card className="glass-card">
                  <CardContent className="p-0">
                    {trader.recentTrades.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Market</TableHead>
                            <TableHead>Side</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trader.recentTrades.map((trade) => (
                            <TableRow key={trade.id}>
                              <TableCell className="text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(trade.timestamp).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[200px]">
                                <p className="truncate">{trade.marketTitle}</p>
                              </TableCell>
                              <TableCell>
                                <Badge className={trade.side === 'buy' 
                                  ? 'bg-green-500/20 text-green-500 border-green-500/30' 
                                  : 'bg-red-500/20 text-red-500 border-red-500/30'}>
                                  {trade.side.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell>{trade.outcome}</TableCell>
                              <TableCell className="font-mono">${Math.round(trade.size).toLocaleString()}</TableCell>
                              <TableCell className="font-mono">{(trade.price * 100).toFixed(1)}¢</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        No trade history
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Empty State */}
        {!trader && !loading && !error && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Enter an address to analyze</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Paste any Polygon wallet address above to view their real Polymarket trading performance.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
