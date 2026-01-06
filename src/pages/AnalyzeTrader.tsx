import { useState, useEffect, useMemo, useRef } from 'react';
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

import { useWatchlist } from '@/hooks/useWatchlist';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { saveRecentSearch } from '@/hooks/useRecentSearches';
import { savePublicAnalysis } from '@/hooks/usePublicRecentAnalyses';
import { useTraderAnalysis } from '@/hooks/useTraderAnalysis';
import { ThreeColorRing } from '@/components/ui/three-color-ring';
import { PublicRecentAnalyses } from '@/components/analyze/PublicRecentAnalyses';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { 
  Star, Copy, ExternalLink, TrendingUp, TrendingDown, 
  Wallet, Activity, Target, Clock, Search, ArrowRight,
  BarChart3, PieChart, Calendar, Zap, Brain, Gauge, Loader2, Info,
  AlertTriangle, Settings2
} from 'lucide-react';
import tradefoxLogo from '@/assets/tradefox-logo.png';
import { LoadingProgress } from '@/components/analyze/LoadingProgress';
import { SEOHead } from '@/components/seo/SEOHead';
import { EditCopyTradingModal, AdvancedSettingsModal } from '@/components/copy-trading';
import { useAutoCopySettings, TraderStyleSignals, CopySettings, DEFAULT_COPY_SETTINGS } from '@/hooks/useAutoCopySettings';

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
  pnlIncludingOpenPartial?: number;
  pnl24h: number;
  pnl7d: number;
  pnl30d: number;
  realizedPnl: number;
  realizedPnlOpenPartial?: number;
  unrealizedPnl: number;
  winRate: number;
  totalTrades: number;
  trades30d: number; // Trades (fills) in last 30 days
  positions30d: number; // Unique markets entered in last 30 days
  volume: number;
  trueVolumeUsd?: number;
  rovPercent?: number | null;
  rovWarning?: string | null;
  totalInvested: number;
  totalCurrentValue: number;
  positions: number;
  closedPositions: number;
  lastActive: string;
  pnlHistory: PnlHistoryPoint[];
  dataReliability?: {
    score: 'high' | 'medium' | 'low';
    warnings: string[];
    positionsAnalyzed: number;
    rateLimitRetries: number;
    hitApiLimit: boolean;
  };
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

interface FeeImpact {
  level: 'Low' | 'Medium' | 'High';
  estimatedMonthlyTradeCount: number;
  estimatedMonthlyFees: number; // $ amount
  estimatedFeePercentage: number;
  netReturnLow: number; // Net return % (pessimistic)
  netReturnHigh: number; // Net return % (optimistic)
  reasons: string[];
  recommendations: string[];
  assumedTier: string;
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

// Check if trader is inactive (no activity in last 30 days)
const getInactivityStatus = (lastActive: string): { isInactive: boolean; daysSinceActive: number } => {
  if (!lastActive) return { isInactive: true, daysSinceActive: -1 };
  
  const lastActiveDate = new Date(lastActive);
  const now = new Date();
  const diffTime = now.getTime() - lastActiveDate.getTime();
  const daysSinceActive = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    isInactive: daysSinceActive > 30,
    daysSinceActive
  };
};

// Profit Factor utility functions (used by both Smart Score calculation and UI display)
// Uses daily aggregation from pnlHistory when available. Each pnlHistory entry represents
// a closed position's PnL, which we use as the atomic unit for profit factor calculation.
const getProfitFactorColor = (pf: number) => {
  if (pf < 1.0) return 'text-red-600';
  if (pf < 1.3) return 'text-yellow-600';
  if (pf < 1.7) return 'text-blue-600';
  if (pf < 2.0) return 'text-green-600';
  return 'text-purple-600';
};

const getProfitFactorBadge = (pf: number) => {
  if (pf < 1.5) return '⚠️ Risky';
  if (pf <= 2.5) return '✅ Healthy';
  return '🟢 Elite';
};

interface ProfitFactorResult {
  value: number;
  display: string;
  grossProfits: number;
  grossLosses: number;
}

// ROV (Return on Volume) utility functions
// Now uses backend-computed ROV from true trade volume
interface ROVResult {
  value: number | null;
  display: string;
  label: 'High Efficiency' | 'Moderate Efficiency' | 'Low Efficiency' | 'Insufficient Data';
  color: string;
  volumeDisplay: string;
  warning: string | null;
}

const calculateROV = (trader: TraderData): ROVResult => {
  // Use backend-computed ROV if available
  const rovPercent = (trader as any).rovPercent;
  const trueVolumeUsd = (trader as any).trueVolumeUsd;
  const rovWarning = (trader as any).rovWarning;
  
  // Format volume for display
  const formatVolume = (vol: number | undefined): string => {
    if (!vol || vol === 0) return '—';
    if (vol >= 1000000) return '$' + (vol / 1000000).toFixed(2) + 'M';
    if (vol >= 1000) return '$' + (vol / 1000).toFixed(1) + 'K';
    return '$' + vol.toFixed(0);
  };
  
  const volumeDisplay = formatVolume(trueVolumeUsd);
  
  // If backend returned null ROV (sanity check failed or insufficient data)
  if (rovPercent === null || rovPercent === undefined) {
    return {
      value: null,
      display: '—',
      label: 'Insufficient Data',
      color: 'text-muted-foreground',
      volumeDisplay,
      warning: rovWarning || 'Insufficient volume data for reliable ROV calculation'
    };
  }
  
  // Determine efficiency label based on ROV thresholds
  let label: ROVResult['label'];
  let color: string;
  
  if (rovPercent >= 0.30) {
    label = 'High Efficiency';
    color = 'text-green-500';
  } else if (rovPercent >= 0.15) {
    label = 'Moderate Efficiency';
    color = 'text-yellow-500';
  } else if (rovPercent >= 0) {
    label = 'Low Efficiency';
    color = 'text-orange-500';
  } else {
    // Negative ROV
    label = 'Low Efficiency';
    color = 'text-red-500';
  }
  
  return {
    value: rovPercent,
    display: rovPercent.toFixed(3) + '%',
    label,
    color,
    volumeDisplay,
    warning: rovWarning
  };
};

// Calculate Profit Factor: Total Gross Profits ÷ Total Gross Losses
// Uses realized PnL from closed positions (pnlHistory entries)
const calculateProfitFactor = (trader: TraderData): ProfitFactorResult => {
  const pnlHistory = trader.pnlHistory || [];
  
  // Need minimum history for reliable calculation
  if (pnlHistory.length < 20) {
    return {
      value: 0,
      display: 'Insufficient data',
      grossProfits: 0,
      grossLosses: 0
    };
  }
  
  let grossProfits = 0;
  let grossLosses = 0;
  
  // Sum all positive PnL (profits) and negative PnL (losses) separately
  pnlHistory.forEach((entry) => {
    if (entry && typeof entry.pnl === 'number') {
      if (entry.pnl > 0) {
        grossProfits += entry.pnl;
      } else if (entry.pnl < 0) {
        grossLosses += Math.abs(entry.pnl);
      }
    }
  });
  
  // Handle edge cases
  if (grossLosses === 0) {
    // No losses - cap at display value to avoid infinity
    return {
      value: 10,
      display: '>5.0',
      grossProfits,
      grossLosses
    };
  }
  
  const profitFactor = grossProfits / grossLosses;
  
  return {
    value: profitFactor,
    display: profitFactor.toFixed(2),
    grossProfits,
    grossLosses
  };
};

// Calculate Smart Score - stricter algorithm based on real trading performance
const calculateSmartScore = (trader: TraderData) => {
  // ROI is the most important metric - profit relative to volume traded
  const effectiveVolume =
    typeof trader.trueVolumeUsd === 'number' && trader.trueVolumeUsd > 0
      ? trader.trueVolumeUsd
      : trader.volume;
  const roi = effectiveVolume > 0 ? (trader.pnl / effectiveVolume) * 100 : 0; // as percentage

  // Debug logging for HashDive comparison
  if (trader.address === '0x0f8a7eb19e45234bb81134d1f2af474b69fbfd8d') {
    console.log('🔍 Smart Score Debug for trader 0x0f8a7eb19e45234bb81134d1f2af474b69fbfd8d:', {
      pnl: trader.pnl,
      trueVolumeUsd: trader.trueVolumeUsd,
      volume: trader.volume,
      effectiveVolume,
      roi,
      winRate: trader.winRate,
      closedPositions: trader.closedPositions,
      pnlHistoryLength: trader.pnlHistory?.length || 0
    });
  }
  
  // ROI component (max 35 pts) - the primary performance indicator
  let roiScore: number;
  if (roi <= 0) {
    roiScore = Math.max(-20, roi * 2);
  } else if (roi < 5) {
    roiScore = roi * 2;
  } else if (roi < 15) {
    roiScore = 10 + (roi - 5) * 1.5;
  } else {
    roiScore = Math.min(35, 25 + (roi - 15) * 0.5);
  }
  
  // Win rate component (max 25 pts)
  const winRate = trader.winRate;
  let winRateScore: number;
  if (winRate < 50) {
    winRateScore = Math.max(-10, (winRate - 50) * 0.5);
  } else if (winRate < 55) {
    winRateScore = (winRate - 50) * 1;
  } else if (winRate < 65) {
    winRateScore = 5 + (winRate - 55) * 1.5;
  } else {
    winRateScore = Math.min(25, 20 + (winRate - 65) * 0.5);
  }

  // Profit Factor contribution to Smart Score (max 15 pts)
  // Has less weight than Sharpe (consistency) but more than raw win rate
  // This penalizes traders with high win rate but poor risk control
  const profitFactorResult = calculateProfitFactor(trader);
  let profitFactorScore = 0;
  if (profitFactorResult.value > 0) {
    const pf = profitFactorResult.value;
    if (pf < 1.2) {
      // Negative impact for poor profit factor
      profitFactorScore = Math.max(-10, (pf - 1.2) * 20);
    } else if (pf < 1.8) {
      // Neutral: 0-5 pts
      profitFactorScore = (pf - 1.2) * 8.33;
    } else if (pf < 2.5) {
      // Positive: 5-12 pts
      profitFactorScore = 5 + (pf - 1.8) * 10;
    } else {
      // Strong positive (elite): 12-15 pts
      profitFactorScore = Math.min(15, 12 + (pf - 2.5) * 3);
    }
  }

  // Debug logging for HashDive comparison
  if (trader.address === '0x0f8a7eb19e45234bb81134d1f2af474b69fbfd8d') {
    console.log('🔍 Profit Factor Details for trader 0x0f8a7eb19e45234bb81134d1f2af474b69fbfd8d:', {
      profitFactorValue: profitFactorResult.value,
      profitFactorScore,
      totalWins: profitFactorResult.totalWins,
      totalLosses: profitFactorResult.totalLosses,
      avgWin: profitFactorResult.avgWin,
      avgLoss: profitFactorResult.avgLoss
    });
  }
  
  // Consistency component (max 20 pts) - based on Sharpe-like ratio
  // Uses PnL history to assess volatility of returns
  const history = trader.pnlHistory || [];
  let consistencyScore = 0;
  if (history.length >= 5) {
    const returns = history.map(h => h.pnl);
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev > 0 && meanReturn > 0) {
      const sharpeProxy = meanReturn / stdDev;
      consistencyScore = Math.min(20, Math.max(0, sharpeProxy * 10));
    } else if (meanReturn <= 0) {
      consistencyScore = Math.max(-10, meanReturn / 100); // Penalty for losing average
    }

    // Debug logging for HashDive comparison
    if (trader.address === '0x0f8a7eb19e45234bb81134d1f2af474b69fbfd8d') {
      console.log('🔍 Consistency Details for trader 0x0f8a7eb19e45234bb81134d1f2af474b69fbfd8d:', {
        pnlHistoryLength: history.length,
        meanReturn,
        stdDev,
        sharpeProxy: stdDev > 0 ? meanReturn / stdDev : 0,
        consistencyScore
      });
    }
  }
  
  // Experience component (max 15 pts) - only if profitable
  // Requires profitable + enough trades to matter
  let experienceScore = 0;
  if (trader.pnl > 0 && trader.closedPositions >= 10) {
    if (trader.closedPositions >= 500) {
      experienceScore = 15;
    } else if (trader.closedPositions >= 100) {
      experienceScore = 10 + (trader.closedPositions - 100) / 80; // 10-15 pts
    } else {
      experienceScore = trader.closedPositions / 10; // 1-10 pts
    }
  } else if (trader.pnl <= 0) {
    experienceScore = 0; // No experience credit for unprofitable traders
  }
  
  // Profitability bonus (max 5 pts) - small bonus for large absolute profits
  // Only matters if ROI is already decent
  let profitBonus = 0;
  if (roi > 3 && trader.pnl > 0) {
    if (trader.pnl > 1000000) profitBonus = 5;
    else if (trader.pnl > 100000) profitBonus = 3;
    else if (trader.pnl > 10000) profitBonus = 1;
  }

  const total = roiScore + winRateScore + consistencyScore + experienceScore + profitBonus;

  // Debug logging for HashDive comparison
  if (trader.address === '0x0f8a7eb19e45234bb81134d1f2af474b69fbfd8d') {
    console.log('🔍 Smart Score Components for trader 0x0f8a7eb19e45234bb81134d1f2af474b69fbfd8d:', {
      roiScore,
      winRateScore,
      profitFactorScore,
      consistencyScore,
      experienceScore,
      profitBonus,
      total,
      finalScore: Math.round(Math.max(0, Math.min(100, total)))
    });
  }

  // Scale to 0-100 and round
  // Realistic distribution: most traders should be 30-60, excellent 70+, elite 85+
  return Math.round(Math.max(0, Math.min(100, total)));
};

