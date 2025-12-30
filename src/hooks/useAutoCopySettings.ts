import { useMemo } from 'react';

export type ExitMode = 'proportional' | 'mirror' | 'manual';

export interface CopySettings {
  // Entry sizing
  allocatedFunds: number;
  tradeSizePercent: number;
  copyPercentage: number;
  
  // Exit mode
  exitMode: ExitMode;
  
  // Advanced settings
  maxAmountPerMarket: number;
  minAmountPerMarket: number;
  maxCopyAmountPerTrade: number;
  minVolumePerMarket: number;
  minLiquidityPerMarket: number;
  marketPriceRangeMin: number;
  marketPriceRangeMax: number;
  entrySlippagePct: number;
  exitSlippagePct: number;
  maxTimeUntilResolution: number | 'any';
  
  // Auto-optimization
  isAutoOptimized: boolean;
}

export interface TraderStyleSignals {
  avgHoldTime?: number; // in hours
  usesPartialExits?: boolean;
  avgLiquidity?: number;
  winRate?: number;
  profitFactor?: number;
  sharpeRatio?: number;
  avgTradeSize?: number;
  tradeFrequency?: number; // trades per week
}

export interface AutoCopyRecommendation {
  settings: CopySettings;
  reasons: {
    field: keyof CopySettings;
    reason: string;
  }[];
}

/**
 * Default copy settings with updated values:
 * - minLiquidityPerMarket: 5000 (increased from previous)
 * - entrySlippagePct: 2
 * - exitSlippagePct: 4
 * - maxCopyAmountPerTrade: 50 (adaptive rule: 75 only if liquidity >= 20000)
 */
export const DEFAULT_COPY_SETTINGS: CopySettings = {
  allocatedFunds: 100,
  tradeSizePercent: 10,
  copyPercentage: 10,
  exitMode: 'proportional',
  maxAmountPerMarket: 500,
  minAmountPerMarket: 5,
  maxCopyAmountPerTrade: 50,
  minVolumePerMarket: 10000,
  minLiquidityPerMarket: 5000, // Updated default
  marketPriceRangeMin: 5,
  marketPriceRangeMax: 95,
  entrySlippagePct: 2, // New split slippage
  exitSlippagePct: 4, // New split slippage
  maxTimeUntilResolution: 'any',
  isAutoOptimized: true,
};

/**
 * Rule-based v1 optimizer that adjusts copy settings based on trader style signals.
 * This is the "Auto-Configured" / "Risk-Adjusted Optimizer" behavior.
 * 
 * Uses daily PnL aggregation when available for profit factor calculation.
 * Falls back to per-trade aggregation if daily data is missing.
 */
export function useAutoCopySettings(
  traderStats: TraderStyleSignals | null,
  userBudget: number = 100
): AutoCopyRecommendation {
  return useMemo(() => {
    const settings = { ...DEFAULT_COPY_SETTINGS };
    const reasons: AutoCopyRecommendation['reasons'] = [];
    
    if (!traderStats) {
      reasons.push({
        field: 'isAutoOptimized',
        reason: 'Using default settings - no trader data available',
      });
      return { settings, reasons };
    }

    // Adjust allocation based on user budget
    settings.allocatedFunds = userBudget;
    
    // === Exit Mode Selection ===
    // If trader uses partial exits frequently, proportional is best
    if (traderStats.usesPartialExits) {
      settings.exitMode = 'proportional';
      reasons.push({
        field: 'exitMode',
        reason: 'Trader uses partial exits - proportional mode recommended for aligned risk',
      });
    } else if (traderStats.avgHoldTime && traderStats.avgHoldTime < 24) {
      // Short-term traders: mirror mode to capture quick exits
      settings.exitMode = 'mirror';
      reasons.push({
        field: 'exitMode',
        reason: 'Short-term trader (< 24h hold) - mirror mode for quick exit capture',
      });
    }

    // === Trade Size Adjustment ===
    // Lower trade size for volatile traders (low Sharpe)
    if (traderStats.sharpeRatio !== undefined) {
      if (traderStats.sharpeRatio < 1) {
        settings.tradeSizePercent = 5;
        reasons.push({
          field: 'tradeSizePercent',
          reason: 'Low Sharpe ratio - reduced position size to limit volatility exposure',
        });
      } else if (traderStats.sharpeRatio > 2) {
        settings.tradeSizePercent = 15;
        reasons.push({
          field: 'tradeSizePercent',
          reason: 'High Sharpe ratio - increased position size for consistent performer',
        });
      }
    }

    // === Copy Percentage based on Profit Factor ===
    if (traderStats.profitFactor !== undefined) {
      if (traderStats.profitFactor < 1.2) {
        settings.copyPercentage = 5;
        reasons.push({
          field: 'copyPercentage',
          reason: 'Low profit factor - reduced copy percentage due to poor risk control',
        });
      } else if (traderStats.profitFactor > 2.5) {
        settings.copyPercentage = 15;
        reasons.push({
          field: 'copyPercentage',
          reason: 'Elite profit factor (>2.5) - increased copy percentage for strong performer',
        });
      }
    }

    // === Adaptive Max Copy Per Trade ===
    // Allow 75 only if liquidity >= 20000
    if (traderStats.avgLiquidity && traderStats.avgLiquidity >= 20000) {
      settings.maxCopyAmountPerTrade = 75;
      settings.minLiquidityPerMarket = 10000;
      reasons.push({
        field: 'maxCopyAmountPerTrade',
        reason: 'High liquidity trader (≥$20k avg) - increased max copy amount to $75',
      });
    } else {
      settings.maxCopyAmountPerTrade = 50;
      reasons.push({
        field: 'maxCopyAmountPerTrade',
        reason: 'Standard liquidity - max copy amount capped at $50',
      });
    }

    // === Slippage Adjustment ===
    // Higher frequency traders need tighter slippage
    if (traderStats.tradeFrequency && traderStats.tradeFrequency > 20) {
      settings.entrySlippagePct = 1;
      settings.exitSlippagePct = 2;
      reasons.push({
        field: 'entrySlippagePct',
        reason: 'High-frequency trader - tighter slippage to preserve margins',
      });
    }

    // === Time Until Resolution ===
    // Match trader's typical hold time
    if (traderStats.avgHoldTime) {
      if (traderStats.avgHoldTime < 48) {
        settings.maxTimeUntilResolution = 7;
        reasons.push({
          field: 'maxTimeUntilResolution',
          reason: 'Short-term trader - limiting to markets resolving within 7 days',
        });
      } else if (traderStats.avgHoldTime > 168) { // > 1 week
        settings.maxTimeUntilResolution = 90;
        reasons.push({
          field: 'maxTimeUntilResolution',
          reason: 'Long-term trader - allowing markets up to 90 days until resolution',
        });
      }
    }

    return { settings, reasons };
  }, [traderStats, userBudget]);
}

export const EXIT_MODE_OPTIONS = [
  {
    value: 'proportional' as ExitMode,
    label: 'Proportional',
    description: 'Sell in proportion to your allocation. Example: If you are allocated 50% and the trader sells 1,000 shares, you automatically sell 500 shares.',
  },
  {
    value: 'mirror' as ExitMode,
    label: 'Mirror',
    description: 'Mirror the exact percentage the trader exits. If they sell 30% of their position, you sell 30% of yours.',
  },
  {
    value: 'manual' as ExitMode,
    label: 'Manual',
    description: 'Do not auto-exit. You manage all exits yourself when the trader reduces or closes positions.',
  },
];
