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
  BarChart3, PieChart, Calendar, Zap, Brain, Gauge, Loader2, Info,
  AlertTriangle
} from 'lucide-react';
import tradefoxLogo from '@/assets/tradefox-logo.png';
import { LoadingProgress } from '@/components/analyze/LoadingProgress';

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

// Calculate Smart Score - stricter algorithm based on real trading performance
const calculateSmartScore = (trader: TraderData) => {
  // ROI is the most important metric - profit relative to volume traded
  const roi = trader.volume > 0 ? (trader.pnl / trader.volume) * 100 : 0; // as percentage
  
  // ROI component (max 35 pts) - the primary performance indicator
  // 10% ROI = 20 pts, 20% ROI = 30 pts, 30%+ ROI = 35 pts
  // Negative ROI results in negative points
  let roiScore: number;
  if (roi <= 0) {
    roiScore = Math.max(-20, roi * 2); // Negative ROI penalizes heavily
  } else if (roi < 5) {
    roiScore = roi * 2; // 0-10 pts for 0-5% ROI
  } else if (roi < 15) {
    roiScore = 10 + (roi - 5) * 1.5; // 10-25 pts for 5-15% ROI
  } else {
    roiScore = Math.min(35, 25 + (roi - 15) * 0.5); // 25-35 pts for 15%+ ROI
  }
  
  // Win rate component (max 25 pts) - only rewards above 55%
  // 50% = 0 pts, 55% = 5 pts, 60% = 12 pts, 70% = 20 pts, 80%+ = 25 pts
  const winRate = trader.winRate;
  let winRateScore: number;
  if (winRate < 50) {
    winRateScore = Math.max(-10, (winRate - 50) * 0.5); // Penalty for <50%
  } else if (winRate < 55) {
    winRateScore = (winRate - 50) * 1; // 0-5 pts
  } else if (winRate < 65) {
    winRateScore = 5 + (winRate - 55) * 1.5; // 5-20 pts
  } else {
    winRateScore = Math.min(25, 20 + (winRate - 65) * 0.5); // 20-25 pts
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
  maxDrawdown: number; // Expected max drawdown %
  expectedMonthlyReturn: number; // Expected monthly return %
}

const calculateOptimalStrategy = (trader: TraderData, allocatedFunds: number, copySuitability?: CopySuitability): CopyStrategy => {
  const reasoning: string[] = [];
  
  // Core trader metrics
  const winRate = trader.winRate / 100; // Convert to decimal
  const totalTrades = Math.max(trader.totalTrades, 1);
  const avgTradeSize = trader.volume / totalTrades;
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
  const expectedTradeReturn = (expectedWinPct - expectedLossPct) / avgTradeSize;
  
  // Reuse validHistory from earlier or filter for timestamp calculation
  const firstValidTimestamp = validHistory.length > 0 
    ? validHistory[0].timestamp 
    : Date.now() - (30 * 24 * 60 * 60 * 1000);
  const tradesPerMonth = Math.min(totalTrades / Math.max(1, (Date.now() - firstValidTimestamp) / (30 * 24 * 60 * 60 * 1000)), 30);
  const expectedMonthlyReturn = expectedTradeReturn * (copyPercentage / 100) * (tradeSize / 100) * tradesPerMonth * 100;
  
  // Max drawdown estimation (simplified)
  const maxConsecutiveLosses = Math.ceil(Math.log(0.01) / Math.log(1 - winRate)); // 99% confidence
  const maxDrawdown = Math.min(50, maxConsecutiveLosses * tradeSize * (avgLoss / avgTradeSize));
  
  return {
    tradeSize: Math.round(Math.max(1, Math.min(20, tradeSize))),
    copyPercentage: Math.round(Math.max(1, Math.min(100, copyPercentage))),
    followExits,
    riskLevel,
    reasoning,
    maxDrawdown: Math.round(maxDrawdown),
    expectedMonthlyReturn: Math.round(expectedMonthlyReturn * 10) / 10
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
  
  // Calculate metrics - filter out invalid timestamps (timestamp 0 or before year 2001)
  const history = trader.pnlHistory || [];
  const validHistory = history.filter(h => h.timestamp > 1000000000000);
  const firstTrade = validHistory.length > 0 
    ? validHistory[0].timestamp 
    : Date.now() - (30 * 24 * 60 * 60 * 1000);
  const tradingDays = Math.max(1, (Date.now() - firstTrade) / (24 * 60 * 60 * 1000));
  const tradesPerDay = trader.totalTrades / tradingDays;
  
  const totalPositions = Math.max(1, trader.closedPositions + trader.positions);
  const tradesPerPosition = trader.totalTrades / totalPositions;
  
  const avgTradeSizeUsd = trader.volume / Math.max(1, trader.totalTrades);
  
  // Rule 1: Very high trade frequency (>150 trades/day indicates market making)
  if (tradesPerDay > 150) {
    flags.push('Very high trade frequency');
  }
  
  // Rule 2: High churn - many trades per position (>3.0 ratio indicates constant adjustments)
  if (tradesPerPosition > 3.0) {
    flags.push('High churn (many adjustments per position)');
  }
  
  // Rule 3: Micro-trade pattern - small trades + high frequency (spread capture behavior)
  if (avgTradeSizeUsd < 300 && tradesPerDay > 50) {
    flags.push('Micro-trade pattern (spread capture behavior)');
  }
  
  // Rule 4: Very high trade count relative to positions (order book manipulation)
  if (trader.totalTrades > totalPositions * 5 && tradesPerDay > 30) {
    flags.push('Frequent order adjustments');
  }
  
  // Classification
  let rating: 'High' | 'Medium' | 'Low';
  let executionDependent: boolean;
  
  if (flags.length >= 2) {
    rating = 'Low';
    executionDependent = true;
  } else if (flags.length === 1) {
    rating = 'Medium';
    executionDependent = false;
  } else {
    rating = 'High';
    executionDependent = false;
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

export default function AnalyzeTrader() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputAddress, setInputAddress] = useState(searchParams.get('address') || '');
  const [analyzedAddress, setAnalyzedAddress] = useState(searchParams.get('address') || '');
  const [chartTimeFilter, setChartTimeFilter] = useState<ChartTimeFilter>('ALL');
  const [trader, setTrader] = useState<TraderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allocatedFunds, setAllocatedFunds] = useState(1000);
  
  const { user } = useAuth();
  const { isWatching, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const { toast } = useToast();
  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText('https://thetradefox.com?ref=POLYTRAK');
    toast({ title: 'Link copied to clipboard!' });
  };

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
      } finally {
        setLoading(false);
      }
    };

    fetchTraderData();
  }, [analyzedAddress]);

  const chartData = useMemo(() => 
    trader ? generatePnlChartData(trader, chartTimeFilter) : [],
    [trader, chartTimeFilter]
  );

  const smartScore = useMemo(() => trader ? calculateSmartScore(trader) : 0, [trader]);
  const sharpeRatio = useMemo(() => trader ? calculateSharpeRatio(trader) : 0, [trader]);
  const smartScoreInfo = getSmartScoreInfo(smartScore);
  const copySuitability = useMemo(() => trader ? calculateCopySuitability(trader) : null, [trader]);
  const copyStrategy = useMemo(() => 
    trader ? calculateOptimalStrategy(trader, allocatedFunds, copySuitability || undefined) : null,
    [trader, allocatedFunds, copySuitability]
  );
  const riskRegime = useMemo(() => trader ? calculateRiskRegime(trader) : null, [trader]);
  const marketFocus = useMemo(() => trader ? calculateMarketFocus(trader) : null, [trader]);

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
        {loading && <LoadingProgress />}

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
                    </div>
                    <div className={`h-16 w-16 rounded-full ${smartScoreInfo.bg} flex items-center justify-center`}>
                      <span className={`text-xl font-bold ${smartScoreInfo.color}`}>{smartScore}</span>
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
                        <span className={`text-4xl font-bold font-mono ${sharpeRatio >= 1 ? 'text-green-500' : sharpeRatio >= 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {sharpeRatio.toFixed(2)}
                        </span>
                        <Badge className={`${sharpeRatio >= 1 ? 'bg-green-500/20 text-green-500' : sharpeRatio >= 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'} border-0`}>
                          {sharpeRatio >= 2 ? 'Excellent' : sharpeRatio >= 1 ? 'Good' : sharpeRatio >= 0 ? 'Average' : 'Poor'}
                        </Badge>
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
              <Card className={`glass-card ${copySuitability?.rating === 'Low' ? 'border-red-500/50' : copySuitability?.rating === 'Medium' ? 'border-yellow-500/50' : 'border-green-500/50'}`}>
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
                                Measures how realistically this trader can be copied on TradeFox given execution constraints.
                              </p>
                              <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                                <li><strong>High</strong> - Directional trades, suitable for copy trading</li>
                                <li><strong>Medium</strong> - Some execution-dependent patterns</li>
                                <li><strong>Low</strong> - Market-making or HFT patterns</li>
                              </ul>
                              <p className="text-xs text-muted-foreground pt-2 border-t">
                                Copy trading works best for directional traders who hold positions long enough for followers to get similar fills.
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <span className={`text-4xl font-bold font-mono ${
                          copySuitability?.rating === 'High' ? 'text-green-500' : 
                          copySuitability?.rating === 'Medium' ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {copySuitability?.rating || 'N/A'}
                        </span>
                        <Badge className={`${
                          copySuitability?.rating === 'High' ? 'bg-green-500/20 text-green-500' : 
                          copySuitability?.rating === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' : 
                          'bg-red-500/20 text-red-500'
                        } border-0`}>
                          {copySuitability?.rating === 'High' ? 'Suitable' : 
                           copySuitability?.rating === 'Medium' ? 'Caution' : 'Risky'}
                        </Badge>
                      </div>
                    </div>
                    <div className={`h-16 w-16 rounded-full ${
                      copySuitability?.rating === 'High' ? 'bg-green-500/20' : 
                      copySuitability?.rating === 'Medium' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                    } flex items-center justify-center`}>
                      {copySuitability?.rating === 'High' ? (
                        <TrendingUp className="h-7 w-7 text-green-500" />
                      ) : copySuitability?.rating === 'Medium' ? (
                        <AlertTriangle className="h-7 w-7 text-yellow-500" />
                      ) : (
                        <AlertTriangle className="h-7 w-7 text-red-500" />
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
                {copySuitability?.executionDependent && (
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
                          {copySuitability.flags.map((flag, i) => (
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

                {/* AI Recommended Settings */}
                {copyStrategy && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">What percent of that should go into each trade</span>
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
                          <span className="text-sm text-muted-foreground">Enter the percentage of each trade to copy</span>
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

                    {/* Expected Outcomes */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground">Est. Monthly Return</span>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <button>
                                <Info className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80 z-[100]" side="top">
                              <div className="space-y-2">
                                <p className="text-sm font-semibold">How this is calculated</p>
                                <p className="text-xs text-muted-foreground">
                                  This is YOUR expected return based on the AI-recommended copy settings — not the trader's actual historical return.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-semibold">Formula:</span> (Win Rate × Avg Win) − (Loss Rate × Avg Loss), 
                                  scaled by trade size ({copyStrategy.tradeSize}%) and copy % ({copyStrategy.copyPercentage}%).
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
                                <p className="text-xs text-muted-foreground italic">
                                  Low returns may indicate: conservative settings, execution penalties, near-breakeven win rate, or few trades/month.
                                </p>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                        <p className={`text-2xl font-bold font-mono ${copyStrategy.expectedMonthlyReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {copyStrategy.expectedMonthlyReturn >= 0 ? '+' : ''}{copyStrategy.expectedMonthlyReturn}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ≈ ${((allocatedFunds * copyStrategy.expectedMonthlyReturn) / 100).toFixed(0)}/month
                        </p>
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
                  If you sign up using my referral link, it really helps support PolyTrak and lets me keep building new features.
                </p>
                
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
                  Disclaimer: PolyTrak is an independent analytics tool and is not affiliated with TradeFox.
                  Using my referral link is optional, but I'd really appreciate it — it helps support the project.
                  PolyTrak does not execute trades and this is not financial advice.
                </p>
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