// Calculate Sharpe Ratio - based on PnL history returns
const calculateSharpeRatio = (trader: TraderData) => {
  // Use PnL history if available for more accurate calculation
  const history = trader.pnlHistory || [];
  
  if (history.length < 2) {
    // Fallback: simple return/risk approximation
    const trueVolumeUsd = (trader as any).trueVolumeUsd as number | undefined;
    const effectiveVolume = typeof trueVolumeUsd === 'number' && trueVolumeUsd > 0 ? trueVolumeUsd : trader.volume;
    if (effectiveVolume === 0) return 0;
    const returnRate = trader.pnl / effectiveVolume;
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
  maxDrawdown: number; // Expected max drawdown %
  expectedMonthlyReturn: number; // Expected monthly return %
}

const calculateOptimalStrategy = (trader: TraderData, allocatedFunds: number, copySuitability?: CopySuitability): CopyStrategy => {
  const reasoning: string[] = [];
  
  // Core trader metrics
  const winRateRaw = trader.winRate / 100; // Convert to decimal
  // Clamp for numerical stability (prevents log(0) and divide-by-zero in some formulas)
  const winRate = Math.min(0.99, Math.max(0.01, Number.isFinite(winRateRaw) ? winRateRaw : 0.5));
  const totalTrades = Math.max(Number.isFinite(trader.totalTrades) ? trader.totalTrades : 0, 1);
  const trueVolumeUsd = (trader as any).trueVolumeUsd as number | undefined;
  const effectiveVolume = typeof trueVolumeUsd === 'number' && trueVolumeUsd > 0
    ? trueVolumeUsd
    : (Number.isFinite(trader.volume) ? trader.volume : 0);
  const avgTradeSize = Number.isFinite(effectiveVolume / totalTrades) ? (effectiveVolume / totalTrades) : 0;
  const profitability = trader.pnl > 0;
  const experience = trader.closedPositions;
  const sharpeRatio = calculateSharpeRatio(trader);
  
  // Calculate average win/loss from PnL history using DELTAS between consecutive points
  // This fixes the bug where cumulative PnL values were being used instead of per-trade returns
  const history = trader.pnlHistory || [];
  let totalWin = 0;
  let totalLoss = 0;
  let winCount = 0;
  let lossCount = 0;
  
  // Filter out invalid timestamps (before year 2001 or in the future)
  const now = Date.now();
  const validHistory = history.filter(h => h.timestamp > 1000000000000 && h.timestamp <= now);
  
  // Calculate per-trade PnL from consecutive deltas
  for (let i = 1; i < validHistory.length; i++) {
    const delta = validHistory[i].pnl - validHistory[i - 1].pnl;
    if (delta > 0) {
      totalWin += delta;
      winCount++;
    } else if (delta < 0) {
      totalLoss += Math.abs(delta);
      lossCount++;
    }
  }
  
  const avgWin = winCount > 0 ? totalWin / winCount : avgTradeSize * 0.3;
  const avgLoss = lossCount > 0 ? totalLoss / lossCount : avgTradeSize * 0.2;
  
  // Calculate profit factor
  const profitFactor = avgLoss > 0 ? (avgWin * winRate) / (avgLoss * (1 - winRate)) : 1;
  
  // Kelly Criterion for optimal position sizing: f* = (bp - q) / b
  // where b = odds (avg win / avg loss), p = win probability, q = loss probability
  const odds = avgLoss > 0 ? avgWin / avgLoss : 1.5;
  const kellyFraction = Math.max(0, (odds * winRate - (1 - winRate)) / odds);
  
  // Use fractional Kelly (25-50% of full Kelly) for safety
  const kellyMultiplier = sharpeRatio > 1.5 ? 0.5 : sharpeRatio > 0.5 ? 0.35 : 0.25;
  const fractionalKelly = kellyFraction * kellyMultiplier;
  
  // Determine risk level based on multiple factors
  let riskLevel: 'Conservative' | 'Moderate' | 'Aggressive' = 'Moderate';
  let riskScore = 0;
  
  // Win rate scoring (0-30 points)
  if (winRate >= 0.65) riskScore += 30;
  else if (winRate >= 0.55) riskScore += 20;
  else if (winRate >= 0.45) riskScore += 10;
  
  // Sharpe ratio scoring (0-25 points)
  if (sharpeRatio > 2) riskScore += 25;
  else if (sharpeRatio > 1) riskScore += 15;
  else if (sharpeRatio > 0) riskScore += 5;
  
  // Profitability scoring (0-20 points)
  if (trader.pnl > 100000) riskScore += 20;
  else if (trader.pnl > 10000) riskScore += 15;
  else if (trader.pnl > 0) riskScore += 10;
  
  // Experience scoring (0-15 points)
  if (experience > 200) riskScore += 15;
  else if (experience > 50) riskScore += 10;
  else if (experience > 20) riskScore += 5;
  
  // Profit factor scoring (0-10 points)
  if (profitFactor > 2) riskScore += 10;
  else if (profitFactor > 1.5) riskScore += 5;
  
  // Set risk level based on score
  if (riskScore >= 70) {
    riskLevel = 'Aggressive';
    reasoning.push(`Strong trader profile (score: ${riskScore}/100) enables aggressive strategy`);
  } else if (riskScore >= 40) {
    riskLevel = 'Moderate';
    reasoning.push(`Balanced trader metrics (score: ${riskScore}/100) suggest moderate approach`);
  } else {
    riskLevel = 'Conservative';
    reasoning.push(`Cautious approach recommended (score: ${riskScore}/100)`);
  }
  
  // Calculate trade size based on Kelly + bankroll adjustments
  let tradeSize: number;
  const baseTradeSizeKelly = fractionalKelly * 100; // Convert to percentage
  
  // Bankroll-based adjustments
  let bankrollMultiplier = 1;
  if (allocatedFunds < 500) {
    bankrollMultiplier = 0.7; // Smaller bankrolls need less risk
    reasoning.push(`Small bankroll ($${allocatedFunds}) - reducing position sizes for safety`);
  } else if (allocatedFunds < 2000) {
    bankrollMultiplier = 0.85;
  } else if (allocatedFunds > 10000) {
    bankrollMultiplier = 1.1;
    reasoning.push(`Larger bankroll allows slightly higher allocation per trade`);
  }
  
  // Apply risk level caps
  if (riskLevel === 'Aggressive') {
    tradeSize = Math.min(15, Math.max(5, baseTradeSizeKelly * bankrollMultiplier));
    reasoning.push(`Kelly-optimized ${tradeSize.toFixed(0)}% per trade (${(kellyFraction * 100).toFixed(1)}% full Kelly × ${(kellyMultiplier * 100).toFixed(0)}%)`);
  } else if (riskLevel === 'Conservative') {
    tradeSize = Math.min(5, Math.max(1, baseTradeSizeKelly * bankrollMultiplier * 0.6));
    reasoning.push(`Conservative ${tradeSize.toFixed(0)}% per trade to protect capital`);
  } else {
    tradeSize = Math.min(10, Math.max(2, baseTradeSizeKelly * bankrollMultiplier * 0.8));
    reasoning.push(`Balanced ${tradeSize.toFixed(0)}% per trade for steady growth`);
  }
  
  // Calculate copy percentage - how much of each trader's trade to mirror
  // This depends on: trader's avg trade size vs your bankroll, and your risk tolerance
  let copyPercentage: number;
  const maxTradeAmount = allocatedFunds * (tradeSize / 100);
  const traderAvgVsYourMax = avgTradeSize / maxTradeAmount;
  
  if (traderAvgVsYourMax > 10) {
    // Trader trades way bigger than you can afford
    copyPercentage = Math.max(1, Math.min(5, 100 / traderAvgVsYourMax));
    reasoning.push(`Trader's avg trade ($${avgTradeSize.toLocaleString()}) is ${traderAvgVsYourMax.toFixed(0)}× your max - copy only ${copyPercentage.toFixed(0)}%`);
  } else if (traderAvgVsYourMax > 3) {
    copyPercentage = Math.max(5, Math.min(20, 60 / traderAvgVsYourMax));
    reasoning.push(`Scale down to ${copyPercentage.toFixed(0)}% of trader's positions`);
  } else if (traderAvgVsYourMax > 1) {
    copyPercentage = Math.max(15, Math.min(50, 100 / traderAvgVsYourMax));
    reasoning.push(`Match ${copyPercentage.toFixed(0)}% of trader's position sizes`);
  } else {
    // Your max trade is >= trader's avg - you could copy more but cap it
    copyPercentage = Math.min(100, Math.max(30, 50 * (1 / traderAvgVsYourMax)));
    reasoning.push(`Can copy up to ${copyPercentage.toFixed(0)}% - trader's avg ($${avgTradeSize.toLocaleString()}) fits your limits`);
  }
  
  // Follow exits is ALWAYS enabled (per product requirement)
  const followExits = true;
  reasoning.push(`Follow exits always enabled for risk management`);
  
  // Experience-based final adjustments
  if (experience < 20) {
    tradeSize = Math.max(1, tradeSize * 0.5);
    copyPercentage = Math.max(5, copyPercentage * 0.5);
    reasoning.push(`⚠️ Limited track record (${experience} trades) - halved allocations`);
  } else if (experience > 100) {
    reasoning.push(`✓ Proven track record with ${experience} closed positions`);
  }
  
  // Execution-dependent strategy adjustments
  if (copySuitability?.executionDependent) {
    // Reduce trade size by 40-50%
    tradeSize = Math.max(1, tradeSize * 0.55);
    // Reduce copy percentage by 60-70%
    copyPercentage = Math.max(1, copyPercentage * 0.35);
    // Downgrade risk level
    if (riskLevel === 'Aggressive') riskLevel = 'Moderate';
    else if (riskLevel === 'Moderate') riskLevel = 'Conservative';
    
    reasoning.push(`⚠️ Execution-dependent strategy detected - settings reduced for safety`);
    reasoning.push(`📉 Trade size reduced by ~45%, copy percentage reduced by ~65%`);
  }
  
  // Calculate expected outcomes
  const expectedWinPct = winRate * avgWin;
  const expectedLossPct = (1 - winRate) * avgLoss;
  let expectedTradeReturn = 0;
  if (avgTradeSize > 0) {
    expectedTradeReturn = (expectedWinPct - expectedLossPct) / avgTradeSize;
  } else {
    reasoning.push('Insufficient volume data - return estimate unavailable until full history loads');
  }

  // Debug logging for expected monthly return calculation
  if (trader.address === '0x7a0da16a1205ee51a56fa862e8baa61e350eff14' ||
      trader.address === '0x0f8a7eb19e45234bb81134d1f2af474b69fbfd8d') {
    console.log('🔍 Expected Monthly Return Debug for trader:', trader.address, {
      winRate,
      avgWin,
      avgLoss,
      avgTradeSize,
      expectedWinPct,
      expectedLossPct,
      expectedTradeReturn,
      totalTrades,
      validHistoryLength: validHistory.length,
      firstValidTimestamp,
      timeSpanDays: (Date.now() - firstValidTimestamp) / (24 * 60 * 60 * 1000),
      tradesPerMonth
    });
  }
  
  // Reuse validHistory from earlier or filter for timestamp calculation
  const firstValidTimestamp = validHistory.length > 0
    ? validHistory[0].timestamp
    : Date.now() - (30 * 24 * 60 * 60 * 1000);
  const tradesPerMonth = Math.min(totalTrades / Math.max(1, (Date.now() - firstValidTimestamp) / (30 * 24 * 60 * 60 * 1000)), 30);
  let expectedMonthlyReturn = expectedTradeReturn * (copyPercentage / 100) * (tradeSize / 100) * tradesPerMonth * 100;

  // Debug logging for monthly return calculation
  if (trader.address === '0x7a0da16a1205ee51a56fa862e8baa61e350eff14' ||
      trader.address === '0x0f8a7eb19e45234bb81134d1f2af474b69fbfd8d') {
    console.log('🔍 Monthly Return Base Calculation for trader:', trader.address, {
      expectedTradeReturn,
      copyPercentage,
      tradeSize,
      tradesPerMonth,
      expectedMonthlyReturn: expectedMonthlyReturn,
      isFinite: Number.isFinite(expectedMonthlyReturn)
    });
  }

  if (!Number.isFinite(expectedMonthlyReturn)) {
    expectedMonthlyReturn = 0;
    reasoning.push('Return estimate stabilized (insufficient data during progressive load)');
  }

  // Apply bot detection adjustments to prevent unrealistic returns
  if (copySuitability) {
    const botFlags = copySuitability.flags;
    let botReductionMultiplier = 1.0;

    // Debug logging for bot detection
    if (trader.address === '0x7a0da16a1205ee51a56fa862e8baa61e350eff14' ||
        trader.address === '0x0f8a7eb19e45234bb81134d1f2af474b69fbfd8d') {
      console.log('🔍 Bot Detection Flags for trader:', trader.address, {
        botFlags,
        initialExpectedMonthlyReturn: expectedMonthlyReturn
      });
    }

    // Check for high-frequency trading (likely bot behavior)
    if (botFlags.some(flag => flag.includes('High trade frequency') || flag.includes('Small trade sizes with high frequency'))) {
      botReductionMultiplier *= 0.3; // Reduce by 70% for high-frequency patterns
      reasoning.push('⚠️ High-frequency trading detected - return estimate significantly reduced');
    }

    // Check for execution-dependent strategies (difficult to replicate)
    if (botFlags.some(flag => flag.includes('Low profit margin on high volume'))) {
      botReductionMultiplier *= 0.5; // Reduce by 50% for execution-dependent strategies
      reasoning.push('⚠️ Execution-dependent strategy - return estimate reduced for realism');
    }

    // Check for high position churn (frequent adjustments)
    if (botFlags.some(flag => flag.includes('High position churn'))) {
      botReductionMultiplier *= 0.7; // Reduce by 30% for high churn
      reasoning.push('⚠️ High position adjustment frequency - return estimate moderated');
    }

    // Cap maximum expected monthly return to realistic levels
    const maxRealisticReturn = 50; // 50% monthly maximum for realistic trading
    if (expectedMonthlyReturn > maxRealisticReturn) {
      const capMultiplier = maxRealisticReturn / expectedMonthlyReturn;
      botReductionMultiplier *= capMultiplier;
      reasoning.push(`⚠️ Return estimate capped at ${maxRealisticReturn}% for realistic expectations`);
    }

    expectedMonthlyReturn *= botReductionMultiplier;

    // Debug logging for final result
    if (trader.address === '0x7a0da16a1205ee51a56fa862e8baa61e350eff14' ||
        trader.address === '0x0f8a7eb19e45234bb81134d1f2af474b69fbfd8d') {
      console.log('🔍 Final Monthly Return for trader:', trader.address, {
        botReductionMultiplier,
        finalExpectedMonthlyReturn: expectedMonthlyReturn,
        reasoning
      });
    }

    // Re-check finiteness after adjustments
    if (!Number.isFinite(expectedMonthlyReturn)) {
      expectedMonthlyReturn = 0;
      reasoning.push('Return estimate stabilized after adjustments (insufficient data)');
    }
  }
  
  // Max drawdown estimation (simplified)
  const maxConsecutiveLosses = Math.ceil(Math.log(0.01) / Math.log(1 - winRate)); // 99% confidence
  const lossRatio = avgTradeSize > 0 ? (avgLoss / avgTradeSize) : 0;
  const maxDrawdown = Math.min(50, maxConsecutiveLosses * tradeSize * lossRatio);
  
  return {
    tradeSize: Math.round(Math.max(1, Math.min(20, tradeSize))),
    copyPercentage: Math.round(Math.max(1, Math.min(100, copyPercentage))),
    followExits,
    riskLevel,
    reasoning,
    maxDrawdown: Math.round(maxDrawdown),
    expectedMonthlyReturn: Number.isFinite(expectedMonthlyReturn)
      ? Math.round(expectedMonthlyReturn * 10) / 10
      : 0
  };
};

const getSmartScoreInfo = (score: number) => {
  if (score >= 80) return { color: 'text-green-500', bg: 'bg-green-500/20', label: 'Excellent' };
  if (score >= 60) return { color: 'text-primary', bg: 'bg-primary/20', label: 'Good' };
  if (score >= 40) return { color: 'text-yellow-500', bg: 'bg-yellow-500/20', label: 'Average' };
  if (score >= 20) return { color: 'text-orange-500', bg: 'bg-orange-500/20', label: 'Below Avg' };
  return { color: 'text-red-500', bg: 'bg-red-500/20', label: 'Poor' };
};

// Calculate Risk Regime based on trader behavior patterns
const calculateRiskRegime = (trader: TraderData) => {
  const avgTradeSize = trader.totalInvested / Math.max(1, trader.totalTrades);
  const volumePerTrade = trader.volume / Math.max(1, trader.totalTrades);
  const pnlVolatility = Math.abs(trader.pnl) / Math.max(1, trader.totalInvested);
  
  // Risk Profile: Conservative / Moderate / Aggressive
  let riskProfile: 'Conservative' | 'Moderate' | 'Aggressive';
  let riskReasoning: string;
  
  // Analyze trade sizing relative to volume
  const tradeSizeRatio = avgTradeSize / Math.max(1, volumePerTrade);
  const positionConcentration = trader.positions > 0 ? trader.totalCurrentValue / trader.positions : 0;
  
  if (tradeSizeRatio < 0.3 && trader.winRate > 55) {
    riskProfile = 'Conservative';
    riskReasoning = 'Smaller positions with higher win rate focus';
  } else if (tradeSizeRatio > 0.6 || pnlVolatility > 0.5) {
    riskProfile = 'Aggressive';
    riskReasoning = 'Larger position sizing with higher volatility tolerance';
  } else {
    riskProfile = 'Moderate';
    riskReasoning = 'Balanced approach between risk and reward';
  }
  
  // Liquidity Sensitivity: High / Medium / Low
  let liquiditySensitivity: 'High' | 'Medium' | 'Low';
  let liquidityReasoning: string;
  
  // Analyze based on trade frequency and position sizing
  const tradesPerPosition = trader.totalTrades / Math.max(1, trader.closedPositions + trader.positions);
  
  if (avgTradeSize > 10000 || tradesPerPosition < 2) {
    liquiditySensitivity = 'High';
    liquidityReasoning = 'Trades larger positions, needs liquid markets';
  } else if (avgTradeSize > 1000 || tradesPerPosition < 5) {
    liquiditySensitivity = 'Medium';
    liquidityReasoning = 'Moderate position sizes, some liquidity needs';
  } else {
    liquiditySensitivity = 'Low';
    liquidityReasoning = 'Smaller positions, flexible across markets';
  }
  
  // Best conditions analysis
  const bestConditions: string[] = [];
  
  // Position duration preference
  if (trader.positions > 5 && trader.closedPositions < trader.positions * 2) {
    bestConditions.push('Longer-duration positions');
  } else {
    bestConditions.push('Short-duration positions');
  }
  
  // Volume/liquidity preference
  if (avgTradeSize > 5000) {
    bestConditions.push('High-liquidity markets');
  } else {
    bestConditions.push('Various liquidity levels');
  }
  
  // Win rate driven conditions
  if (trader.winRate > 60) {
    bestConditions.push('Probability ranges 55-75%');
  } else if (trader.winRate > 45) {
    bestConditions.push('Probability ranges 40-60%');
  } else {
    bestConditions.push('High-risk asymmetric bets');
  }
  
  return {
    riskProfile,
    riskReasoning,
    liquiditySensitivity,
    liquidityReasoning,
    bestConditions
  };
};

// Calculate Market Focus from positions and trades
const calculateMarketFocus = (trader: TraderData) => {
  const categories: Record<string, number> = {
    Politics: 0,
    Macro: 0,
    Sports: 0,
    Crypto: 0,
    Entertainment: 0,
    Other: 0
  };
  
  // Keywords for categorization
  const politicsKeywords = ['president', 'election', 'trump', 'biden', 'congress', 'senate', 'vote', 'political', 'democrat', 'republican', 'gov', 'policy'];
  const macroKeywords = ['fed', 'inflation', 'gdp', 'rate', 'economy', 'jobs', 'unemployment', 'recession', 'stock', 'market', 'sp500', 'nasdaq'];
  const sportsKeywords = ['nfl', 'nba', 'mlb', 'soccer', 'football', 'basketball', 'baseball', 'tennis', 'golf', 'ufc', 'boxing', 'super bowl', 'championship'];
  const cryptoKeywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'token', 'defi', 'solana'];
  const entertainmentKeywords = ['oscar', 'movie', 'celebrity', 'tv', 'show', 'award', 'grammy', 'emmy'];
  
  const categorize = (title: string) => {
    const lower = title.toLowerCase();
    if (politicsKeywords.some(k => lower.includes(k))) return 'Politics';
    if (macroKeywords.some(k => lower.includes(k))) return 'Macro';
    if (sportsKeywords.some(k => lower.includes(k))) return 'Sports';
    if (cryptoKeywords.some(k => lower.includes(k))) return 'Crypto';
    if (entertainmentKeywords.some(k => lower.includes(k))) return 'Entertainment';
    return 'Other';
  };
  
  // Analyze open positions
  trader.openPositions.forEach(pos => {
    const cat = categorize(pos.marketTitle);
    categories[cat] += Math.abs(pos.size);
  });
  
  // Analyze recent trades
  trader.recentTrades.forEach(trade => {
    const cat = categorize(trade.marketTitle);
    categories[cat] += Math.abs(trade.size);
  });
  
  // Calculate percentages
  const total = Object.values(categories).reduce((a, b) => a + b, 0);
  if (total === 0) return { breakdown: [], dominantCategory: 'Other', dominantPercent: 0 };
  
  const breakdown = Object.entries(categories)
    .map(([name, value]) => ({ name, percent: Math.round((value / total) * 100) }))
    .filter(c => c.percent > 0)
    .sort((a, b) => b.percent - a.percent);
  
  const dominant = breakdown[0] || { name: 'Other', percent: 0 };
  
  return {
    breakdown,
    dominantCategory: dominant.name,
    dominantPercent: dominant.percent
  };
};

