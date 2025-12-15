import { useState, useMemo } from 'react';
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
import { mockTraders, generateMockPositions, generateMockTrades } from '@/lib/mock-data';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Star, Copy, ExternalLink, TrendingUp, TrendingDown, 
  Wallet, Activity, Target, Clock, Search, ArrowRight,
  BarChart3, PieChart, Calendar, Zap, Brain, Gauge
} from 'lucide-react';

type ChartTimeFilter = '1D' | '1W' | '1M' | 'ALL';

// Generate PnL chart data based on time filter
const generatePnlChartData = (traderData: { 
  address: string; 
  pnl: number; 
  pnl24h: number; 
  pnl7d: number; 
  pnl30d: number 
}, timeFilter: ChartTimeFilter) => {
  const data = [];
  
  let points: number;
  let periodPnl: number;
  
  // Get the correct period PnL based on filter
  switch (timeFilter) {
    case '1D':
      points = 24;
      periodPnl = traderData.pnl24h;
      break;
    case '1W':
      points = 7;
      periodPnl = traderData.pnl7d;
      break;
    case '1M':
      points = 30;
      periodPnl = traderData.pnl30d;
      break;
    case 'ALL':
    default:
      points = 30;
      periodPnl = traderData.pnl; // Total PnL for ALL time
      break;
  }
  
  const hash = traderData.address.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  
  // For ALL time, start from 0 and end at current PnL
  // For periods, start from (currentPnL - periodPnl) and end at currentPnL
  const endPnl = traderData.pnl;
  const startPnl = timeFilter === 'ALL' ? 0 : endPnl - periodPnl;
  const pnlRange = endPnl - startPnl;
  
  for (let i = 0; i <= points; i++) {
    const progress = i / points;
    // Small noise for realism (max 3% of range)
    const noise = Math.sin(i * 0.7 + hash * 0.01) * Math.abs(pnlRange) * 0.03;
    // Linear progression from start to end with noise
    const pnl = startPnl + (pnlRange * progress) + noise;
    
    let label: string;
    if (timeFilter === '1D') {
      label = `${String(i).padStart(2, '0')}:00`;
    } else if (timeFilter === '1W') {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date().getDay();
      const dayIndex = (today - (points - i) + 7) % 7;
      label = dayNames[dayIndex];
    } else {
      const date = new Date();
      date.setDate(date.getDate() - (points - i));
      label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    data.push({
      date: label,
      pnl: Math.round(pnl),
    });
  }
  
  return data;
};

// Calculate Smart Score (0-100) based on multiple factors
const calculateSmartScore = (trader: any) => {
  // Win Rate Score (0-30 points)
  const winRateScore = Math.min(30, (trader.winRate / 100) * 40);
  
  // Consistency Score based on PnL stability (0-25 points)
  const pnlVolatility = Math.abs(trader.pnl24h) / Math.max(Math.abs(trader.pnl), 1);
  const consistencyScore = Math.max(0, 25 - (pnlVolatility * 100));
  
  // Volume Score (0-20 points) - Higher volume = more reliable data
  const volumeScore = Math.min(20, (trader.volume / 1000000) * 5);
  
  // Trade Count Score (0-15 points) - More trades = more data points
  const tradeScore = Math.min(15, (trader.totalTrades / 100) * 5);
  
  // Profitability Score (0-10 points)
  const profitScore = trader.pnl > 0 ? Math.min(10, (trader.pnl / 100000) * 5) : 0;
  
  return Math.round(winRateScore + consistencyScore + volumeScore + tradeScore + profitScore);
};

// Calculate Sharpe Ratio (simplified)
const calculateSharpeRatio = (trader: any) => {
  // Simplified Sharpe = (Return - Risk Free Rate) / Volatility
  // Using approximations for demo
  const avgReturn = trader.pnl / Math.max(trader.totalTrades, 1);
  const riskFreeRate = 0.05; // 5% annual
  const volatility = Math.abs(trader.pnl24h - trader.pnl7d / 7) / Math.max(Math.abs(trader.pnl), 1);
  
  if (volatility === 0) return 0;
  const sharpe = (avgReturn - riskFreeRate) / Math.max(volatility * 100, 0.1);
  return Math.min(3, Math.max(-3, sharpe));
};

// Get Smart Score color and label
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
  const { user } = useAuth();
  const { isWatching, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const { toast } = useToast();

  // Find trader or create mock data based on address
  const trader = useMemo(() => {
    if (!analyzedAddress) return null;
    
    const found = mockTraders.find(t => 
      t.address.toLowerCase() === analyzedAddress.toLowerCase()
    );
    
    if (found) return found;
    
    // Generate deterministic mock data based on address
    const hash = analyzedAddress.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      address: analyzedAddress,
      username: undefined,
      pnl: (hash % 500000) - 100000,
      pnl24h: (hash % 10000) - 2000,
      pnl7d: (hash % 50000) - 10000,
      pnl30d: (hash % 100000) - 20000,
      winRate: 45 + (hash % 25),
      totalTrades: 50 + (hash % 500),
      volume: 50000 + (hash % 2000000),
      positions: 2 + (hash % 10),
      lastActive: new Date(Date.now() - (hash % 86400000)).toISOString(),
    };
  }, [analyzedAddress]);

  const positions = useMemo(() => 
    trader ? generateMockPositions(trader.positions || 5) : [], 
    [trader]
  );
  
  const trades = useMemo(() => 
    trader ? generateMockTrades(50) : [], 
    [trader]
  );

  const chartData = useMemo(() => 
    trader ? generatePnlChartData(trader, chartTimeFilter) : [],
    [trader, chartTimeFilter]
  );

  const smartScore = useMemo(() => trader ? calculateSmartScore(trader) : 0, [trader]);
  const sharpeRatio = useMemo(() => trader ? calculateSharpeRatio(trader) : 0, [trader]);
  const smartScoreInfo = getSmartScoreInfo(smartScore);

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
      addToWatchlist(trader.address, trader.username);
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
              <span>Deep Trader Analytics</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">Analyze Any Trader</h1>
            <p className="text-muted-foreground">
              Paste a Polygon wallet address to view complete trading performance, positions, and history
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
              <Button type="submit" size="lg" className="h-12 px-6">
                Analyze <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Results Section */}
        {trader ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">
                      {trader.username || formatAddress(trader.address)}
                    </h2>
                    {trader.pnl > 100000 && (
                      <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                        🐋 Whale
                      </Badge>
                    )}
                    {trader.winRate > 60 && (
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        High Win Rate
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
                  // Determine if chart should be green (profit) or red (loss)
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
                            <XAxis 
                              dataKey="date" 
                              stroke="#888"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis 
                              stroke="#888"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => {
                                if (Math.abs(value) >= 1000000) {
                                  return `$${(value / 1000000).toFixed(1)}M`;
                                } else if (Math.abs(value) >= 1000) {
                                  return `$${(value / 1000).toFixed(0)}k`;
                                }
                                return `$${value}`;
                              }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                color: '#fff'
                              }}
                              formatter={(value: number) => [
                                `${value >= 0 ? '+' : ''}$${value.toLocaleString()}`, 
                                'PnL'
                              ]}
                            />
                            <Area
                              type="monotone"
                              dataKey="pnl"
                              stroke={chartColor}
                              strokeWidth={2}
                              fill="url(#pnlGradient)"
                            />
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
                    <span className="text-sm">Volume</span>
                  </div>
                  <p className="text-2xl font-bold font-mono">
                    ${(trader.volume / 1000000).toFixed(2)}M
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
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">24 Hours</p>
                    <p className={`text-xl font-bold font-mono ${trader.pnl24h >= 0 ? 'stat-profit' : 'stat-loss'}`}>
                      {formatPnl(trader.pnl24h)}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">7 Days</p>
                    <p className={`text-xl font-bold font-mono ${trader.pnl7d >= 0 ? 'stat-profit' : 'stat-loss'}`}>
                      {formatPnl(trader.pnl7d)}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">30 Days</p>
                    <p className={`text-xl font-bold font-mono ${trader.pnl30d >= 0 ? 'stat-profit' : 'stat-loss'}`}>
                      {formatPnl(trader.pnl30d)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Last Active</span>
                  </div>
                  <p className="text-lg font-medium">
                    {new Date(trader.lastActive).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Open Positions</span>
                  </div>
                  <p className="text-lg font-bold font-mono">{trader.positions}</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm">Avg Win</span>
                  </div>
                  <p className="text-lg font-bold font-mono stat-profit">
                    +${Math.abs((trader.pnl / trader.totalTrades) * 2).toFixed(0)}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <span className="text-sm">Avg Loss</span>
                  </div>
                  <p className="text-lg font-bold font-mono stat-loss">
                    -${Math.abs((trader.pnl / trader.totalTrades) * 0.8).toFixed(0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for Positions and Trade History */}
            <Tabs defaultValue="positions">
              <TabsList className="mb-4">
                <TabsTrigger value="positions">Open Positions ({positions.length})</TabsTrigger>
                <TabsTrigger value="history">Trade History</TabsTrigger>
              </TabsList>

              <TabsContent value="positions">
                <Card className="glass-card">
                  <CardContent className="p-0">
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
                        {positions.map((position) => (
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
                              ${position.size.toFixed(0)}
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card className="glass-card">
                  <CardContent className="p-0">
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
                        {trades.slice(0, 20).map((trade) => (
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
                              <Badge variant={trade.side === 'buy' ? 'default' : 'destructive'}>
                                {trade.side.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>{trade.outcome}</TableCell>
                            <TableCell className="font-mono">${trade.size.toFixed(0)}</TableCell>
                            <TableCell className="font-mono">{(trade.price * 100).toFixed(1)}¢</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Enter an address to analyze</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Paste any Polygon wallet address above to view their complete Polymarket trading performance, 
              open positions, and trade history.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
