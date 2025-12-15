import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trader, TimeFilter, SortField, SortDirection } from '@/types/polymarket';
import { ArrowUpDown, Star, Copy, ExternalLink } from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface LeaderboardTableProps {
  traders: Trader[];
  timeFilter: TimeFilter;
}

export function LeaderboardTable({ traders, timeFilter }: LeaderboardTableProps) {
  const { user } = useAuth();
  const { isWatching, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const { toast } = useToast();
  const [sortField, setSortField] = useState<SortField>('pnl');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  const getPnlByTimeFilter = (trader: Trader) => {
    switch (timeFilter) {
      case '24h': return trader.pnl24h;
      case '7d': return trader.pnl7d;
      case '30d': return trader.pnl30d;
      default: return trader.pnl;
    }
  };

  const sortedTraders = [...traders].sort((a, b) => {
    let aVal: number, bVal: number;
    
    switch (sortField) {
      case 'pnl':
        aVal = getPnlByTimeFilter(a);
        bVal = getPnlByTimeFilter(b);
        break;
      case 'winRate':
        aVal = a.winRate;
        bVal = b.winRate;
        break;
      case 'volume':
        aVal = a.volume;
        bVal = b.volume;
        break;
      case 'totalTrades':
        aVal = a.totalTrades;
        bVal = b.totalTrades;
        break;
      default:
        aVal = a.pnl;
        bVal = b.pnl;
    }

    return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({ title: "Copied!", description: "Address copied to clipboard" });
  };

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Trader</TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleSort('pnl')}
                className="h-8 px-2 -ml-2"
              >
                PnL <ArrowUpDown className="h-3 w-3 ml-1" />
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleSort('winRate')}
                className="h-8 px-2 -ml-2"
              >
                Win Rate <ArrowUpDown className="h-3 w-3 ml-1" />
              </Button>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleSort('totalTrades')}
                className="h-8 px-2 -ml-2"
              >
                Trades <ArrowUpDown className="h-3 w-3 ml-1" />
              </Button>
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleSort('volume')}
                className="h-8 px-2 -ml-2"
              >
                Volume <ArrowUpDown className="h-3 w-3 ml-1" />
              </Button>
            </TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTraders.map((trader, index) => {
            const pnl = getPnlByTimeFilter(trader);
            const watching = isWatching(trader.address);
            
            return (
              <TableRow key={trader.address} className="group">
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`font-mono ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                      index === 1 ? 'bg-slate-400/20 text-slate-400 border-slate-400/30' :
                      index === 2 ? 'bg-amber-600/20 text-amber-600 border-amber-600/30' : ''
                    }`}
                  >
                    #{index + 1}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link 
                    to={`/trader/${trader.address}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {trader.username || formatAddress(trader.address)}
                  </Link>
                  {trader.username && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {formatAddress(trader.address)}
                    </p>
                  )}
                </TableCell>
                <TableCell className={`font-mono font-semibold ${pnl >= 0 ? 'stat-profit' : 'stat-loss'}`}>
                  {formatPnl(pnl)}
                </TableCell>
                <TableCell className="font-mono">{trader.winRate.toFixed(1)}%</TableCell>
                <TableCell className="hidden md:table-cell font-mono">
                  {trader.totalTrades.toLocaleString()}
                </TableCell>
                <TableCell className="hidden lg:table-cell font-mono">
                  ${(trader.volume / 1000000).toFixed(2)}M
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => copyAddress(trader.address)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {user && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 ${watching ? 'text-yellow-500 opacity-100' : ''}`}
                        onClick={() => watching 
                          ? removeFromWatchlist(trader.address) 
                          : addToWatchlist(trader.address, trader.username)
                        }
                      >
                        <Star className={`h-3.5 w-3.5 ${watching ? 'fill-current' : ''}`} />
                      </Button>
                    )}
                    <Link to={`/trader/${trader.address}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
