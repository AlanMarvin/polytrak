import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ArrowUpDown, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRecentSearches } from '@/hooks/useRecentSearches';

export default function Recent() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'totalPnl' | 'smartScore' | 'winRate' | 'sharpeRatio' | 'volume'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get analyzed traders data from localStorage (static, no API calls)
  const { recentSearches } = useRecentSearches();

  // Convert recent searches to display format (static data, no API calls)
  const analyzedTraders = React.useMemo(() => {
    let filtered = recentSearches;

    // Filter by search query if provided
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = recentSearches.filter(trader =>
        trader.address.toLowerCase().includes(query)
      );
    }

    // Sort traders
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'timestamp':
          aValue = a.timestamp || 0;
          bValue = b.timestamp || 0;
          break;
        case 'totalPnl':
          aValue = a.totalPnl || 0;
          bValue = b.totalPnl || 0;
          break;
        case 'smartScore':
          aValue = a.smartScore || 0;
          bValue = b.smartScore || 0;
          break;
        case 'winRate':
          aValue = a.winRate || 0;
          bValue = b.winRate || 0;
          break;
        case 'sharpeRatio':
          aValue = a.sharpeRatio || 0;
          bValue = b.sharpeRatio || 0;
          break;
        case 'volume':
          aValue = a.volume || 0;
          bValue = b.volume || 0;
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [recentSearches, searchQuery, sortBy, sortOrder]);

  // Helper functions
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'outline';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Medium';
    return 'Risky';
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleTraderClick = (trader: RealTraderDataWithMeta) => {
    navigate(`/analyze?address=${trader.address}`);
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Analyzed Traders</h1>
                <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
                  BETA
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Chronological overview of all traders analyzed by PolyTrack
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setSortBy('timestamp');
                  setSortOrder('desc');
                }}
                variant="outline"
                size="sm"
                disabled={sortBy === 'timestamp' && sortOrder === 'desc'}
              >
                Most Recent
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by wallet or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Total Analyzed:</span>
            <span className="ml-2 font-semibold">{analyzedTraders.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Sorted by:</span>
            <span className="ml-2 font-semibold">
              {sortBy === 'timestamp' ? 'Most Recent' :
               sortBy === 'totalPnl' ? 'PnL' :
               sortBy === 'smartScore' ? 'Smart Score' :
               sortBy === 'winRate' ? 'Win Rate' :
               sortBy === 'sharpeRatio' ? 'Sharpe Ratio' :
               sortBy === 'volume' ? 'Volume' : 'Unknown'}
              {sortOrder === 'desc' ? ' ↓' : ' ↑'}
            </span>
          </div>
        </div>


        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-muted">
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none font-semibold"
                  onClick={() => handleSort('timestamp')}
                >
                  <div className="flex items-center gap-1">
                    Analyzed
                    <ArrowUpDown className="h-3 w-3" />
                    {sortBy === 'timestamp' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="font-semibold">
                  Trader
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none font-semibold text-right"
                  onClick={() => handleSort('totalPnl')}
                >
                  <div className="flex items-center gap-1 justify-end">
                    PnL
                    <ArrowUpDown className="h-3 w-3" />
                    {sortBy === 'totalPnl' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none font-semibold text-right"
                  onClick={() => handleSort('smartScore')}
                >
                  <div className="flex items-center gap-1 justify-end">
                    Smart Score
                    <ArrowUpDown className="h-3 w-3" />
                    {sortBy === 'smartScore' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none font-semibold text-right"
                  onClick={() => handleSort('winRate')}
                >
                  <div className="flex items-center gap-1 justify-end">
                    Win Rate
                    <ArrowUpDown className="h-3 w-3" />
                    {sortBy === 'winRate' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none font-semibold text-right"
                  onClick={() => handleSort('sharpeRatio')}
                >
                  <div className="flex items-center gap-1 justify-end">
                    Sharpe Ratio
                    <ArrowUpDown className="h-3 w-3" />
                    {sortBy === 'sharpeRatio' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none font-semibold text-right"
                  onClick={() => handleSort('volume')}
                >
                  <div className="flex items-center gap-1 justify-end">
                    Volume
                    <ArrowUpDown className="h-3 w-3" />
                    {sortBy === 'volume' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyzedTraders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No traders analyzed yet. Visit the Trader Analysis page to analyze your first trader.
                  </TableCell>
                </TableRow>
              ) : (
                analyzedTraders.map((trader) => (
                  <TableRow
                    key={trader.address}
                    className="cursor-pointer hover:bg-muted/50 border-muted"
                    onClick={() => handleTraderClick(trader)}
                  >
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {trader.timestamp ? new Date(trader.timestamp).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {(trader.username || trader.address.slice(0, 2)).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">
                            {trader.username || 'Anonymous Trader'}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {formatAddress(trader.address)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {trader.totalPnl >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        <span className={`font-medium font-mono ${
                          trader.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(trader.totalPnl)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-medium font-mono">
                          {trader.smartScore?.toFixed(1) || 'N/A'}
                        </span>
                        <Badge variant={getScoreBadgeVariant(trader.smartScore || 0)} className="text-xs">
                          {getScoreLabel(trader.smartScore || 0)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium font-mono">
                        {(trader.winRate >= 1 ? trader.winRate : (trader.winRate || 0) * 100).toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium font-mono">
                        {trader.sharpeRatio?.toFixed(2) || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium font-mono">
                        {formatCurrency(trader.volume || 0)}
                      </span>
                    </TableCell>
                  </TableRow>
                  ))
                )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {analyzedTraders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No traders analyzed yet. Visit the Trader Analysis page to analyze your first trader.
            </div>
          ) : (
            analyzedTraders.map((trader) => (
              <div
                key={trader.address}
                className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50"
                onClick={() => handleTraderClick(trader)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {(trader.username || trader.address.slice(0, 2)).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{trader.username || 'Anonymous Trader'}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {formatAddress(trader.address)}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {trader.timestamp ? new Date(trader.timestamp).toLocaleDateString() : 'N/A'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PnL</span>
                    <span className={`font-medium font-mono ${
                      trader.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(trader.totalPnl)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Score</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium font-mono">
                        {trader.smartScore?.toFixed(1) || 'N/A'}
                      </span>
                      <Badge variant={getScoreBadgeVariant(trader.smartScore || 0)} className="text-xs">
                        {getScoreLabel(trader.smartScore || 0)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Win Rate</span>
                    <span className="font-medium font-mono">
                      {(trader.winRate >= 1 ? trader.winRate : (trader.winRate || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sharpe Ratio</span>
                    <span className="font-medium font-mono">
                      {trader.sharpeRatio?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volume</span>
                    <span className="font-medium font-mono">
                      {formatCurrency(trader.volume || 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}