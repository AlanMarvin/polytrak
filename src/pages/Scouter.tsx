import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, ExternalLink, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/layout/Layout';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useDebounce } from '@/hooks/useDebounce';

// Types for filters
type SortField = 'timestamp' | 'smartScore' | 'sharpeRatio' | 'copySuitability';
type SortDirection = 'asc' | 'desc';

interface Filters {
  minScore: number;
  minSharpe: number;
}

// Page size options
const PAGE_SIZES = [25, 50, 100];

export default function Scouter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { recentSearches } = useRecentSearches();

  // URL state management
  const searchQuery = searchParams.get('search') || '';
  const sortField = (searchParams.get('sort') as SortField) || 'rank';
  const sortDirection = (searchParams.get('dir') as SortDirection) || 'asc';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('size') || '25');

  // Filters from URL
  const filters: Filters = useMemo(() => ({
    minScore: parseInt(searchParams.get('minScore') || '0'),
    minSharpe: parseFloat(searchParams.get('minSharpe') || '0'),
  }), [searchParams]);

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Filtered and sorted searches
  const filteredAndSortedSearches = useMemo(() => {
    let filtered = recentSearches.filter(search => {
      // Search filter
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch = search.address.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Numeric filters - adapt to available fields
      if (search.smartScore < filters.minScore) return false;
      if (search.sharpeRatio < filters.minSharpe) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'timestamp':
          aVal = a.timestamp;
          bVal = b.timestamp;
          break;
        case 'smartScore':
          aVal = a.smartScore;
          bVal = b.smartScore;
          break;
        case 'sharpeRatio':
          aVal = a.sharpeRatio;
          bVal = b.sharpeRatio;
          break;
        case 'copySuitability':
          // Sort by suitability level: High > Medium > Low
          const suitabilityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          aVal = suitabilityOrder[a.copySuitability];
          bVal = suitabilityOrder[b.copySuitability];
          break;
        default:
          return 0;
      }

      // Handle numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return filtered;
  }, [recentSearches, debouncedSearch, filters, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedSearches.length / pageSize);
  const paginatedSearches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedSearches.slice(start, start + pageSize);
  }, [filteredAndSortedSearches, currentPage, pageSize]);

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
      minScore: updatedFilters.minScore,
      minSharpe: updatedFilters.minSharpe,
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
      minScore: 0,
      minSharpe: 0,
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

  // Handle row click to navigate to analyze page
  const handleRowClick = (address: string) => {
    navigate(`/analyze?address=${encodeURIComponent(address)}`);
  };


  return (
    <Layout>
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-8 w-8" />
            Your Analyzed Addresses
          </h1>
          <p className="text-muted-foreground">Addresses you've analyzed on Polytrak</p>
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
                    <Label htmlFor="minScore">Min Smart Score</Label>
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
                    <Label htmlFor="minSharpe">Min Sharpe Ratio</Label>
                    <Input
                      id="minSharpe"
                      type="number"
                      step="0.1"
                      value={filters.minSharpe}
                      onChange={(e) => handleFilterChange({ minSharpe: parseFloat(e.target.value) || 0 })}
                    />
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
                    <th className="h-12 px-4 text-left align-middle font-medium">Address</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <SortButton field="smartScore">Smart Score</SortButton>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <SortButton field="sharpeRatio">Sharpe Ratio</SortButton>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <SortButton field="copySuitability">Copy Suitability</SortButton>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <SortButton field="timestamp">Analyzed</SortButton>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSearches.map((search) => (
                    <tr
                      key={search.address}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleRowClick(search.address)}
                    >
                      <td className="p-4">
                        <div className="font-mono text-sm">
                          {`${search.address.slice(0, 6)}...${search.address.slice(-4)}`}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={getScoreVariant(search.smartScore)}>
                          {search.smartScore}
                        </Badge>
                      </td>
                      <td className="p-4">{search.sharpeRatio.toFixed(2)}</td>
                      <td className="p-4">
                        <Badge variant={
                          search.copySuitability === 'High' ? 'default' :
                          search.copySuitability === 'Medium' ? 'secondary' : 'outline'
                        }>
                          {search.copySuitability}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(search.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {paginatedSearches.map((search) => (
            <Card key={search.address} className="cursor-pointer" onClick={() => handleRowClick(search.address)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium font-mono text-sm">
                      {`${search.address.slice(0, 6)}...${search.address.slice(-4)}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Analyzed {new Date(search.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Smart Score</div>
                    <Badge variant={getScoreVariant(search.smartScore)} className="mt-1">
                      {search.smartScore}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Sharpe Ratio</div>
                    <div>{search.sharpeRatio.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Copy Suitability</div>
                    <Badge variant={
                      search.copySuitability === 'High' ? 'default' :
                      search.copySuitability === 'Medium' ? 'secondary' : 'outline'
                    } className="mt-1">
                      {search.copySuitability}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Address</div>
                    <div className="font-mono text-xs break-all">{search.address}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * pageSize + 1, filteredAndSortedSearches.length)} to{' '}
            {Math.min(currentPage * pageSize, filteredAndSortedSearches.length)} of{' '}
            {filteredAndSortedSearches.length} addresses
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
