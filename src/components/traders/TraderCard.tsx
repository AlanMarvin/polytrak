import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trader } from '@/types/polymarket';
import { Star, Copy, ExternalLink } from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface TraderCardProps {
  trader: Trader;
  rank: number;
}

export function TraderCard({ trader, rank }: TraderCardProps) {
  const { user } = useAuth();
  const { isWatching, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const { toast } = useToast();
  const watching = isWatching(trader.address);

  const formatPnl = (value: number) => {
    const formatted = Math.abs(value).toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    });
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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

  const getRankBadge = () => {
    if (rank === 1) return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
    if (rank === 2) return 'bg-slate-400/20 text-slate-400 border-slate-400/30';
    if (rank === 3) return 'bg-amber-600/20 text-amber-600 border-amber-600/30';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <Card className="glass-card hover:border-primary/30 transition-all duration-300 group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={`${getRankBadge()} font-mono text-sm px-2`}>
              #{rank}
            </Badge>
            <div>
              <Link 
                to={`/trader/${trader.address}`}
                className="font-semibold hover:text-primary transition-colors"
              >
                {trader.username || formatAddress(trader.address)}
              </Link>
              {trader.username && (
                <p className="text-xs text-muted-foreground font-mono">
                  {formatAddress(trader.address)}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={copyAddress}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            {user && (
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 ${watching ? 'text-yellow-500' : ''}`}
                onClick={handleWatchlist}
              >
                <Star className={`h-3.5 w-3.5 ${watching ? 'fill-current' : ''}`} />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Total PnL</p>
            <p className={`font-semibold font-mono ${trader.pnl >= 0 ? 'stat-profit' : 'stat-loss'}`}>
              {formatPnl(trader.pnl)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="font-semibold font-mono">{trader.winRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Trades</p>
            <p className="font-semibold font-mono">{trader.totalTrades.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Volume</p>
            <p className="font-semibold font-mono">
              ${(trader.volume / 1000000).toFixed(2)}M
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant="secondary" className={trader.pnl24h >= 0 ? 'text-success' : 'text-destructive'}>
              24h: {trader.pnl24h >= 0 ? '+' : ''}{((trader.pnl24h / Math.abs(trader.pnl)) * 100).toFixed(1)}%
            </Badge>
          </div>
          <Link to={`/trader/${trader.address}`}>
            <Button variant="ghost" size="sm" className="group-hover:text-primary">
              View Profile <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
