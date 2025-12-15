import { Trader, Position, Trade, Market } from '@/types/polymarket';

// Generate realistic mock data for demonstration
const generateAddress = () => 
  '0x' + Array.from({ length: 40 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

const traderNames = [
  'whale.eth', 'cryptoprophet', 'marketmaker99', 'degen_trader', 
  'prediction_king', 'alpha_seeker', 'risk_taker', 'data_driven',
  'quant_master', 'momentum_play', 'trend_follower', 'contrarian',
  'value_hunter', 'swing_trader', 'position_size', 'hedge_fund_lite'
];

const marketTitles = [
  'Will Bitcoin reach $100k by end of 2025?',
  'US Presidential Election 2024 Winner',
  'Will Ethereum flip Bitcoin by 2026?',
  'Super Bowl 2025 Winner',
  'Will AI pass the Turing test by 2025?',
  'Fed Interest Rate December 2024',
  'Will SpaceX reach Mars by 2030?',
  'Oscar Best Picture 2025',
  'Champions League Winner 2025',
  'Will there be a recession in 2025?'
];

const categories = ['Crypto', 'Politics', 'Sports', 'Tech', 'Entertainment', 'Economics'];

export const generateMockTraders = (count: number = 50): Trader[] => {
  return Array.from({ length: count }, (_, i) => {
    const pnl = Math.random() * 500000 - 100000;
    const winRate = 40 + Math.random() * 50;
    
    return {
      address: generateAddress(),
      username: Math.random() > 0.3 ? traderNames[i % traderNames.length] + (i > 15 ? i : '') : undefined,
      pnl,
      pnl24h: pnl * (0.01 + Math.random() * 0.05) * (Math.random() > 0.5 ? 1 : -1),
      pnl7d: pnl * (0.05 + Math.random() * 0.15) * (Math.random() > 0.5 ? 1 : -1),
      pnl30d: pnl * (0.1 + Math.random() * 0.3) * (Math.random() > 0.5 ? 1 : -1),
      winRate,
      totalTrades: Math.floor(50 + Math.random() * 2000),
      volume: Math.random() * 2000000,
      positions: Math.floor(1 + Math.random() * 20),
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }).sort((a, b) => b.pnl - a.pnl);
};

export const generateMockPositions = (count: number = 10): Position[] => {
  return Array.from({ length: count }, (_, i) => {
    const avgPrice = 0.1 + Math.random() * 0.8;
    const currentPrice = avgPrice + (Math.random() - 0.5) * 0.3;
    const size = 100 + Math.random() * 10000;
    const pnl = (currentPrice - avgPrice) * size;
    
    return {
      id: `pos-${i}`,
      marketId: `market-${i}`,
      marketTitle: marketTitles[i % marketTitles.length],
      outcome: Math.random() > 0.5 ? 'Yes' : 'No',
      size,
      avgPrice,
      currentPrice: Math.max(0.01, Math.min(0.99, currentPrice)),
      pnl,
      pnlPercent: (pnl / (avgPrice * size)) * 100,
    };
  });
};

export const generateMockTrades = (count: number = 50): Trade[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `trade-${i}`,
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    marketId: `market-${i % 10}`,
    marketTitle: marketTitles[i % marketTitles.length],
    outcome: Math.random() > 0.5 ? 'Yes' : 'No',
    side: (Math.random() > 0.5 ? 'buy' : 'sell') as 'buy' | 'sell',
    size: 100 + Math.random() * 5000,
    price: 0.1 + Math.random() * 0.8,
    pnl: Math.random() > 0.5 ? Math.random() * 1000 : -Math.random() * 500,
  })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const generateMockMarkets = (count: number = 20): Market[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `market-${i}`,
    title: marketTitles[i % marketTitles.length],
    slug: marketTitles[i % marketTitles.length].toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    category: categories[i % categories.length],
    volume: 100000 + Math.random() * 10000000,
    liquidity: 50000 + Math.random() * 500000,
    endDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    outcomes: [
      { name: 'Yes', price: 0.1 + Math.random() * 0.8 },
      { name: 'No', price: 0 },
    ].map(o => ({ ...o, price: o.name === 'No' ? 1 - (0.1 + Math.random() * 0.8) : o.price })),
  }));
};

export const mockTraders = generateMockTraders();
export const mockPositions = generateMockPositions();
export const mockTrades = generateMockTrades();
export const mockMarkets = generateMockMarkets();
