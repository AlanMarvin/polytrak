import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { 
  Target, TrendingUp, Zap, Scale, Info, 
  Settings2, Shield, Repeat, DollarSign 
} from 'lucide-react';

export interface StrategyProfile {
  name: string;
  description: string;
  icon: typeof Target;
  color: string;
  bgColor: string;
  borderColor: string;
  confidence: number;
  metrics: {
    tradeFrequency: 'low' | 'medium' | 'high';
    avgEntryPrice: 'early' | 'mid' | 'late';
    positionSizing: 'small' | 'medium' | 'large';
    marketConcentration: 'focused' | 'diversified';
    volatility: 'low' | 'medium' | 'high';
  };
  botConfig: {
    tradeSizePercent: number;
    maxExposurePercent: number;
    followExits: boolean;
    riskProfile: string;
  };
}

interface TraderMetrics {
  totalTrades: number;
  winRate: number;
  pnl: number;
  volume: number;
  sharpeRatio: number;
  positions: number;
  closedPositions: number;
  avgTradeSize: number;
  totalInvested: number;
  pnlHistory: Array<{ timestamp: number; pnl: number; cumulative: number }>;
  openPositions: Array<{ avgPrice: number; size: number; marketTitle: string }>;
}

export function classifyStrategy(trader: TraderMetrics): StrategyProfile {
  const avgTradeSize = trader.volume > 0 && trader.totalTrades > 0 
    ? trader.volume / trader.totalTrades 
    : 0;
  
  // Calculate average entry price from open positions
  const avgEntryPrice = trader.openPositions.length > 0
    ? trader.openPositions.reduce((sum, p) => sum + p.avgPrice, 0) / trader.openPositions.length
    : 0.5;
  
  // Trade frequency: trades per position closed
  const tradesPerPosition = trader.closedPositions > 0 
    ? trader.totalTrades / trader.closedPositions 
    : trader.totalTrades;
  
  // Market concentration: unique markets vs positions
  const uniqueMarkets = new Set(trader.openPositions.map(p => p.marketTitle)).size;
  const marketConcentration = trader.openPositions.length > 0 
    ? uniqueMarkets / trader.openPositions.length 
    : 1;
  
  // PnL volatility from history
  let pnlVolatility = 0;
  if (trader.pnlHistory.length > 1) {
    const returns = trader.pnlHistory.map(h => h.pnl);
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    pnlVolatility = Math.sqrt(variance);
  }

  // Strategy classification logic
  let strategy: StrategyProfile;

  // Probability Harvester: High trades, late entries (0.80+), low volatility
  if (avgEntryPrice >= 0.75 && tradesPerPosition >= 2 && trader.sharpeRatio >= 0.5) {
    strategy = {
      name: 'Probability Harvester',
      description: 'Focuses on high-probability outcomes with late entries and gradual scaling. Conservative approach with consistent small wins.',
      icon: Target,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      confidence: Math.min(95, 70 + (avgEntryPrice - 0.75) * 100),
      metrics: {
        tradeFrequency: tradesPerPosition > 5 ? 'high' : 'medium',
        avgEntryPrice: 'late',
        positionSizing: avgTradeSize < 1000 ? 'small' : avgTradeSize < 5000 ? 'medium' : 'large',
        marketConcentration: marketConcentration > 0.7 ? 'diversified' : 'focused',
        volatility: 'low',
      },
      botConfig: {
        tradeSizePercent: 1,
        maxExposurePercent: 5,
        followExits: true,
        riskProfile: 'Low volatility, capital preservation',
      },
    };
  }
  // Event-Driven Conviction: Few trades, large positions, early entries
  else if (avgEntryPrice <= 0.45 && avgTradeSize >= 500 && trader.totalTrades < 500) {
    strategy = {
      name: 'Event-Driven Conviction',
      description: 'Takes large positions on early opportunities with strong conviction. Higher risk tolerance with focused market exposure.',
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      confidence: Math.min(95, 65 + (0.45 - avgEntryPrice) * 100),
      metrics: {
        tradeFrequency: 'low',
        avgEntryPrice: 'early',
        positionSizing: 'large',
        marketConcentration: 'focused',
        volatility: 'high',
      },
      botConfig: {
        tradeSizePercent: 3,
        maxExposurePercent: 15,
        followExits: true,
        riskProfile: 'Higher risk, conviction-based',
      },
    };
  }
  // Momentum/Reaction Trader: Medium entries, fast turnover
  else if (avgEntryPrice >= 0.4 && avgEntryPrice <= 0.7 && tradesPerPosition >= 1.5) {
    strategy = {
      name: 'Momentum Trader',
      description: 'Reacts quickly to market moves and news. Medium-sized positions with faster turnover and moderate risk exposure.',
      icon: Zap,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      confidence: Math.min(90, 60 + trader.winRate * 0.3),
      metrics: {
        tradeFrequency: 'high',
        avgEntryPrice: 'mid',
        positionSizing: 'medium',
        marketConcentration: marketConcentration > 0.5 ? 'diversified' : 'focused',
        volatility: 'medium',
      },
      botConfig: {
        tradeSizePercent: 2,
        maxExposurePercent: 10,
        followExits: true,
        riskProfile: 'Moderate risk, quick exits',
      },
    };
  }
  // Arbitrage/Mispricing: Many small trades, low drawdowns, high Sharpe
  else if (trader.sharpeRatio >= 1.0 && avgTradeSize < 500 && trader.totalTrades > 100) {
    strategy = {
      name: 'Arbitrage Hunter',
      description: 'Exploits market inefficiencies with many small, precise trades. Very low risk with strict position controls.',
      icon: Scale,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      confidence: Math.min(95, 70 + trader.sharpeRatio * 10),
      metrics: {
        tradeFrequency: 'high',
        avgEntryPrice: 'mid',
        positionSizing: 'small',
        marketConcentration: 'diversified',
        volatility: 'low',
      },
      botConfig: {
        tradeSizePercent: 0.5,
        maxExposurePercent: 3,
        followExits: true,
        riskProfile: 'Very low risk, high frequency',
      },
    };
  }
  // Default: Balanced Trader
  else {
    strategy = {
      name: 'Balanced Trader',
      description: 'Mixed trading approach combining various strategies. Moderate risk with diversified market exposure.',
      icon: Settings2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
      confidence: 60,
      metrics: {
        tradeFrequency: tradesPerPosition > 3 ? 'high' : tradesPerPosition > 1.5 ? 'medium' : 'low',
        avgEntryPrice: avgEntryPrice > 0.65 ? 'late' : avgEntryPrice < 0.35 ? 'early' : 'mid',
        positionSizing: avgTradeSize < 500 ? 'small' : avgTradeSize < 2000 ? 'medium' : 'large',
        marketConcentration: marketConcentration > 0.6 ? 'diversified' : 'focused',
        volatility: trader.sharpeRatio > 1 ? 'low' : trader.sharpeRatio > 0 ? 'medium' : 'high',
      },
      botConfig: {
        tradeSizePercent: 2,
        maxExposurePercent: 10,
        followExits: true,
        riskProfile: 'Balanced risk profile',
      },
    };
  }

  return strategy;
}

