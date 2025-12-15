import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { mockTraders, generateMockPositions, generateMockTrades } from '@/lib/mock-data';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Star, Copy, ExternalLink, TrendingUp, TrendingDown, 
  Wallet, Activity, Target, Clock 
} from 'lucide-react';

export default function TraderProfile() {
  const { address } = useParams<{ address: string }>();
  const { user } = useAuth();
  const { isWatching, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const { toast } = useToast();
  
  // Find trader or create a placeholder
  const trader = useMemo(() => {
    return mockTraders.find(t => t.address === address) || {
      address: address || '',
      pnl: 0,
      pnl24h: 0,
      pnl7d: 0,
      pnl30d: 0,
      winRate: 0,
      totalTrades: 0,
      volume: 0,
      positions: 0,
      lastActive: new Date().toISOString(),
    };
  }, [address]);

  const positions = useMemo(() => generateMockPositions(trader.positions || 5), [trader.positions]);
  const trades = useMemo(() => generateMockTrades(50), []);

  const watching = isWatching(trader.address);

  const formatPnl = (value: number) => {
    const formatted = Math.abs(value).toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    });
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(trader.address);
    toast({ title: "Copied!", description: "Address copied to clipboard" });
  };

  const handleWatchlist = () => {
    if (watching) {
      removeFromWatchlist(trader.address);
    } else {
      addToWatchlist(trader.address, trader.username);
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">
                  {trader.username || formatAddress(trader.address)}
                </h1>
                {trader.pnl > 100000 && (
                  <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
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
                href={`https://thetradefox.com?copy=${trader.address}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="glow-primary">
                  Copy on TradeFox
                </Button>
              </a>
            </div>
          </div>
        </div>

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
                <TrendingUp className="h-4 w-4" />
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
            <CardTitle>PnL Breakdown</CardTitle>
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
      </div>
    </Layout>
  );
}