// Trader Classification for TradeFox settings
type TraderClassification = 'Conservative' | 'Moderate' | 'Aggressive';

interface TradeFoxAdvancedSettings {
  maxMarket: number;
  maxMarketReason: string;
  minMarket: number;
  minMarketReason: string;
  maxCopyPerTrade: number;
  maxCopyPerTradeReason: string;
  minVolumePerMarket: number;
  minVolumePerMarketReason: string;
  minLiquidityPerMarket: number;
  minLiquidityPerMarketReason: string;
  marketPriceRangeMin: number;
  marketPriceRangeMax: number;
  marketPriceRangeReason: string;
  maxSlippageCents: number;
  maxSlippageReason: string;
  maxTimeUntilResolution: number;
  maxTimeUntilResolutionReason: string;
  traderClassification: TraderClassification;
}

const classifyTrader = (avgTradeSizeUsd: number, tradesPerDay: number): TraderClassification => {
  // Conservative if avgTradeSizeUsd < 200 AND tradesPerDay <= 3
  if (avgTradeSizeUsd < 200 && tradesPerDay <= 3) {
    return 'Conservative';
  }
  // Aggressive if avgTradeSizeUsd > 1000 OR tradesPerDay > 10
  if (avgTradeSizeUsd > 1000 || tradesPerDay > 10) {
    return 'Aggressive';
  }
  // Else Moderate
  return 'Moderate';
};

interface TradeFoxAdvancedSettingsWithHighFreq extends TradeFoxAdvancedSettings {
  isHighFrequency: boolean;
}

const calculateAdvancedSettings = (
  allocation: number, 
  classification: TraderClassification,
  trader: TraderData | null,
  copySuitability: CopySuitability | null
): TradeFoxAdvancedSettingsWithHighFreq => {
  // Base calculations
  let maxMarket: number;
  let minMarket: number;
  let maxCopyPerTrade: number;

  switch (classification) {
    case 'Conservative':
      maxMarket = allocation * 0.20;
      minMarket = Math.max(allocation * 0.03, 25);
      maxCopyPerTrade = allocation * 0.05;
      break;
    case 'Aggressive':
      maxMarket = allocation * 0.35;
      minMarket = Math.max(allocation * 0.04, 30);
      maxCopyPerTrade = allocation * 0.08;
      break;
    case 'Moderate':
    default:
      maxMarket = allocation * 0.25;
      minMarket = Math.max(allocation * 0.03, 25);
      maxCopyPerTrade = allocation * 0.06;
      break;
  }

  // Round to nearest $5
  maxMarket = Math.round(maxMarket / 5) * 5;
  maxCopyPerTrade = Math.round(maxCopyPerTrade / 5) * 5;
  minMarket = Math.round(minMarket);

  // Validations
  if (minMarket > maxMarket) minMarket = maxMarket;
  if (maxCopyPerTrade > maxMarket) maxCopyPerTrade = maxMarket;

  // Calculate trader-specific metrics
  const avgTradeSize = trader ? trader.volume / Math.max(1, trader.totalTrades) : 500;
  const tradesPerDay = copySuitability?.tradesPerDay || 3;
  const tradesPerMonth = tradesPerDay * 30;
  const closedPositions = trader?.closedPositions || 0;
  
  // High-frequency trader detection
  const isHighFrequency = tradesPerMonth > 100 || closedPositions > 2000;
  
  // Min volume per market - based on trader's average trade size and liquidity needs
  // Higher frequency traders need more liquid markets
  let minVolumePerMarket: number;
  let minVolumeReason: string;
  if (tradesPerDay > 10) {
    minVolumePerMarket = Math.max(50000, avgTradeSize * 100);
    minVolumeReason = 'High trade frequency requires deep market volume';
  } else if (tradesPerDay > 5) {
    minVolumePerMarket = Math.max(25000, avgTradeSize * 50);
    minVolumeReason = 'Moderate frequency needs decent market depth';
  } else {
    minVolumePerMarket = Math.max(10000, avgTradeSize * 20);
    minVolumeReason = 'Lower frequency allows smaller markets';
  }
  minVolumePerMarket = Math.round(minVolumePerMarket / 1000) * 1000;

  // Min liquidity per market - based on trade size vs slippage tolerance
  let minLiquidityPerMarket: number;
  let minLiquidityReason: string;
  if (avgTradeSize > 1000) {
    minLiquidityPerMarket = Math.max(10000, avgTradeSize * 10);
    minLiquidityReason = 'Large trade sizes need high liquidity to avoid slippage';
  } else if (avgTradeSize > 500) {
    minLiquidityPerMarket = Math.max(5000, avgTradeSize * 8);
    minLiquidityReason = 'Medium trades need moderate liquidity buffer';
  } else {
    minLiquidityPerMarket = Math.max(2000, avgTradeSize * 5);
    minLiquidityReason = 'Smaller trades can handle lower liquidity';
  }
  minLiquidityPerMarket = Math.round(minLiquidityPerMarket / 500) * 500;

  // Market price range - based on trader risk profile
  let priceMin: number;
  let priceMax: number;
  let priceRangeReason: string;
  switch (classification) {
    case 'Conservative':
      priceMin = 25;
      priceMax = 75;
      priceRangeReason = 'Avoids extreme outcomes for lower variance';
      break;
    case 'Aggressive':
      priceMin = 5;
      priceMax = 95;
      priceRangeReason = 'Allows high-risk/high-reward positions';
      break;
    case 'Moderate':
    default:
      priceMin = 15;
      priceMax = 85;
      priceRangeReason = 'Balanced range avoiding extreme tails';
      break;
  }

  // Max slippage per market (in cents) - based on trade frequency (TradeFox field)
  let maxSlippageCents: number;
  let slippageReason: string;
  if (tradesPerDay > 10) {
    maxSlippageCents = 1;
    slippageReason = 'Tight slippage (1¢) for frequent trading';
  } else if (tradesPerDay > 5) {
    maxSlippageCents = 2;
    slippageReason = 'Moderate slippage (2¢) tolerance';
  } else {
    maxSlippageCents = 3;
    slippageReason = 'Can accept more slippage (3¢) for infrequent trades';
  }

  // Max time until resolution - based on trader's holding patterns
  // Estimate from positions data or use defaults
  let maxTimeResolution: number;
  let timeReason: string;
  const avgPositionDuration = trader && trader.closedPositions > 0 
    ? Math.min(90, Math.max(7, trader.closedPositions / Math.max(1, trader.totalTrades / 30)))
    : 30;
  
  if (classification === 'Conservative') {
    maxTimeResolution = Math.min(60, avgPositionDuration * 1.5);
    timeReason = 'Shorter horizons reduce uncertainty';
  } else if (classification === 'Aggressive') {
    maxTimeResolution = Math.min(180, avgPositionDuration * 3);
    timeReason = 'Longer horizons for larger potential moves';
  } else {
    maxTimeResolution = Math.min(90, avgPositionDuration * 2);
    timeReason = 'Balanced time horizon';
  }
  maxTimeResolution = Math.round(maxTimeResolution);

  // High-frequency overrides
  if (isHighFrequency) {
    maxTimeResolution = 14;
    timeReason = 'Capped to 14 days for high-frequency trader';
    maxSlippageCents = 2;
    slippageReason = 'Tighter slippage control (2¢) for high-frequency trading';
    minMarket = Math.max(25, minMarket);
  }

  return {
    maxMarket,
    maxMarketReason: `Caps exposure to ${Math.round((maxMarket / allocation) * 100)}% per market based on ${classification.toLowerCase()} profile`,
    minMarket,
    minMarketReason: minMarket >= 25 ? 'Avoids dust trades where fees exceed potential profit' : 'Set to minimum viable trade size',
    maxCopyPerTrade,
    maxCopyPerTradeReason: `Limits single execution to control risk from volatile moves`,
    minVolumePerMarket,
    minVolumePerMarketReason: minVolumeReason,
    minLiquidityPerMarket,
    minLiquidityPerMarketReason: minLiquidityReason,
    marketPriceRangeMin: priceMin,
    marketPriceRangeMax: priceMax,
    marketPriceRangeReason: priceRangeReason,
    maxSlippageCents,
    maxSlippageReason: slippageReason,
    maxTimeUntilResolution: maxTimeResolution,
    maxTimeUntilResolutionReason: timeReason,
    traderClassification: classification,
    isHighFrequency,
  };
};

