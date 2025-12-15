export interface Trader {
  address: string;
  username?: string;
  pnl: number;
  pnl24h: number;
  pnl7d: number;
  pnl30d: number;
  winRate: number;
  totalTrades: number;
  volume: number;
  positions: number;
  lastActive: string;
}

export interface Position {
  id: string;
  marketId: string;
  marketTitle: string;
  outcome: string;
  size: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface Trade {
  id: string;
  timestamp: string;
  marketId: string;
  marketTitle: string;
  outcome: string;
  side: 'buy' | 'sell';
  size: number;
  price: number;
  pnl?: number;
}

export interface Market {
  id: string;
  title: string;
  slug: string;
  category: string;
  volume: number;
  liquidity: number;
  endDate: string;
  outcomes: {
    name: string;
    price: number;
  }[];
  image?: string;
}

export type TimeFilter = '24h' | '7d' | '30d' | 'all';
export type SortField = 'pnl' | 'winRate' | 'volume' | 'totalTrades';
export type SortDirection = 'asc' | 'desc';
