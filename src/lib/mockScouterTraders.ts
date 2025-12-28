// Mock data for Scouter page - ranked Polymarket traders

export type TraderRow = {
  rank: number;
  address: string;
  displayName?: string;
  polymarketUrl?: string;
  totalPnl: number;
  score: number;
  winRate: number; // 0-100
  rov: number; // percent
  sharpe: number;
  pFactor: number;
};

// Generate realistic mock trader data
const generateAddress = () =>
  '0x' + Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

const traderDisplayNames = [
  'whale.eth', 'cryptoprophet', 'marketmaker99', 'degen_trader',
  'prediction_king', 'alpha_seeker', 'risk_taker', 'data_driven',
  'quant_master', 'momentum_play', 'trend_follower', 'contrarian',
  'value_hunter', 'swing_trader', 'position_size', 'hedge_fund_lite',
  'market_wizard', 'oracle_trader', 'probability_master', 'edge_finder',
  'signal_chaser', 'beta_buster', 'gamma_guru', 'delta_dominator',
  'theta_trader', 'vega_veteran', 'rho_rogue', 'kappa_king',
  'lambda_legend', 'mu_master', 'nu_ninja', 'xi_xpert'
];

const generateTraderRow = (rank: number): TraderRow => {
  const baseScore = Math.max(0, 100 - (rank - 1) * 0.8 + Math.random() * 20 - 10);
  const score = Math.min(100, Math.max(0, Math.round(baseScore)));

  // Higher ranked traders tend to have better stats
  const winRateBase = 45 + (100 - rank) * 0.3;
  const winRate = Math.min(95, Math.max(20, Math.round(winRateBase + Math.random() * 15 - 7.5)));

  const pnlBase = 50000 + (100 - rank) * 2000;
  const totalPnl = Math.round((pnlBase + Math.random() * 30000 - 15000) * (Math.random() > 0.3 ? 1 : -1));

  const sharpeBase = 0.5 + (100 - rank) * 0.02;
  const sharpe = Math.max(0.1, Math.round((sharpeBase + Math.random() * 0.5 - 0.25) * 100) / 100);

  const pFactorBase = 1.1 + (100 - rank) * 0.01;
  const pFactor = Math.max(0.8, Math.round((pFactorBase + Math.random() * 0.3 - 0.15) * 100) / 100);

  const rovBase = 15 + (100 - rank) * 0.5;
  const rov = Math.max(0, Math.min(100, Math.round(rovBase + Math.random() * 20 - 10)));

  const address = generateAddress();
  const hasDisplayName = Math.random() > 0.4;
  const displayName = hasDisplayName ? traderDisplayNames[Math.floor(Math.random() * traderDisplayNames.length)] + (rank < 20 ? '' : Math.floor(Math.random() * 100)) : undefined;

  return {
    rank,
    address,
    displayName,
    polymarketUrl: `https://polymarket.com/profile/${address}`,
    totalPnl,
    score,
    winRate,
    rov,
    sharpe,
    pFactor
  };
};

export const mockScouterTraders: TraderRow[] = Array.from({ length: 150 }, (_, i) => generateTraderRow(i + 1));

// TODO: Replace with real API call
export const fetchScouterTraders = async (): Promise<TraderRow[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockScouterTraders;
};