// Calculate Copy Suitability - detects execution-dependent strategies
interface CopySuitability {
  rating: 'High' | 'Medium' | 'Low';
  flags: string[];
  executionDependent: boolean;
  tradesPerDay: number;
  tradesPerPosition: number;
  avgTradeSizeUsd: number;
}

const calculateCopySuitability = (trader: TraderData): CopySuitability => {
  const flags: string[] = [];

  // Debug logging for copy suitability calculation
  const debugTraders = ['0x7a0da16a1205ee51a56fa862e8baa61e350eff14', '0x0f8a7eb19e45234bb81134d1f2af474b69fbfd8d'];
  const shouldDebug = debugTraders.includes(trader.address);

  // Calculate metrics - filter out invalid timestamps (timestamp 0 or before year 2001)
  const history = trader.pnlHistory || [];
  const validHistory = history.filter(h => h.timestamp > 1000000000000);

  // Calculate trades per day based on recent activity (last 90 days) for more accurate assessment
  const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
  const recentHistory = validHistory.filter(h => h.timestamp > ninetyDaysAgo);
  const recentTradingDays = Math.max(1, (Date.now() - ninetyDaysAgo) / (24 * 60 * 60 * 1000));
  // Estimate trades per day from recent activity, but if no recent history, fall back to overall average
  const recentTradesPerDay = recentHistory.length > 0
    ? (recentHistory.length / recentTradingDays)
    : (trader.totalTrades / Math.max(1, (Date.now() - (validHistory.length > 0 ? validHistory[0].timestamp : Date.now() - (30 * 24 * 60 * 60 * 1000))) / (24 * 60 * 60 * 1000)));
  const tradesPerDay = recentTradesPerDay;

  // Calculate total trading days for history assessment
  const firstTrade = validHistory.length > 0
    ? validHistory[0].timestamp
    : Date.now() - (30 * 24 * 60 * 60 * 1000);
  const tradingDays = Math.max(1, (Date.now() - firstTrade) / (24 * 60 * 60 * 1000));

  const totalPositions = Math.max(1, trader.closedPositions + trader.positions);
  const tradesPerPosition = trader.totalTrades / totalPositions;

  const avgTradeSizeUsd = trader.volume / Math.max(1, trader.totalTrades);

  // Thresholds (lowered for more realistic detection)
  const HIGH_FREQUENCY_THRESHOLD = 25; // trades per day
  const HIGH_CHURN_THRESHOLD = 2.0; // trades per position
  const MICRO_TRADE_SIZE = 500; // USD
  const MICRO_TRADE_FREQ = 15; // trades per day
  const LOW_WIN_RATE = 48; // %
  const SHORT_HISTORY_DAYS = 30; // Increased from 14 for more conservative assessment

  // Rule 1: High trade frequency (active trader/market maker behavior)
  if (tradesPerDay > HIGH_FREQUENCY_THRESHOLD) {
    flags.push('High trade frequency (>25/day)');
  }

  // Rule 2: High churn - many trades per position (constant adjustments)
  if (tradesPerPosition > HIGH_CHURN_THRESHOLD) {
    flags.push('High position churn (frequent adjustments)');
  }

  // Rule 3: Micro-trade pattern - small trades + moderate frequency
  if (avgTradeSizeUsd < MICRO_TRADE_SIZE && tradesPerDay > MICRO_TRADE_FREQ) {
    flags.push('Small trade sizes with high frequency');
  }

  // Rule 4: Low win rate - risky to copy
  if (trader.winRate < LOW_WIN_RATE) {
    flags.push('Below break-even win rate');
  }

  // Rule 5: Short trading history - insufficient data
  if (tradingDays < SHORT_HISTORY_DAYS || trader.closedPositions < 50) {
    flags.push('Limited trading history');
  }
  
  // Rule 6: Negative PnL - losing trader
  if (trader.pnl < 0) {
    flags.push('Negative overall PnL');
  }
  
  // Rule 7: High volume but low profit margin (execution-dependent)
  const profitMargin = trader.volume > 0 ? (trader.pnl / trader.volume) * 100 : 0;
  if (trader.volume > 100000 && profitMargin < 1 && profitMargin >= 0) {
    flags.push('Low profit margin on high volume');
  }
  
  // Classification - more nuanced
  let rating: 'High' | 'Medium' | 'Low';
  let executionDependent: boolean;
  
  // Critical flags that automatically lower rating to Low
  const criticalFlags = [
    'Negative overall PnL',
    'Below break-even win rate',
    'Limited trading history'
  ];
  const hasCriticalFlag = flags.some(f => criticalFlags.includes(f));
  
  if (flags.length >= 3 || (flags.length >= 2 && hasCriticalFlag)) {
    rating = 'Low';
    executionDependent = true;
  } else if (flags.length >= 1) {
    rating = 'Medium';
    executionDependent = flags.some(f => 
      f.includes('frequency') || f.includes('churn') || f.includes('Small trade')
    );
  } else {
    rating = 'High';
    executionDependent = false;
  }

  // Debug logging for copy suitability result
  if (shouldDebug) {
    console.log('🔍 Copy Suitability Result for trader:', trader.address, {
      rating,
      flags,
      executionDependent,
      tradesPerDay: Math.round(tradesPerDay * 10) / 10,
      tradesPerPosition: Math.round(tradesPerPosition * 10) / 10,
      avgTradeSizeUsd: Math.round(avgTradeSizeUsd)
    });
  }

  return {
    rating,
    flags,
    executionDependent,
    tradesPerDay: Math.round(tradesPerDay * 10) / 10,
    tradesPerPosition: Math.round(tradesPerPosition * 10) / 10,
    avgTradeSizeUsd: Math.round(avgTradeSizeUsd)
  };
};

// Calculate fee impact based on TradeFox fee structure
interface CopyStrategy {
  tradeSize: number;
  copyPercentage: number;
  expectedMonthlyReturn: number;
  maxDrawdown: number;
  reasoning: string[];
}

const calculateFeeImpact = (
  trader: TraderData,
  copyStrategy: CopyStrategy,
  allocatedFunds: number,
  copySuitability: CopySuitability
): FeeImpact => {
  // TradeFox fee constants for lowest tier (Cub)
  const NET_FEE_RATE = 0.0095; // 0.95%
  const CASHBACK_RATE = 0.05;  // 5%
  const EFFECTIVE_FEE = NET_FEE_RATE * (1 - CASHBACK_RATE); // ~0.90%
  
  // Use actual trades30d from trader data if available, otherwise estimate consistently
  let tradesPerMonth: number;
  if (trader.trades30d) {
    tradesPerMonth = trader.trades30d;
  } else {
    // Calculate based on same logic as copySuitability (recent 90-day activity)
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    const history = trader.pnlHistory || [];
    const recentHistory = history.filter(h => h.timestamp > 1000000000000 && h.timestamp > ninetyDaysAgo);
    const recentTradingDays = Math.max(1, (Date.now() - ninetyDaysAgo) / (24 * 60 * 60 * 1000));
    const recentTradesPerDay = recentHistory.length > 0
      ? (recentHistory.length / recentTradingDays)
      : (trader.totalTrades / Math.max(1, (Date.now() - (history.length > 0 ? history[0].timestamp : Date.now() - (30 * 24 * 60 * 60 * 1000))) / (24 * 60 * 60 * 1000)));
    tradesPerMonth = Math.round(recentTradesPerDay * 30);
  }
  
  // Average trade size in $ based on allocated funds and trade size %
  const avgTradeUsd = allocatedFunds * (copyStrategy.tradeSize / 100);
  
  // Total monthly fees estimate
  const monthlyFees = tradesPerMonth * avgTradeUsd * EFFECTIVE_FEE;
  
  // Compare fees to expected return
  const expectedReturnUsd = (allocatedFunds * copyStrategy.expectedMonthlyReturn) / 100;
  const feesAsPercentOfReturn = expectedReturnUsd > 0 
    ? (monthlyFees / expectedReturnUsd) * 100 
    : 100;
  
  // Calculate net expected return range after fees
  const grossReturnPct = copyStrategy.expectedMonthlyReturn;
  const feesPct = (monthlyFees / allocatedFunds) * 100;
  
  // Pessimistic: assume 60% of expected return + full fees
  const netReturnLow = Math.max(-10, (grossReturnPct * 0.6) - feesPct);
  // Optimistic: assume full expected return - fees
  const netReturnHigh = grossReturnPct - feesPct;
  
  // Build reasons and recommendations
  const reasons: string[] = [];
  const recommendations: string[] = [];
  let level: 'Low' | 'Medium' | 'High';
  
  // Classify fee impact
  if (feesAsPercentOfReturn > 50 || tradesPerMonth > 300) {
    level = 'High';
    reasons.push(`Est. ${Math.round(tradesPerMonth)} trades/month`);
    if (avgTradeUsd < 50) reasons.push(`Small avg trade size ($${avgTradeUsd.toFixed(0)})`);
    if (expectedReturnUsd > 0 && feesAsPercentOfReturn > 30) {
      reasons.push(`Fees may consume ~${Math.min(100, Math.round(feesAsPercentOfReturn))}% of returns`);
    }
    recommendations.push('Consider upgrading to a higher TradeFox tier for better cashback');
    recommendations.push('Consider larger allocation to reduce relative fee impact');
  } else if (feesAsPercentOfReturn > 20 || tradesPerMonth > 100) {
    level = 'Medium';
    reasons.push(`Est. ${Math.round(tradesPerMonth)} trades/month`);
    if (avgTradeUsd < 100) reasons.push('Moderate trade sizes may increase fee impact');
    recommendations.push('Higher tier or larger positions may improve net returns');
  } else {
    level = 'Low';
    reasons.push('Reasonable trade frequency');
    reasons.push('Position sizes efficient for fee structure');
  }
  
  return {
    level,
    estimatedMonthlyTradeCount: Math.round(tradesPerMonth),
    estimatedMonthlyFees: Math.round(monthlyFees * 100) / 100,
    estimatedFeePercentage: Math.round(feesAsPercentOfReturn),
    netReturnLow: Math.round(netReturnLow * 10) / 10,
    netReturnHigh: Math.round(netReturnHigh * 10) / 10,
    reasons,
    recommendations,
    assumedTier: 'Cub (lowest tier)'
  };
};

