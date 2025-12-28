import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, ExternalLink, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/layout/Layout';
import { mockScouterTraders, TraderRow, fetchScouterTraders } from '@/lib/mockScouterTraders';
import { useDebounce } from '@/hooks/useDebounce';

// Types for filters
type SortField = keyof Pick<TraderRow, 'rank' | 'totalPnl' | 'score' | 'winRate' | 'rov' | 'sharpe' | 'pFactor'>;
type SortDirection = 'asc' | 'desc';

interface Filters {
  minWinRate: number;
  minScore: number;
  minTotalPnl: number;
  minSharpe: number;
  maxTradesPerMonth: number;
}

// Page size options
const PAGE_SIZES = [25, 50, 100];

export default function Scouter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [traders, setTraders] = useState<TraderRow[]>([]);
  const [loading, setLoading] = useState(true);

  // URL state management
  const searchQuery = searchParams.get('search') || '';
  const sortField = (searchParams.get('sort') as SortField) || 'rank';
  const sortDirection = (searchParams.get('dir') as SortDirection) || 'asc';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('size') || '25');

  // Filters from URL
  const filters: Filters = useMemo(() => ({
    minWinRate: parseInt(searchParams.get('minWinRate') || '0'),
    minScore: parseInt(searchParams.get('minScore') || '0'),
    minTotalPnl: parseInt(searchParams.get('minTotalPnl') || '0'),
    minSharpe: parseFloat(searchParams.get('minSharpe') || '0'),
    maxTradesPerMonth: parseInt(searchParams.get('maxTrades') || '1000'),
  }), [searchParams]);

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Load traders data
  useEffect(() => {
    const loadTraders = async () => {
      try {
        setLoading(true);
        // TODO: Replace with real API call
        const data = await fetchScouterTraders();
        setTraders(data);
      } catch (error) {
        console.error('Failed to load traders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTraders();
  }, []);

  // Filtered and sorted traders
  const filteredAndSortedTraders = useMemo(() => {
    let filtered = traders.filter(trader => {
      // Search filter
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch = trader.displayName?.toLowerCase().includes(searchLower) ||
                             trader.address.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Numeric filters
      if (trader.winRate < filters.minWinRate) return false;
      if (trader.score < filters.minScore) return false;
      if (trader.totalPnl < filters.minTotalPnl) return false;
      if (trader.sharpe < filters.minSharpe) return false;
      // TODO: Add trades per month filter when field is available

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return filtered;
  }, [traders, debouncedSearch, filters, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTraders.length / pageSize);
  const paginatedTraders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedTraders.slice(start, start + pageSize);
  }, [filteredAndSortedTraders, currentPage, pageSize]);

  // Update URL params
  const updateSearchParams = useCallback((updates: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === 0 || value === 'rank' || value === 'asc') {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });

    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Handlers
  const handleSort = (field: SortField) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    updateSearchParams({ sort: field, dir: newDirection, page: 1 });
  };

  const handleSearchChange = (value: string) => {
    updateSearchParams({ search: value, page: 1 });
  };

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    updateSearchParams({
      minWinRate: updatedFilters.minWinRate,
      minScore: updatedFilters.minScore,
      minTotalPnl: updatedFilters.minTotalPnl,
      minSharpe: updatedFilters.minSharpe,
      maxTrades: updatedFilters.maxTradesPerMonth,
      page: 1
    });
  };

  const handlePageChange = (page: number) => {
    updateSearchParams({ page });
  };

  const handlePageSizeChange = (size: string) => {
    updateSearchParams({ size: parseInt(size), page: 1 });
  };

  const resetFilters = () => {
    updateSearchParams({
      minWinRate: 0,
      minScore: 0,
      minTotalPnl: 0,
      minSharpe: 0,
      maxTrades: 1000,
      page: 1
    });
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get score badge variant
  const getScoreVariant = (score: number) => {
    if (score >= 90) return 'default'; // purple/green
    if (score >= 75) return 'secondary'; // good
    if (score >= 50) return 'outline'; // ok
    return 'destructive'; // risk
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-8 px-2 font-medium"
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="text-center">Loading traders...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Top Polymarket Traders</h1>
          <p className="text-muted-foreground">Advanced trading analytics and performance rankings</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name or address..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Traders</SheetTitle>
                  <SheetDescription>
                    Set minimum requirements for trader metrics
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 py-6">
                  <div className="space-y-2">
                    <Label htmlFor="minWinRate">Min Win Rate (%)</Label>
                    <Input
                      id="minWinRate"
                      type="number"
                      min="0"
                      max="100"
                      value={filters.minWinRate}
                      onChange={(e) => handleFilterChange({ minWinRate: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minScore">Min Score</Label>
                    <Input
                      id="minScore"
                      type="number"
                      min="0"
                      max="100"
                      value={filters.minScore}
                      onChange={(e) => handleFilterChange({ minScore: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minTotalPnl">Min Total PnL ($)</Label>
                    <Input
                      id="minTotalPnl"
                      type="number"
                      value={filters.minTotalPnl}
                      onChange={(e) => handleFilterChange({ minTotalPnl: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minSharpe">Min Sharpe</Label>
                    <Input
                      id="minSharpe"
                      type="number"
                      step="0.1"
                      value={filters.minSharpe}
                      onChange={(e) => handleFilterChange({ minSharpe: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTrades">Max Trades/Month</Label>
                    <Input
                      id="maxTrades"
                      type="number"
                      value={filters.maxTradesPerMonth}
                      onChange={(e) => handleFilterChange({ maxTradesPerMonth: parseInt(e.target.value) || 1000 })}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">Coming soon</p>
                  </div>

                  <Separator />

                  <Button onClick={resetFilters} variant="outline" className="w-full">
                    Reset Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Desktop Table */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <SortButton field="rank">Rank</SortButton>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Trader</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <SortButton field="totalPnl">Total PnL</SortButton>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <SortButton field="score">Score</SortButton>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <SortButton field="winRate">Win Rate</SortButton>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <SortButton field="rov">ROV</SortButton>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <SortButton field="sharpe">Sharpe</SortButton>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <SortButton field="pFactor">P.Factor</SortButton>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTraders.map((trader) => (
                    <tr key={trader.address} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <Badge variant="outline" className="font-mono">
                          #{trader.rank}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">
                              {trader.displayName || `${trader.address.slice(0, 6)}...${trader.address.slice(-4)}`}
                            </div>
                            {!trader.displayName && (
                              <div className="text-xs text-muted-foreground font-mono">
                                {trader.address}
                              </div>
                            )}
                          </div>
                          {trader.polymarketUrl && (
                            <a
                              href={trader.polymarketUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={trader.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(trader.totalPnl)}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge variant={getScoreVariant(trader.score)}>
                          {trader.score}
                        </Badge>
                      </td>
                      <td className="p-4">{trader.winRate}%</td>
                      <td className="p-4">{trader.rov}%</td>
                      <td className="p-4">{trader.sharpe.toFixed(2)}</td>
                      <td className="p-4">{trader.pFactor.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {paginatedTraders.map((trader) => (
            <Card key={trader.address}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      #{trader.rank}
                    </Badge>
                    <div>
                      <div className="font-medium">
                        {trader.displayName || `${trader.address.slice(0, 6)}...${trader.address.slice(-4)}`}
                      </div>
                      {!trader.displayName && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {trader.address}
                        </div>
                      )}
                    </div>
                  </div>
                  {trader.polymarketUrl && (
                    <a
                      href={trader.polymarketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Total PnL</div>
                    <div className={trader.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(trader.totalPnl)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Score</div>
                    <Badge variant={getScoreVariant(trader.score)} className="mt-1">
                      {trader.score}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Win Rate</div>
                    <div>{trader.winRate}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">ROV</div>
                    <div>{trader.rov}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Sharpe</div>
                    <div>{trader.sharpe.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">P.Factor</div>
                    <div>{trader.pFactor.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * pageSize + 1, filteredAndSortedTraders.length)} to{' '}
            {Math.min(currentPage * pageSize, filteredAndSortedTraders.length)} of{' '}
            {filteredAndSortedTraders.length} traders
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Rows per page:</span>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="px-3 text-sm">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
