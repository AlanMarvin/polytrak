import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useRealTraderData, RealTraderDataWithMeta } from '@/hooks/useRealTraderData';

// Local trader display interface
interface TraderDisplay {
  address: string;
  username: string;
  totalPnl: number;
  winRate: number;
  smartScore: number;
  sharpeRatio: number;
  copySuitability: number | string;
}

// Static sample trader data as fallback
const sampleTraders: TraderDisplay[] = [
  {
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    username: 'CryptoKing',
    totalPnl: 45670,
    winRate: 0.72,
    smartScore: 88.5,
    sharpeRatio: 2.1,
    copySuitability: 92.3
  },
  {
    address: '0x8ba1f109551bD432803012645ac136ddd64DBA72',
    username: 'DeFiMaster',
    totalPnl: -12450,
    winRate: 0.58,
    smartScore: 74.2,
    sharpeRatio: 1.3,
    copySuitability: 76.8
  },
  {
    address: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
    username: 'YieldFarmer',
    totalPnl: 89200,
    winRate: 0.81,
    smartScore: 95.7,
    sharpeRatio: 2.8,
    copySuitability: 98.1
  },
  {
    address: '0x9876543210fedcba9876543210fedcba98765432',
    username: 'ArbitragePro',
    totalPnl: 23400,
    winRate: 0.66,
    smartScore: 82.3,
    sharpeRatio: 1.9,
    copySuitability: 85.4
  }
];

export default function Scouter() {
  // State for error handling
  const [hasHookError, setHasHookError] = useState(false);
  const [realTraders, setRealTraders] = useState<TraderDisplay[]>([]);

  // Initialize hooks with error handling
  let recentSearches: ReturnType<typeof useRecentSearches>['recentSearches'] = [];
  let traderData: RealTraderDataWithMeta[] = [];
  let isLoadingAll = false;

  try {
    // Call hooks at component level (required by React)
    const recentSearchesResult = useRecentSearches();
    const traderDataResult = useRealTraderData();

    recentSearches = recentSearchesResult.recentSearches;
    traderData = traderDataResult.traderData;
    isLoadingAll = traderDataResult.isLoadingAll;

  } catch (error) {
    console.error('❌ Hook error:', error);
    setHasHookError(true);
  }

  // Convert trader data to display format when it changes
  useEffect(() => {
    try {
      const tradersDisplay: TraderDisplay[] = traderData.map(t => ({
        address: t.address,
        username: t.username || 'Anonymous',
        totalPnl: t.pnl,
        winRate: t.winRate / 100, // Convert percentage to decimal
        smartScore: t.smartScore,
        sharpeRatio: t.sharpeRatio,
        copySuitability: t.copySuitability === 'High' ? 90 : t.copySuitability === 'Medium' ? 70 : 50
      }));
      setRealTraders(tradersDisplay);
    } catch (error) {
      console.error('❌ Error converting trader data:', error);
      setRealTraders([]);
    }
  }, [traderData]);

  // Determine which data to show
  const displayTraders = realTraders.length > 0 ? realTraders : sampleTraders;
  const isShowingSampleData = realTraders.length === 0 && !hasHookError;
  
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
    if (score >= 90) return 'default';
    if (score >= 75) return 'secondary';
    if (score >= 50) return 'outline';
    return 'destructive';
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Analyzed Traders</h1>
            <p className="text-muted-foreground">
              Track and analyze your trader portfolio performance
            </p>
          </div>
          <Button className="w-full sm:w-auto">
            Update All
          </Button>
        </div>

        {/* Data Status Notice */}
        <div className={`mb-6 p-4 border rounded-lg ${
          isShowingSampleData
            ? 'bg-blue-50 border-blue-200'
            : 'bg-green-50 border-green-200'
        }`}>
          {isShowingSampleData ? (
            <>
              <h3 className="font-semibold text-blue-800 mb-2">📊 Sample Data</h3>
              <p className="text-blue-700 text-sm">
                Showing sample traders because no real traders have been analyzed yet.
                Visit the Trader Analysis page to analyze real traders and see their data here.
              </p>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-green-800 mb-2">📊 Real Data</h3>
              <p className="text-green-700 text-sm">
                Showing {realTraders.length} real trader{realTraders.length !== 1 ? 's' : ''} from your recent analysis.
                {isLoadingAll && ' Data is currently updating...'}
              </p>
            </>
          )}

          {/* Debug Info */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Debug:</strong> Recent searches: {recentSearches.length} | Real traders: {realTraders.length} | Loading: {isLoadingAll ? 'Yes' : 'No'}</p>
              {hasHookError && <p className="text-red-600">⚠️ Hook error detected - using fallback data</p>}
            </div>
          </div>
        </div>

        {/* Traders Grid - Desktop */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayTraders.map((trader) => (
            <Card key={trader.address} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {trader.username.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{trader.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {trader.address.slice(0, 6)}...{trader.address.slice(-4)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total PnL</span>
                    <span className={`font-semibold ${trader.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(trader.totalPnl)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Win Rate</span>
                    <span className="font-semibold">{(trader.winRate * 100).toFixed(1)}%</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Smart Score</span>
                    <Badge variant={getScoreVariant(trader.smartScore)}>
                      {trader.smartScore.toFixed(1)}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                    <span className="font-semibold">{trader.sharpeRatio.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Copy Suitability</span>
                    <Badge variant={getScoreVariant(typeof trader.copySuitability === 'number' ? trader.copySuitability : 50)}>
                      {typeof trader.copySuitability === 'number' ? trader.copySuitability.toFixed(1) : trader.copySuitability}
                    </Badge>
                  </div>
                </div>

                <Button className="w-full mt-4" variant="outline">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Traders Cards - Mobile */}
        <div className="md:hidden space-y-4">
          {displayTraders.map((trader) => (
            <Card key={trader.address}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {trader.username.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{trader.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {trader.address.slice(0, 8)}...{trader.address.slice(-6)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total PnL</p>
                    <p className={`font-medium ${trader.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(trader.totalPnl)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Win Rate</p>
                    <p className="font-medium">{(trader.winRate * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Smart Score</p>
                    <Badge variant={getScoreVariant(trader.smartScore)} className="text-xs">
                      {trader.smartScore.toFixed(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sharpe Ratio</p>
                    <p className="font-medium">{trader.sharpeRatio.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Copy Suitability</p>
                    <Badge variant={getScoreVariant(typeof trader.copySuitability === 'number' ? trader.copySuitability : 50)} className="text-xs">
                      {typeof trader.copySuitability === 'number' ? trader.copySuitability.toFixed(1) : trader.copySuitability}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <Button variant="ghost" size="sm" className="w-full">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}