export default function AnalyzeTrader() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlAddress = searchParams.get('address') || '';
  const [inputAddress, setInputAddress] = useState(urlAddress);
  const [analyzedAddress, setAnalyzedAddress] = useState(urlAddress);
  const [chartTimeFilter, setChartTimeFilter] = useState<ChartTimeFilter>('ALL');
  const [allocatedFunds, setAllocatedFunds] = useState(1000);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [advancedModalOpen, setAdvancedModalOpen] = useState(false);

  const analysis = useTraderAnalysis(analyzedAddress);
  const trader = analysis.trader as TraderData | null;
  const error = analysis.error ? (analysis.error.message || String(analysis.error)) : null;
  const isInitialLoading = Boolean(analyzedAddress) && analysis.isLoadingAny && !analysis.hasAnyData;
  const isAnalyzing = Boolean(analyzedAddress) && analysis.isFetchingAny;
  const showErrorState = Boolean(error) && !analysis.hasAnyData;
  const openPositionsReady = analysis.stages.openPositions.isSuccess || analysis.stages.full.isSuccess;
  const recentTradesReady = analysis.stages.recentTrades.isSuccess || analysis.stages.full.isSuccess;
  const fastStagesDone =
    analysis.stages.profile.isSuccess &&
    analysis.stages.openPositions.isSuccess &&
    analysis.stages.recentTrades.isSuccess &&
    analysis.stages.closedPositionsSummary.isSuccess;
  const isFinalizingFull = fastStagesDone && analysis.stages.full.isFetching && !analysis.stages.full.isSuccess;
  const finalMetricsReady = analysis.stages.full.isSuccess;
  const fastStagesComplete =
    analysis.stages.profile.isSuccess &&
    analysis.stages.openPositions.isSuccess &&
    analysis.stages.recentTrades.isSuccess &&
    analysis.stages.closedPositionsSummary.isSuccess;
  const isFinalizingFullHistory = Boolean(analyzedAddress) && fastStagesComplete && analysis.stages.full.isFetching && !analysis.stages.full.isSuccess;

  const refetchAllStages = () => {
    analysis.stages.profile.refetch();
    analysis.stages.openPositions.refetch();
    analysis.stages.recentTrades.refetch();
    analysis.stages.closedPositionsSummary.refetch();
  };
  
  const { user } = useAuth();
  const { isWatching, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const { toast } = useToast();
  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText('https://thetradefox.com?ref=POLYTRAK');
    toast({ title: 'Link copied to clipboard!' });
  };

  // Watch for URL query param changes and trigger re-analysis
  useEffect(() => {
    if (urlAddress && urlAddress !== analyzedAddress) {
      setInputAddress(urlAddress);
      setAnalyzedAddress(urlAddress);
    }
  }, [urlAddress]);

  const chartData = useMemo(() => 
    trader ? generatePnlChartData(trader, chartTimeFilter) : [],
    [trader, chartTimeFilter]
  );

  const smartScore = useMemo(() => trader ? calculateSmartScore(trader) : 0, [trader]);
  const sharpeRatio = useMemo(() => trader ? calculateSharpeRatio(trader) : 0, [trader]);
  const profitFactorResult = useMemo(() => trader ? calculateProfitFactor(trader) : { value: 0, display: 'N/A', grossProfits: 0, grossLosses: 0 }, [trader]);
  const smartScoreInfo = getSmartScoreInfo(smartScore);
  const copySuitability = useMemo(() => trader ? calculateCopySuitability(trader) : null, [trader]);
  
  // Build TraderStyleSignals from trader data for useAutoCopySettings hook
  const traderStyleSignals = useMemo<TraderStyleSignals | null>(() => {
    if (!trader || !copySuitability) return null;
    
    // Calculate trades per week from tradesPerDay
    const tradeFrequency = copySuitability.tradesPerDay * 7;
    
    // Detect if trader uses partial exits by looking at trades per position
    const usesPartialExits = copySuitability.tradesPerPosition > 2;
    
    // Estimate average hold time (in hours) based on trade frequency
    // Higher frequency = shorter hold time
    const avgHoldTime = tradeFrequency > 30 ? 12 : tradeFrequency > 15 ? 48 : tradeFrequency > 5 ? 168 : 336;
    
    return {
      avgHoldTime,
      usesPartialExits,
      avgLiquidity: copySuitability.avgTradeSizeUsd * 10, // Rough estimate
      winRate: trader.winRate,
      profitFactor: profitFactorResult.value,
      sharpeRatio: sharpeRatio,
      avgTradeSize: copySuitability.avgTradeSizeUsd,
      tradeFrequency,
    };
  }, [trader, copySuitability, profitFactorResult, sharpeRatio]);
  
  // Use the unified auto copy settings hook - THIS IS THE SINGLE SOURCE OF TRUTH
  const autoCopySettings = useAutoCopySettings(traderStyleSignals, allocatedFunds);
  const autoSettings = autoCopySettings.settings;
  const settingsReasons = autoCopySettings.reasons;
  
  // Legacy copyStrategy for backwards compatibility with UI (expected return, drawdown, etc.)
  const copyStrategy = useMemo(() => 
    trader ? calculateOptimalStrategy(trader, allocatedFunds, copySuitability || undefined) : null,
    [trader, allocatedFunds, copySuitability]
  );
  
  const riskRegime = useMemo(() => trader ? calculateRiskRegime(trader) : null, [trader]);
  const marketFocus = useMemo(() => trader ? calculateMarketFocus(trader) : null, [trader]);
  
  // Derive advancedSettings from autoSettings for backward compatibility with UI
  const advancedSettings = useMemo(() => {
    if (!autoSettings) return null;
    const isHighFrequency = traderStyleSignals?.tradeFrequency ? traderStyleSignals.tradeFrequency >= 20 : false;
    return {
      maxMarket: autoSettings.maxAmountPerMarket,
      maxMarketReason: 'Auto-configured based on trader analysis',
      minMarket: autoSettings.minAmountPerMarket,
      minMarketReason: 'Auto-configured based on trader analysis',
      maxCopyPerTrade: autoSettings.maxCopyAmountPerTrade,
      maxCopyPerTradeReason: settingsReasons.find(r => r.field === 'maxCopyAmountPerTrade')?.reason || 'Default setting',
      minVolumePerMarket: autoSettings.minVolumePerMarket,
      minVolumePerMarketReason: 'Auto-configured based on trader analysis',
      minLiquidityPerMarket: autoSettings.minLiquidityPerMarket,
      minLiquidityPerMarketReason: settingsReasons.find(r => r.field === 'minLiquidityPerMarket')?.reason || 'Minimum $5k liquidity for safe execution',
      marketPriceRangeMin: autoSettings.marketPriceRangeMin,
      marketPriceRangeMax: autoSettings.marketPriceRangeMax,
      marketPriceRangeReason: settingsReasons.find(r => r.field === 'marketPriceRangeMin')?.reason || 'Risk-adjusted price range (25-75%)',
      maxSlippageCents: autoSettings.maxSlippageCents,
      maxSlippageReason: settingsReasons.find(r => r.field === 'maxSlippageCents')?.reason || `Max slippage capped at ${autoSettings.maxSlippageCents}¢ per market`,
      maxTimeUntilResolution: typeof autoSettings.maxTimeUntilResolution === 'number' ? autoSettings.maxTimeUntilResolution : 90,
      maxTimeUntilResolutionReason: settingsReasons.find(r => r.field === 'maxTimeUntilResolution')?.reason || 'Default resolution window',
      traderClassification: (copyStrategy?.riskLevel || 'Moderate') as 'Conservative' | 'Moderate' | 'Aggressive',
      isHighFrequency,
    };
  }, [autoSettings, settingsReasons, traderStyleSignals, copyStrategy]);
  
  const feeImpact = useMemo(() => 
    trader && copyStrategy && copySuitability 
      ? calculateFeeImpact(trader, copyStrategy, allocatedFunds, copySuitability) 
      : null,
    [trader, copyStrategy, allocatedFunds, copySuitability]
  );

  // Adjust Copy Suitability based on Fee Impact (two-pass approach)
  const adjustedCopySuitability = useMemo(() => {
    if (!copySuitability || !feeImpact) return copySuitability;

    // Adjust based on fee impact level and trading frequency
    const isHighFrequency = copySuitability.tradesPerDay > 15;
    const shouldDowngrade = feeImpact.level === 'High' ||
                           (feeImpact.level === 'Medium' && isHighFrequency);

    if (shouldDowngrade) {
      const newFlags = [...copySuitability.flags];
      const feeMessage = feeImpact.level === 'High'
        ? 'High fee impact may significantly affect returns'
        : 'Moderate fee impact may reduce returns for high-frequency trading';
      newFlags.push(feeMessage);

      // Downgrade rating if currently High, or from Medium to Low for very high frequency
      let newRating = copySuitability.rating;
      if (copySuitability.rating === 'High') {
        newRating = 'Medium';
      } else if (copySuitability.rating === 'Medium' && feeImpact.level === 'High') {
        newRating = 'Low';
      }

      return {
        ...copySuitability,
        flags: newFlags,
        rating: newRating
      };
    }
    
    return copySuitability;
  }, [copySuitability, feeImpact]);

  // Save to recent searches (localStorage) and public analyses (DB) when FINAL (full history) completes
  const savedAddressRef = useRef<string | null>(null);
  useEffect(() => {
    const analysisComplete = analysis.stages.full.isSuccess;

    if (
      trader && 
      adjustedCopySuitability && 
      analysisComplete &&
      savedAddressRef.current !== trader.address
    ) {
      savedAddressRef.current = trader.address;
      
      // Save to localStorage (personal recent searches)
      saveRecentSearch({
        address: trader.address,
        smartScore,
        sharpeRatio,
        copySuitability: adjustedCopySuitability.rating,
        totalPnl: trader.pnl,
        winRate: trader.winRate,
        volume: trader.volume
      });
      
      // Save to public DB (global recent analyses)
      savePublicAnalysis({
        address: trader.address,
        username: trader.username,
        profileImage: trader.profileImage,
        smartScore,
        sharpeRatio,
        copySuitability: adjustedCopySuitability.rating
      });
    }
  }, [
    trader,
    smartScore,
    sharpeRatio,
    adjustedCopySuitability,
    analysis.stages.full.isSuccess,
  ]);

  const watching = trader ? isWatching(trader.address) : false;

  // Validate Ethereum address format (0x + 40 hex characters)
  const isValidEthereumAddress = (addr: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/i.test(addr);
  };

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputAddress.trim();
    
    if (!trimmed) {
      toast({ 
        title: "Error", 
        description: "Please enter a trader address",
        variant: "destructive"
      });
      return;
    }
    
    if (!isValidEthereumAddress(trimmed)) {
      toast({ 
        title: "Invalid Address", 
        description: "Please enter a valid Ethereum address (0x + 40 hex characters)",
        variant: "destructive" 
      });
      return;
    }
    
    setAnalyzedAddress(trimmed);
    setSearchParams({ address: trimmed });
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
      <SEOHead
        title="Analyze Polymarket Traders | Wallet Performance & Copy Trading Settings – PolyTrak"
        description="Paste any Polymarket wallet address to analyze performance, risk metrics, and AI-generated copy trading settings optimized for TradeFox."
        canonicalUrl="/analyze"
      />
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
              <Button type="submit" size="lg" className="h-12 px-6" disabled={isAnalyzing}>
                {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Analyze <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>

            {isFinalizingFullHistory && (
              <div className="mt-3 flex justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/30 border border-border/50 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Finalizing full history… Smart Score and returns may update.
                </div>
              </div>
            )}

            {trader && !analysis.stages.full.isSuccess && (
              <div className="mt-3 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => analysis.stages.full.refetch()}
                  disabled={analysis.stages.full.isFetching}
                >
                  {analysis.stages.full.isFetching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading full history…
                    </>
                  ) : (
                    <>Load full history (slower, more accurate)</>
                  )}
                </Button>
              </div>
            )}
            
            {/* Public Recent Analyses - below analyze button */}
            <PublicRecentAnalyses className="mt-6" />
          </div>
        </div>

        {/* Loading State */}
        {isInitialLoading && (
          <LoadingProgress
            stages={{
              profile: analysis.stages.profile.status,
              openPositions: analysis.stages.openPositions.status,
              closedPositionsSummary: analysis.stages.closedPositionsSummary.status,
              recentTrades: analysis.stages.recentTrades.status,
              ...(analysis.stages.full.isFetching || analysis.stages.full.isSuccess
                ? { full: analysis.stages.full.isSuccess ? "success" : "pending" }
                : {}),
            }}
          />
        )}

        {/* Error State */}
        {showErrorState && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/20 mb-4">
              <TrendingDown className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Failed to load trader data</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">{error}</p>
            <Button onClick={refetchAllStages}>
              Try Again
            </Button>
          </div>
        )}

        {/* Results Section */}
        {trader && (
          <>
            {isFinalizingFull && (
              <div className="mb-6 p-3 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Finalizing full history… some metrics (Smart Score, returns) may update.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => analysis.stages.full.refetch()}
                >
                  Retry
                </Button>
              </div>
            )}
            {/* High-Frequency Trader Warning Banner */}
            {(advancedSettings?.isHighFrequency || feeImpact?.level === 'High' || (feeImpact && feeImpact.netReturnLow < 0)) && (
              <div className="mb-6 p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-orange-300 font-medium">High-frequency trader detected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Copy performance may differ due to fees &amp; slippage. Consider a smaller allocation.
                  </p>
                </div>
              </div>
            )}
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {/* Avatar with tri-color ring */}
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <ThreeColorRing
                        smartScore={smartScore}
                        sharpeRatio={sharpeRatio}
                        copySuitability={adjustedCopySuitability?.rating || 'Low'}
                        size={56}
                        strokeWidth={4}
                      />
                      <div className="absolute inset-[6px]">
                        <Avatar className="w-full h-full border-2 border-background">
                          <AvatarImage src={trader.profileImage || undefined} alt={trader.username || 'Profile'} />
                          <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-primary/30 to-accent/30 text-primary">
                            {(trader.username || trader.address).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
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
                    {(() => {
                      const { isInactive, daysSinceActive } = getInactivityStatus(trader.lastActive);
                      if (isInactive) {
                        return (
                          <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Inactive {daysSinceActive > 0 ? `(${daysSinceActive}d)` : ''}
                          </Badge>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                      {trader.address}
                    </code>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyAddress}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>Verify on:</span>
                    <a 
                      href={`https://polymarket.com/profile/${trader.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary underline underline-offset-2"
                    >
                      Polymarket
                    </a>
                    <span className="text-border">•</span>
                    <a 
                      href={`https://hashdive.com/polymarket/${trader.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary underline underline-offset-2"
                    >
                      HashDive
                    </a>
                    <span className="text-border">•</span>
                    <a 
                      href={`https://polymarketanalytics.com/trader/${trader.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary underline underline-offset-2"
                    >
                      PolymarketAnalytics
                    </a>
                    <span className="text-border">•</span>
                    <a 
                      href={`https://polygonscan.com/address/${trader.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary underline underline-offset-2"
                    >
                      PolygonScan
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
                    href={`https://thetradefox.com?ref=POLYTRAK&copy=${trader.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="glow-primary">
                      Copy on TheTradeFox
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* Inactive Trader Warning Banner */}
            {(() => {
              const { isInactive, daysSinceActive } = getInactivityStatus(trader.lastActive);
              if (isInactive) {
                return (
                  <div className="mb-6 p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-orange-500">Inactive Trader</h4>
                      <p className="text-sm text-muted-foreground">
                        This trader hasn't made any trades in {daysSinceActive > 0 ? `${daysSinceActive} days` : 'a long time'}. 
                        Their past performance may not reflect current market conditions. Consider this before copy trading.
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Data Reliability Warning Banner */}
            {trader.dataReliability && trader.dataReliability.score !== 'high' && (
              <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-500">Data Accuracy Notice</h4>
                  <ul className="text-sm text-yellow-200/80 mt-1 space-y-1">
                    {trader.dataReliability.warnings.map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2">
                    PnL figures may differ from other sources. Consider cross-referencing with:
                  </p>
                  <div className="flex gap-3 mt-2">
                    <a 
                      href={`https://polymarketanalytics.com/traders/${trader.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      PolymarketAnalytics <ExternalLink className="h-3 w-3" />
                    </a>
                    <a 
                      href={`https://polymarket.com/profile/${trader.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      Polymarket <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Progressive loading stage visibility */}
            {(analysis.isFetchingAny || !analysis.stages.full.isSuccess) && (
              <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className={`h-4 w-4 ${analysis.isFetchingAny ? 'animate-spin' : ''}`} />
                    <p className="text-sm font-medium">Loading data</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analysis.stages.full.isSuccess ? 'Completed' : 'In progress…'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
                  {[
                    { label: 'Profile', status: analysis.stages.profile.status },
                    { label: 'Open positions', status: analysis.stages.openPositions.status },
                    { label: 'Closed summary', status: analysis.stages.closedPositionsSummary.status },
                    { label: 'Recent trades', status: analysis.stages.recentTrades.status },
                    { label: 'Full history', status: analysis.stages.full.status },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between px-3 py-2 rounded-md bg-background/40 border border-border/40">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className={
                        s.status === 'success'
                          ? 'text-green-400'
                          : s.status === 'error'
                          ? 'text-red-400'
                          : s.status === 'pending'
                          ? 'text-yellow-400'
                          : 'text-muted-foreground'
                      }>
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>

                {!analysis.stages.full.isSuccess && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Some metrics (Smart Score, Sharpe, Copy Suitability) are shown only after <strong>Full history</strong> to avoid provisional values.
                  </p>
                )}
              </div>
            )}

            {/* Smart Score, Sharpe Ratio & Copy Suitability */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                                A composite score (0-100) evaluating trader quality based on:
                              </p>
                              <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                                <li><strong>ROI</strong> - Profit relative to traded volume</li>
                                <li><strong>Win rate</strong> - % of winning positions</li>
                                <li><strong>Consistency</strong> - PnL volatility (history-based)</li>
                                <li><strong>Experience</strong> - Closed-position track record</li>
                                <li><strong>Profit bonus</strong> - Small bonus for strong absolute profits</li>
                              </ul>
                              <p className="text-xs text-muted-foreground pt-2 border-t">
                                Higher scores indicate more reliable, consistent traders.
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                      <div className="flex items-baseline gap-3">
                        {finalMetricsReady ? (
                          <>
                            <span className={`text-4xl font-bold font-mono ${smartScoreInfo.color}`}>
                              {smartScore}
                            </span>
                            <span className="text-muted-foreground">/100</span>
                            <Badge className={`${smartScoreInfo.bg} ${smartScoreInfo.color} border-0`}>
                              {smartScoreInfo.label}
                            </Badge>
                          </>
                        ) : (
                          <>
                            <span className="text-4xl font-bold font-mono text-muted-foreground">—</span>
                            <span className="text-muted-foreground">/100</span>
                            <Badge className="bg-muted text-muted-foreground border-0">Loading…</Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={`h-16 w-16 rounded-full ${finalMetricsReady ? smartScoreInfo.bg : 'bg-muted'} flex items-center justify-center`}>
                      <span className={`text-xl font-bold ${finalMetricsReady ? smartScoreInfo.color : 'text-muted-foreground'}`}>
                        {finalMetricsReady ? smartScore : '—'}
                      </span>
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
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                      <div className="flex items-baseline gap-3">
                        {finalMetricsReady ? (
                          <>
                            <span className={`text-4xl font-bold font-mono ${sharpeRatio >= 1 ? 'text-green-500' : sharpeRatio >= 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                              {sharpeRatio.toFixed(2)}
                            </span>
                            <Badge className={`${sharpeRatio >= 1 ? 'bg-green-500/20 text-green-500' : sharpeRatio >= 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'} border-0`}>
                              {sharpeRatio >= 2 ? 'Excellent' : sharpeRatio >= 1 ? 'Good' : sharpeRatio >= 0 ? 'Average' : 'Poor'}
                            </Badge>
                          </>
                        ) : (
                          <>
                            <span className="text-4xl font-bold font-mono text-muted-foreground">—</span>
                            <Badge className="bg-muted text-muted-foreground border-0">Loading…</Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Benchmark</div>
                      <div className="text-lg font-mono">&gt; 1.0</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Copy Suitability Card */}
              <Card className={`glass-card ${adjustedCopySuitability?.rating === 'Low' ? 'border-red-500/50' : adjustedCopySuitability?.rating === 'Medium' ? 'border-yellow-500/50' : 'border-green-500/50'}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Target className="h-5 w-5" />
                        <span className="text-sm font-medium">Copy Suitability</span>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                              <Info className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </Button>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold">What is Copy Suitability?</h4>
                              <p className="text-sm text-muted-foreground">
                                Measures how realistically this trader can be copied on TradeFox given execution constraints and fee impact.
                              </p>
                              <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                                <li><strong>High</strong> - Directional trades, suitable for copy trading</li>
                                <li><strong>Medium</strong> - Some execution-dependent patterns or fee concerns</li>
                                <li><strong>Low</strong> - Market-making, HFT patterns, or high fee impact</li>
                              </ul>
                              <p className="text-xs text-muted-foreground pt-2 border-t">
                                Copy trading works best for directional traders who hold positions long enough for followers to get similar fills.
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                      <div className="flex items-baseline gap-3">
                        {finalMetricsReady ? (
                          <>
                            <span className={`text-4xl font-bold font-mono ${
                              adjustedCopySuitability?.rating === 'High' ? 'text-green-500' : 
                              adjustedCopySuitability?.rating === 'Medium' ? 'text-yellow-500' : 'text-red-500'
                            }`}>
                              {adjustedCopySuitability?.rating || 'N/A'}
                            </span>
                            <Badge className={`${
                              adjustedCopySuitability?.rating === 'High' ? 'bg-green-500/20 text-green-500' : 
                              adjustedCopySuitability?.rating === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' : 
                              'bg-red-500/20 text-red-500'
                            } border-0`}>
                              {adjustedCopySuitability?.rating === 'High' ? 'Suitable' : 
                               adjustedCopySuitability?.rating === 'Medium' ? 'Caution' : 'Risky'}
                            </Badge>
                          </>
                        ) : (
                          <>
                            <span className="text-4xl font-bold font-mono text-muted-foreground">—</span>
                            <Badge className="bg-muted text-muted-foreground border-0">Loading…</Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={`h-16 w-16 rounded-full ${
                      finalMetricsReady
                        ? (adjustedCopySuitability?.rating === 'High' ? 'bg-green-500/20' : 
                          adjustedCopySuitability?.rating === 'Medium' ? 'bg-yellow-500/20' : 'bg-red-500/20')
                        : 'bg-muted'
                    } flex items-center justify-center`}>
                      {finalMetricsReady ? (
                        adjustedCopySuitability?.rating === 'High' ? (
                          <TrendingUp className="h-7 w-7 text-green-500" />
                        ) : adjustedCopySuitability?.rating === 'Medium' ? (
                          <AlertTriangle className="h-7 w-7 text-yellow-500" />
                        ) : (
                          <AlertTriangle className="h-7 w-7 text-red-500" />
                        )
                      ) : (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      )}
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
                              formatter={(value: number) => [`${value >= 0 ? '+' : ''}$${Math.round(value).toLocaleString()}`, 'PnL']}
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
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <button className="ml-auto">
                          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-64 z-50" side="top">
                        <p className="text-sm text-muted-foreground">
                          Based on win rate, consistency, volume, and trade history
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <p className="text-2xl font-bold font-mono">{trader.winRate.toFixed(1)}%</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Gauge className="h-4 w-4" />
                    <span className="text-sm">Profit Factor</span>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <button className="ml-auto">
                          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 z-50" side="top">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Profit Factor</p>
                          <p className="text-sm text-muted-foreground">
                            Ratio of gross profits to gross losses.
                            Calculated as total winning trade profits ÷ total losing trade losses.
                            Values above 1.0 indicate profitability.
                            Higher values suggest stronger downside efficiency.
                          </p>
                          <div className="text-xs space-y-1">
                            <p><strong>Interpretation:</strong></p>
                            <p>❌ &lt; 1.0: Unprofitable</p>
                            <p>⚠️ 1.0–1.3: Weak edge</p>
                            <p>🟡 1.3–1.7: Decent</p>
                            <p>🟢 1.7–2.0: Strong</p>
                            <p>🔥 &gt; 2.0: Elite</p>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-2xl font-bold font-mono ${profitFactorResult.display === 'Insufficient data' ? 'text-muted-foreground' : getProfitFactorColor(profitFactorResult.value)}`}>
                      {profitFactorResult.display}
                    </p>
                    {profitFactorResult.display !== 'Insufficient data' && profitFactorResult.display !== '>5.0' && (
                      <Badge variant="outline" className="text-xs">
                        {getProfitFactorBadge(profitFactorResult.value)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gross profits ÷ gross losses
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm">Trades/Month</span>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <button className="ml-auto">
                          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-64 z-50" side="top">
                        <p className="text-sm text-muted-foreground">
                          Trade executions (fills) in the last 30 days. This counts each buy/sell order.
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold font-mono">{(trader.trades30d || 0).toLocaleString()}</p>
                    {trader.dataReliability?.warnings?.some(w => w.includes('Partial trade history')) && (
                      <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Partial
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {trader.totalTrades.toLocaleString()} total
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Target className="h-4 w-4" />
                    <span className="text-sm">Markets/Month</span>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <button className="ml-auto">
                          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-64 z-50" side="top">
                        <p className="text-sm text-muted-foreground">
                          Unique markets entered in the last 30 days. Shows how diversified the trader's recent activity is.
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <p className="text-2xl font-bold font-mono">{(trader.positions30d || 0).toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-sm">Total Invested</span>
                  </div>
                  <p className="text-2xl font-bold font-mono">
                    ${trader.totalInvested >= 1000000 
                      ? (trader.totalInvested / 1000000).toFixed(2) + 'M' 
                      : trader.totalInvested >= 1000 
                        ? (trader.totalInvested / 1000).toFixed(1) + 'K'
                        : trader.totalInvested.toFixed(0)
                    }
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">ROV</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/30">
                      Beta
                    </Badge>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <button className="ml-auto">
                          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 z-50" side="top">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Return on Volume (ROV)</p>
                          <p className="text-sm text-muted-foreground">
                            ROV = profit per $ traded (buys + sells). Computed from trade fills.
                            High ROV indicates efficient strategies that better survive slippage and execution.
                          </p>
                          <div className="text-xs space-y-1">
                            <p><strong>Interpretation:</strong></p>
                            <p>🟢 ≥ 0.30%: High Efficiency</p>
                            <p>🟡 0.15–0.30%: Moderate Efficiency</p>
                            <p>🟠 &lt; 0.15%: Low Efficiency</p>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  {(() => {
                    const rovResult = calculateROV(trader);
                    return (
                      <>
                        <div className="flex items-center gap-2">
                          <p className={`text-2xl font-bold font-mono ${rovResult.color}`}>
                            {rovResult.display}
                          </p>
                          {rovResult.label !== 'Insufficient Data' && (
                            <Badge variant="outline" className="text-xs">
                              {rovResult.label}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            Volume: {rovResult.volumeDisplay}
                          </p>
                          {rovResult.warning && (
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <Info className="h-3 w-3 text-yellow-500 cursor-help" />
                              </HoverCardTrigger>
                              <HoverCardContent className="w-64 z-50" side="top">
                                <p className="text-xs text-muted-foreground">{rovResult.warning}</p>
                              </HoverCardContent>
                            </HoverCard>
                          )}
                        </div>
                      </>
                    );
                  })()}
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
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <p className="text-sm text-muted-foreground">Realized (Closed)</p>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button>
                            <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-72 z-50" side="top">
                          <p className="text-sm text-muted-foreground">
                            Realized PnL from closed/settled positions. This is the closest match to Polymarket/Hashdive “Total PnL” style figures.
                          </p>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                    <p className={`text-xl font-bold font-mono ${trader.realizedPnl >= 0 ? 'stat-profit' : 'stat-loss'}`}>
                      {formatPnl(trader.realizedPnl)}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <p className="text-sm text-muted-foreground">Realized (Open partial)</p>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button>
                            <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-72 z-50" side="top">
                          <p className="text-sm text-muted-foreground">
                            Profit/loss already realized via partial exits on still-open positions. We show this separately so “Realized (Closed)” stays comparable.
                          </p>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                    <p className={`text-xl font-bold font-mono ${((trader.realizedPnlOpenPartial || 0) >= 0) ? 'stat-profit' : 'stat-loss'}`}>
                      {formatPnl(trader.realizedPnlOpenPartial || 0)}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <p className="text-sm text-muted-foreground">Unrealized</p>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button>
                            <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-72 z-50" side="top">
                          <p className="text-sm text-muted-foreground">
                            Unrealized PnL represents profit/loss from open positions that haven't been closed yet. This value is subject to change based on market movements.
                          </p>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
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

            {/* Market Focus Breakdown */}
            {marketFocus && marketFocus.breakdown.length > 0 && (
              <Card className="glass-card mb-8 border-green-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-500" />
                    <span className="text-green-400">Market Focus Breakdown</span>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <button className="ml-auto">
                          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 z-50" side="top">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-green-400">How this affects your copy strategy:</p>
                          <p className="text-xs text-muted-foreground">
                            Strategy is optimized assuming {marketFocus.dominantCategory.toLowerCase()} markets dominance ({marketFocus.dominantPercent}%). 
                            Different market categories have varying liquidity, volatility, and resolution patterns that influence optimal position sizing.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Top Market Categories</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {marketFocus.breakdown.slice(0, 4).map((cat, i) => (
                      <div key={cat.name} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{cat.name}</span>
                            <span className="text-sm font-mono text-green-400">{cat.percent}%</span>
                          </div>
                          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                i === 0 ? 'bg-green-500' : 
                                i === 1 ? 'bg-green-500/70' : 
                                i === 2 ? 'bg-green-500/50' : 'bg-green-500/30'
                              }`}
                              style={{ width: `${cat.percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Strategy Link */}
                  <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-xs text-green-400">
                      <span className="font-semibold">Strategy optimized for:</span> {marketFocus.dominantCategory} markets dominance
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TradeFox Copy Trading Configuration */}
            <Card className="mb-8 border-2 border-orange-500/50 bg-gradient-to-br from-orange-500/10 via-background to-amber-500/10 shadow-lg shadow-orange-500/10">
              <CardHeader className="border-b border-orange-500/20 pb-4">
                <div className="flex flex-col items-center text-center gap-3">
                  <img src={tradefoxLogo} alt="TradeFox" className="h-auto w-48 object-contain" />
                  <CardTitle className="text-xl">
                    <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent font-bold">
                      AI-Optimized Copy Trading for TheTradeFox
                    </span>
                  </CardTitle>
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
                {/* Execution-Dependent Strategy Warning */}
                {adjustedCopySuitability?.executionDependent && (
                  <div className="p-4 rounded-lg bg-red-500/10 border-2 border-red-500/40">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="space-y-2">
                        <h4 className="font-semibold text-red-500 flex items-center gap-2">
                          Execution-Dependent Strategy Detected
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                                <Info className="h-4 w-4 text-red-400 hover:text-red-300" />
                              </Button>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                              <p className="text-xs text-muted-foreground">
                                Copy trading works best for directional traders who hold positions long enough for followers to get similar fills. This trader's strategy may rely on precise execution timing.
                              </p>
                            </HoverCardContent>
                          </HoverCard>
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          This trader's performance may rely on order execution tactics (fast limit orders, frequent updates, spread capture). TradeFox copy trading can't replicate timing and limit management, so results may differ.
                        </p>
                        <ul className="text-sm text-red-400 space-y-1">
                          {adjustedCopySuitability.flags.map((flag, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              {flag}
                            </li>
                          ))}
                        </ul>
                        <div className="pt-2 border-t border-red-500/20 mt-2">
                          <p className="text-xs text-muted-foreground">
                            <strong className="text-red-400">Recommendation:</strong> Not ideal for TradeFox copy trading. Consider copying longer-hold traders instead. Settings have been automatically reduced for safety.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Allocation Input - Centered and Bigger */}
                <div className="flex flex-col items-center justify-center py-4">
                  <label className="text-sm text-muted-foreground mb-3">
                    How much do you want to allocate to this trader?
                  </label>
                  {/* Preset Amount Buttons */}
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {[100, 250, 500, 1000, 2000, 5000, 10000].map((amount) => (
                      <Button
                        key={amount}
                        variant={allocatedFunds === amount ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAllocatedFunds(amount)}
                        className={allocatedFunds === amount 
                          ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500" 
                          : "border-orange-500/30 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50"
                        }
                      >
                        ${amount.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 p-6 rounded-xl bg-background/50 border-2 border-orange-500/40">
                    <span className="text-orange-400 font-mono text-4xl font-bold">$</span>
                    <input 
                      type="text"
                      inputMode="numeric"
                      value={allocatedFunds}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setAllocatedFunds(Number(val) || 0);
                      }}
                      className="w-36 text-center bg-transparent border-none font-mono text-4xl font-bold text-orange-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Copy Settings - Read-Only Auto-Calculated */}
                {copyStrategy && advancedSettings && (
                  <>
                    {/* Follow Exits Status Pill */}
                    <div className="flex items-center justify-center">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-4 py-1">
                        Follow Exits: ON
                      </Badge>
                    </div>

                    {/* Trader Classification */}
                    <div className="flex items-center justify-center">
                      <Badge className={
                        advancedSettings.traderClassification === 'Aggressive' 
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : advancedSettings.traderClassification === 'Conservative'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                      }>
                        {advancedSettings.traderClassification} Trader Profile
                      </Badge>
                    </div>

                    {/* Main % Settings - Read Only */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">% Size for each trade</span>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-orange-400 hover:bg-orange-500/20">
                                <Info className="h-4 w-4" />
                              </Button>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80 bg-background/95 backdrop-blur border-orange-500/30">
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-orange-400">Why this percentage?</h4>
                                <ul className="space-y-1">
                                  {copyStrategy.reasoning.filter(r => 
                                    r.includes('Kelly') || r.includes('per trade') || r.includes('bankroll')
                                  ).map((reason, i) => (
                                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                      <span className="text-orange-400">•</span>
                                      {reason}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                        <p className="text-3xl font-bold text-orange-400 font-mono">{copyStrategy.tradeSize}%</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          = ${((allocatedFunds * copyStrategy.tradeSize) / 100).toFixed(0)} max per trade
                        </p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">% of each trade to copy</span>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-orange-400 hover:bg-orange-500/20">
                                <Info className="h-4 w-4" />
                              </Button>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80 bg-background/95 backdrop-blur border-orange-500/30">
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-orange-400">Why this copy %?</h4>
                                <ul className="space-y-1">
                                  {copyStrategy.reasoning.filter(r => 
                                    r.includes('copy') || r.includes('trade') || r.includes('avg') || r.includes('position')
                                  ).map((reason, i) => (
                                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                      <span className="text-orange-400">•</span>
                                      {reason}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                        <p className="text-3xl font-bold text-orange-400 font-mono">{copyStrategy.copyPercentage}%</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          of trader's order size
                        </p>
                      </div>
                    </div>

                    {/* Advanced Copy Settings (Auto-Configured) */}
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Advanced Copy Settings (Auto-Configured)
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          PolyTrak automatically configures TradeFox's advanced copy-trading settings based on this trader's real behavior and your budget. This helps reduce slippage, avoid illiquid markets, and control risk without manual tuning.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Max amount per market */}
                        <div className="p-3 rounded-lg bg-background/50 space-y-1">
                          <span className="text-sm text-muted-foreground">Max amount per market</span>
                          <p className="text-xl font-bold text-amber-400 font-mono">
                            ${advancedSettings.maxMarket.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {advancedSettings.maxMarketReason}
                          </p>
                        </div>
                        
                        {/* Min amount per market */}
                        <div className="p-3 rounded-lg bg-background/50 space-y-1">
                          <span className="text-sm text-muted-foreground">Min amount per market</span>
                          <p className="text-xl font-bold text-amber-400 font-mono">
                            ${advancedSettings.minMarket.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {advancedSettings.minMarketReason}
                          </p>
                        </div>
                        
                        {/* Max copy amount per trade */}
                        <div className="p-3 rounded-lg bg-background/50 space-y-1">
                          <span className="text-sm text-muted-foreground">Max copy amount per trade</span>
                          <p className="text-xl font-bold text-amber-400 font-mono">
                            ${advancedSettings.maxCopyPerTrade.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {advancedSettings.maxCopyPerTradeReason}
                          </p>
                        </div>
                        
                        {/* Min volume per market */}
                        <div className="p-3 rounded-lg bg-background/50 space-y-1">
                          <span className="text-sm text-muted-foreground">Min volume per market</span>
                          <p className="text-xl font-bold text-amber-400 font-mono">
                            ${advancedSettings.minVolumePerMarket.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {advancedSettings.minVolumePerMarketReason}
                          </p>
                        </div>
                        
                        {/* Min liquidity per market */}
                        <div className="p-3 rounded-lg bg-background/50 space-y-1">
                          <span className="text-sm text-muted-foreground">Min liquidity per market</span>
                          <p className="text-xl font-bold text-amber-400 font-mono">
                            ${advancedSettings.minLiquidityPerMarket.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {advancedSettings.minLiquidityPerMarketReason}
                          </p>
                        </div>
                        
                        {/* Market price range */}
                        <div className="p-3 rounded-lg bg-background/50 space-y-1">
                          <span className="text-sm text-muted-foreground">Market price range</span>
                          <p className="text-xl font-bold text-amber-400 font-mono">
                            {advancedSettings.marketPriceRangeMin}¢ – {advancedSettings.marketPriceRangeMax}¢
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {advancedSettings.marketPriceRangeReason}
                          </p>
                        </div>
                        
                        {/* Max slippage per market */}
                        <div className="p-3 rounded-lg bg-background/50 space-y-1">
                          <span className="text-sm text-muted-foreground">Max slippage per market</span>
                          <p className="text-xl font-bold text-amber-400 font-mono">
                            {advancedSettings.maxSlippageCents}¢
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {advancedSettings.maxSlippageReason}
                          </p>
                        </div>
                        
                        {/* Max time until resolution */}
                        <div className="p-3 rounded-lg bg-background/50 space-y-1">
                          <span className="text-sm text-muted-foreground">Max time until resolution</span>
                          <p className="text-xl font-bold text-amber-400 font-mono">
                            {advancedSettings.maxTimeUntilResolution} days
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {advancedSettings.maxTimeUntilResolutionReason}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Expected Outcomes */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground">Est. Max Monthly Return</span>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <button>
                                <Info className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80 z-[100]" side="top">
                              <div className="space-y-2">
                                <p className="text-sm font-semibold">Maximum Potential Return</p>
                                <p className="text-xs text-muted-foreground">
                                  This is the <span className="font-semibold">best-case scenario</span> return based on the AI-recommended copy settings — not the trader's actual historical return.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-semibold">Assumes:</span>
                                </p>
                                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                                  <li>Same price execution as the trader</li>
                                  <li>No slippage or delays</li>
                                  <li>Similar market conditions continue</li>
                                  <li>All signals are caught and copied</li>
                                </ul>
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-semibold">Formula:</span> (Win Rate × Avg Win) − (Loss Rate × Avg Loss), 
                                  scaled by trade size ({copyStrategy.tradeSize}%) and copy % ({copyStrategy.copyPercentage}%).
                                </p>
                                <p className="text-xs text-yellow-400/80 font-medium">
                                  💡 Reality check: Most copy traders achieve 40-70% of the maximum estimate.
                                </p>
                                {copySuitability?.executionDependent && (
                                  <p className="text-xs text-yellow-400">
                                    ⚠️ Execution-dependent strategy detected — settings reduced by ~80% for safety.
                                  </p>
                                )}
                                {trader && trader.winRate < 0.52 && (
                                  <p className="text-xs text-orange-400">
                                    📉 Win rate near break-even ({(trader.winRate * 100).toFixed(1)}%) — expected gain per trade is low.
                                  </p>
                                )}
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                        {Number.isFinite(copyStrategy.expectedMonthlyReturn) ? (
                          <>
                            <p className={`text-2xl font-bold font-mono ${copyStrategy.expectedMonthlyReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {copyStrategy.expectedMonthlyReturn >= 0 ? '+' : ''}{copyStrategy.expectedMonthlyReturn}%
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ≈ ${((allocatedFunds * copyStrategy.expectedMonthlyReturn) / 100).toFixed(0)}/month
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-2xl font-bold font-mono text-muted-foreground">—</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Finalizing…
                            </p>
                          </>
                        )}
                      </div>
                      
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                        <span className="text-sm text-muted-foreground">Est. Max Drawdown</span>
                        <p className="text-2xl font-bold text-red-400 font-mono">-{copyStrategy.maxDrawdown}%</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ≈ -${((allocatedFunds * copyStrategy.maxDrawdown) / 100).toFixed(0)} worst case
                        </p>
                      </div>
                    </div>


                    {/* Full Strategy Reasoning - Always Visible */}
                    <div className="p-4 rounded-lg bg-background/30 border border-orange-500/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="h-4 w-4 text-orange-400" />
                        <span className="text-sm font-semibold text-orange-400">Strategy Analysis</span>
                      </div>
                      <ul className="space-y-1.5">
                        {copyStrategy.reasoning.map((reason, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-orange-400">•</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Risk Regime Detection Card */}
                    {riskRegime && (
                      <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                        <div className="flex items-center gap-2 mb-4">
                          <Gauge className="h-4 w-4 text-purple-400" />
                          <span className="text-sm font-semibold text-purple-400">Trader Risk Regime</span>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <button className="ml-auto">
                                <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-72 z-50" side="top">
                              <p className="text-sm text-muted-foreground">
                                Risk regime analysis explains why the AI chose specific settings. It's based on the trader's historical behavior patterns.
                              </p>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="p-3 rounded-lg bg-background/50">
                            <p className="text-xs text-muted-foreground mb-1">Risk Profile</p>
                            <p className={`text-lg font-bold ${
                              riskRegime.riskProfile === 'Conservative' ? 'text-green-400' :
                              riskRegime.riskProfile === 'Moderate' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {riskRegime.riskProfile}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{riskRegime.riskReasoning}</p>
                          </div>
                          
                          <div className="p-3 rounded-lg bg-background/50">
                            <p className="text-xs text-muted-foreground mb-1">Liquidity Sensitivity</p>
                            <p className={`text-lg font-bold ${
                              riskRegime.liquiditySensitivity === 'Low' ? 'text-green-400' :
                              riskRegime.liquiditySensitivity === 'Medium' ? 'text-yellow-400' : 'text-purple-400'
                            }`}>
                              {riskRegime.liquiditySensitivity}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{riskRegime.liquidityReasoning}</p>
                          </div>
                        </div>
                        
                        <div className="p-3 rounded-lg bg-background/50">
                          <p className="text-xs text-muted-foreground mb-2">Trader performs best in:</p>
                          <div className="flex flex-wrap gap-2">
                            {riskRegime.bestConditions.map((condition, i) => (
                              <Badge key={i} variant="outline" className="border-purple-500/50 text-purple-300 text-xs">
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Why AI Chose These Settings */}
                        {copyStrategy && (
                          <div className="p-3 rounded-lg bg-purple-500/20 border border-purple-500/40 mt-4">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="text-xs font-semibold text-purple-400">Why AI chose these settings:</p>
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <button>
                                    <Info className="h-3.5 w-3.5 text-purple-400 hover:text-purple-300 cursor-help transition-colors" />
                                  </button>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-72 z-50" side="top">
                                  <p className="text-sm text-muted-foreground">
                                    With ${allocatedFunds.toLocaleString()} allocation, ~{Math.round(Math.max(5, Math.min(25, 50000 / allocatedFunds)))}% of trades may be skipped due to minimum buy size requirements on TradeFox.
                                  </p>
                                </HoverCardContent>
                              </HoverCard>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-orange-400 font-mono">{copyStrategy.tradeSize}%</span>
                                <span className="text-xs text-muted-foreground">per trade</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-orange-400 font-mono">{copyStrategy.copyPercentage}%</span>
                                <span className="text-xs text-muted-foreground">copy size</span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Based on {riskRegime.riskProfile.toLowerCase()} risk profile and {riskRegime.liquiditySensitivity.toLowerCase()} liquidity needs
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fee Impact Analysis Card */}
                    {feeImpact && (
                      <div className={`p-4 rounded-lg border ${
                        feeImpact.level === 'High' 
                          ? 'bg-red-500/10 border-red-500/30' 
                          : feeImpact.level === 'Medium'
                          ? 'bg-yellow-500/10 border-yellow-500/30'
                          : 'bg-green-500/10 border-green-500/30'
                      }`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="h-4 w-4" />
                          <span className="text-sm font-semibold">Fee Impact (Est.)</span>
                          <Badge variant="outline" className={`ml-auto ${
                            feeImpact.level === 'High' ? 'border-red-500/50 text-red-400' :
                            feeImpact.level === 'Medium' ? 'border-yellow-500/50 text-yellow-400' :
                            'border-green-500/50 text-green-400'
                          }`}>
                            {feeImpact.level}
                          </Badge>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <button>
                                <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80 z-[100]" side="top">
                              <div className="space-y-2">
                                <p className="text-sm font-semibold">About TradeFox Fees</p>
                                <p className="text-xs text-muted-foreground">
                                  TradeFox applies a net trading fee (0.95% → 0.75%) and cashback (5% → 25%) 
                                  depending on your tier.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  This analysis assumes the <span className="font-semibold">{feeImpact.assumedTier}</span>. 
                                  Higher tiers or larger allocations can significantly reduce fee impact.
                                </p>
                                <p className="text-xs text-muted-foreground italic">
                                  Est. ~{feeImpact.estimatedMonthlyTradeCount} trades/month with this strategy.
                                </p>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                        
                        {/* Key Fee Metrics */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="p-3 rounded-lg bg-background/50">
                            <div className="flex items-center gap-1 mb-1">
                              <p className="text-xs text-muted-foreground">Est. Monthly Fees</p>
                              <Badge variant="outline" className="text-[10px] px-1 py-0 border-muted-foreground/30 text-muted-foreground">
                                Estimated
                              </Badge>
                            </div>
                            <p className={`text-lg font-bold font-mono ${
                              feeImpact.level === 'High' ? 'text-red-400' :
                              feeImpact.level === 'Medium' ? 'text-yellow-400' : 'text-foreground'
                            }`}>
                              ${feeImpact.estimatedMonthlyFees.toFixed(0)}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              ~{feeImpact.estimatedMonthlyTradeCount} trades × ${(allocatedFunds * (copyStrategy?.tradeSize || 5) / 100).toFixed(0)}/trade
                            </p>
                          </div>
                          
                          <div className="p-3 rounded-lg bg-background/50">
                            <div className="flex items-center gap-1 mb-1">
                              <p className="text-xs text-muted-foreground">Net Return Range</p>
                              <Badge variant="outline" className="text-[10px] px-1 py-0 border-muted-foreground/30 text-muted-foreground">
                                After Fees
                              </Badge>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <p className={`text-lg font-bold font-mono ${feeImpact.netReturnLow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {feeImpact.netReturnLow >= 0 ? '+' : ''}{feeImpact.netReturnLow}%
                              </p>
                              <span className="text-muted-foreground text-sm">to</span>
                              <p className={`text-lg font-bold font-mono ${feeImpact.netReturnHigh >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {feeImpact.netReturnHigh >= 0 ? '+' : ''}{feeImpact.netReturnHigh}%
                              </p>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              ≈ ${((allocatedFunds * feeImpact.netReturnLow) / 100).toFixed(0)} to ${((allocatedFunds * feeImpact.netReturnHigh) / 100).toFixed(0)}/month
                            </p>
                          </div>
                        </div>
                        
                        {/* Reasons */}
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground mb-1.5">Analysis:</p>
                          <ul className="space-y-1">
                            {feeImpact.reasons.map((reason, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className={
                                  feeImpact.level === 'High' ? 'text-red-400' : 
                                  feeImpact.level === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                                }>•</span>
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {/* Recommendations - only show if Medium or High */}
                        {feeImpact.level !== 'Low' && feeImpact.recommendations.length > 0 && (
                          <div className="p-3 rounded-lg bg-background/50">
                            <p className="text-xs font-semibold mb-1.5">Recommendations:</p>
                            <ul className="space-y-1">
                              {feeImpact.recommendations.map((rec, i) => (
                                <li key={i} className="text-xs text-muted-foreground">
                                  💡 {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground/60 mt-3 italic">
                          Based on {feeImpact.assumedTier}. Actual results vary by your TradeFox tier.
                        </p>
                      </div>
                    )}

                    {/* Follow Exits - Always Enabled */}
                    <div className="p-3 rounded-lg bg-background/30 border border-border/30">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={true}
                          readOnly
                          className="h-4 w-4 rounded border-green-500 text-green-500 focus:ring-green-500 accent-green-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">Follow Exits</p>
                            <Badge variant="outline" className="text-xs border-green-500/50 text-green-500">Always On</Badge>
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <button className="ml-auto">
                                  <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                                </button>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-72 z-50" side="top">
                                <p className="text-xs text-muted-foreground">
                                  Follow exits is always enabled for risk management. When the trader reduces or closes a position, you automatically sell the same percentage.
                                </p>
                              </HoverCardContent>
                            </HoverCard>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Copy on TradeFox Section */}
            <Card className="mb-8 border-border/50">
              <CardHeader>
                <CardTitle>Copy on TradeFox</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To copy this trader, you'll need a TradeFox account.
                  <br />
                  If you sign up using my referral link, it really helps support Polytrak.io and lets me keep building new features.
                </p>
                
                {/* Configure Copy Settings Button */}
                {copyStrategy && advancedSettings && (
                  <Button
                    onClick={() => setEditModalOpen(true)}
                    variant="outline"
                    className="w-full border-primary/50 text-primary hover:bg-primary/10"
                    size="lg"
                  >
                    <Settings2 className="h-4 w-4 mr-2" />
                    View Copy Settings
                  </Button>
                )}
                
                {/* Referral Link */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <code className="text-sm text-primary flex-1 break-all">
                    https://thetradefox.com?ref=POLYTRAK
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyReferralLink}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Primary CTA Button */}
                <Button
                  onClick={() => window.open('https://thetradefox.com?ref=POLYTRAK', '_blank')}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  size="lg"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Sign up on TradeFox (Referral Link)
                </Button>
                
                {/* Disclaimer */}
                <p className="text-xs text-muted-foreground/70 leading-relaxed">
                  Disclaimer: Polytrak.io is an independent analytics tool and is not affiliated with TradeFox.
                  Using my referral link is optional, but I'd really appreciate it — it helps support the project.
                  Polytrak.io does not execute trades and this is not financial advice.
                </p>
              </CardContent>
            </Card>

            {/* Tabs for Positions and Trade History */}
            <div className="mt-4">
              <Tabs defaultValue="positions">
              <TabsList className="mb-2">
                <TabsTrigger value="positions" className="text-xs px-3 py-1.5">Open Positions ({trader.openPositions.length})</TabsTrigger>
                <TabsTrigger value="history" className="text-xs px-3 py-1.5">Trade History ({trader.recentTrades.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="positions" className="mt-2">
                <Card className="glass-card">
                  <CardContent className="p-2">
                    {openPositionsReady ? (
                      trader.openPositions.length > 0 ? (
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
                            <TableRow key={position.id} className="h-8">
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
                      )
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        Loading open positions…
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-2">
                <Card className="glass-card">
                  <CardContent className="p-2">
                    {recentTradesReady ? (
                      trader.recentTrades.length > 0 ? (
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
                            <TableRow key={trade.id} className="h-8">
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
                      )
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        Loading recent trades…
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            </div>
          </>
        )}

        {/* Empty State */}
        {!trader && !isAnalyzing && !showErrorState && (
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

      {/* Copy Trading Modals */}
      {copyStrategy && advancedSettings && autoSettings && (
        <>
          <EditCopyTradingModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            settings={{
              allocatedFunds,
              tradeSizePercent: autoSettings.tradeSizePercent,
              copyPercentage: autoSettings.copyPercentage,
              exitMode: autoSettings.exitMode,
              availableBalance: allocatedFunds * 0.26, // Placeholder - shows ~26% available
              spentOnTrader: allocatedFunds * 0.74, // Placeholder - shows ~74% spent
            }}
            onSettingsChange={(updates) => {
              if (updates.allocatedFunds !== undefined) {
                setAllocatedFunds(updates.allocatedFunds);
              }
            }}
            onOpenAdvanced={() => {
              setEditModalOpen(false);
              setAdvancedModalOpen(true);
            }}
            onSave={() => {
              setEditModalOpen(false);
              toast({ title: 'Settings saved', description: 'Your copy trading settings have been updated.' });
            }}
            onStopCopy={() => {
              setEditModalOpen(false);
              toast({ title: 'Copy trading stopped', variant: 'destructive' });
            }}
            traderName={trader?.username || undefined}
          />

          <AdvancedSettingsModal
            open={advancedModalOpen}
            onOpenChange={setAdvancedModalOpen}
            settings={{
              maxAmountPerMarket: autoSettings.maxAmountPerMarket,
              minAmountPerMarket: autoSettings.minAmountPerMarket,
              maxCopyAmountPerTrade: autoSettings.maxCopyAmountPerTrade,
              minVolumePerMarket: autoSettings.minVolumePerMarket,
              minLiquidityPerMarket: autoSettings.minLiquidityPerMarket,
              marketPriceRangeMin: autoSettings.marketPriceRangeMin,
              marketPriceRangeMax: autoSettings.marketPriceRangeMax,
              maxSlippageCents: autoSettings.maxSlippageCents,
              maxTimeUntilResolution: typeof autoSettings.maxTimeUntilResolution === 'number' ? autoSettings.maxTimeUntilResolution : 90,
            }}
            onSettingsChange={() => {
              // Settings are read-only in PolyTrak
            }}
            onSave={() => {
              setAdvancedModalOpen(false);
              setEditModalOpen(true);
            }}
            onReset={() => {
              toast({ title: 'Settings reset to default' });
            }}
            onBack={() => {
              setAdvancedModalOpen(false);
              setEditModalOpen(true);
            }}
          />
        </>
      )}
    </Layout>
  );
}