interface StrategyAnalysisProps {
  strategy: StrategyProfile;
  allocatedCapital?: number;
}

export function StrategyAnalysis({ strategy, allocatedCapital = 1000 }: StrategyAnalysisProps) {
  const Icon = strategy.icon;
  
  const metricLabels = {
    tradeFrequency: { low: 'Low', medium: 'Medium', high: 'High' },
    avgEntryPrice: { early: 'Early (< 40¢)', mid: 'Mid (40-70¢)', late: 'Late (> 70¢)' },
    positionSizing: { small: 'Small', medium: 'Medium', large: 'Large' },
    marketConcentration: { focused: 'Focused', diversified: 'Diversified' },
    volatility: { low: 'Low', medium: 'Medium', high: 'High' },
  };

  const tradeSizeAmount = (allocatedCapital * strategy.botConfig.tradeSizePercent / 100).toFixed(0);
  const maxExposureAmount = (allocatedCapital * strategy.botConfig.maxExposurePercent / 100).toFixed(0);

  return (
    <Card className={`glass-card ${strategy.borderColor} border`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Strategy Classification
          </div>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                <Info className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">How Strategy Classification Works</h4>
                <p className="text-sm text-muted-foreground">
                  The system analyzes the trader's historical behavior including trade frequency, entry prices, position sizing, and risk metrics to assign a strategy profile.
                </p>
                <p className="text-xs text-muted-foreground">
                  This profile is used to configure the copy-trading bot on TheTradeFox with optimized parameters.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Strategy Badge */}
        <div className={`${strategy.bgColor} rounded-lg p-4 border ${strategy.borderColor}`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${strategy.bgColor}`}>
              <Icon className={`h-6 w-6 ${strategy.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-lg font-bold ${strategy.color}`}>{strategy.name}</h3>
                <Badge className={`${strategy.bgColor} ${strategy.color} border-0`}>
                  {strategy.confidence}% match
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{strategy.description}</p>
            </div>
          </div>
        </div>

        {/* Behavioral Metrics */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            Behavioral Metrics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Trade Frequency</p>
              <p className="text-sm font-medium">{metricLabels.tradeFrequency[strategy.metrics.tradeFrequency]}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Entry Price</p>
              <p className="text-sm font-medium">{metricLabels.avgEntryPrice[strategy.metrics.avgEntryPrice]}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Position Size</p>
              <p className="text-sm font-medium">{metricLabels.positionSizing[strategy.metrics.positionSizing]}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Market Focus</p>
              <p className="text-sm font-medium">{metricLabels.marketConcentration[strategy.metrics.marketConcentration]}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Volatility</p>
              <p className="text-sm font-medium">{metricLabels.volatility[strategy.metrics.volatility]}</p>
            </div>
          </div>
        </div>

        {/* Bot Configuration */}
        <div className="border-t border-border/50 pt-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            Recommended Bot Configuration
            <span className="text-xs text-muted-foreground">(for ${allocatedCapital.toLocaleString()} capital)</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Trade Size</span>
                </div>
                <span className="font-mono text-sm font-medium">
                  {strategy.botConfig.tradeSizePercent}% (${tradeSizeAmount})
                </span>
              </div>
              <Progress value={strategy.botConfig.tradeSizePercent * 10} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Max Exposure / Market</span>
                </div>
                <span className="font-mono text-sm font-medium">
                  {strategy.botConfig.maxExposurePercent}% (${maxExposureAmount})
                </span>
              </div>
              <Progress value={strategy.botConfig.maxExposurePercent * 5} className="h-2" />
            </div>

            <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Follow Exits</span>
              </div>
              <Badge variant={strategy.botConfig.followExits ? 'default' : 'secondary'}>
                {strategy.botConfig.followExits ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Risk Profile</span>
              </div>
              <span className="text-xs text-muted-foreground">{strategy.botConfig.riskProfile}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
