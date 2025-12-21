import { Layout } from '@/components/layout/Layout';

const Disclaimer = () => {
  return (
    <Layout>
      <div className="container py-16 max-w-4xl mx-auto">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-8">Disclaimer & Terms of Use</h1>

          <p className="text-muted-foreground mb-8">
            <strong>Last updated: December 2025</strong>
          </p>

          <div className="mb-8">
            <p>
              Polytrak.io is an independent analytics and educational tool designed to help users analyze publicly available Polymarket wallet data and understand potential copy-trading configurations.
            </p>
            <p className="mt-4">
              Polytrak.io does not execute trades, does not custody funds, and does not provide financial, investment, or legal advice.
            </p>
          </div>

          <h2 className="text-2xl font-semibold mb-4">1. No Financial Advice</h2>
          <ul className="list-disc pl-6 mb-8 space-y-2">
            <li>All information provided on Polytrak.io is for educational and informational purposes only.</li>
            <li>Nothing on this website constitutes financial advice, investment advice, or a recommendation to trade.</li>
            <li>You are solely responsible for your trading decisions.</li>
            <li>Past performance does not guarantee future results.</li>
            <li>Always do your own research (DYOR).</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">2. Data Accuracy & Limitations</h2>
          <p className="mb-4">Polytrak.io relies on publicly available data from Polymarket and third-party sources.</p>
          <p className="mb-4">Because of API limitations, rate limits, settlement mechanics, fees, and internal platform calculations:</p>
          <ul className="list-disc pl-6 mb-8 space-y-2">
            <li>Performance metrics (PnL, returns, drawdowns, win rates) may be approximate</li>
            <li>Results may differ from official Polymarket figures</li>
            <li>High-frequency or high-volume traders may show reduced accuracy</li>
            <li>Polytrak.io may display warnings or confidence indicators when data reliability is limited.</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">3. Copy Trading & External Platforms</h2>
          <ul className="list-disc pl-6 mb-8 space-y-2">
            <li>Polytrak.io does not offer copy trading directly.</li>
            <li>When available, Polytrak.io may:</li>
            <ul className="list-disc pl-12 mt-2 space-y-1">
              <li>Suggest configuration settings</li>
              <li>Link to third-party platforms (e.g. TheTradeFox)</li>
            </ul>
            <li>All trading execution happens outside Polytrak.io, under the terms and conditions of those platforms.</li>
            <li>Polytrak.io is not affiliated with Polymarket and operates independently from any trading platform unless explicitly stated.</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">4. Referral Disclosure</h2>
          <ul className="list-disc pl-6 mb-8 space-y-2">
            <li>Polytrak.io may include referral links to third-party platforms.</li>
            <li>If you choose to use a referral link:</li>
            <ul className="list-disc pl-12 mt-2 space-y-1">
              <li>Polytrak.io may earn a commission or revenue share from trading fees generated</li>
              <li>There is no additional cost to you</li>
              <li>Using referral links is optional and not required to use Polytrak.io</li>
              <li>Referral rewards are governed entirely by the third-party platform's terms.</li>
            </ul>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">5. Risk Disclosure</h2>
          <ul className="list-disc pl-6 mb-8 space-y-2">
            <li>Trading prediction markets involves significant risk, including the potential loss of all capital.</li>
            <li>You acknowledge that:</li>
            <ul className="list-disc pl-12 mt-2 space-y-1">
              <li>Markets can be illiquid</li>
              <li>Prices can move rapidly</li>
              <li>Fees, slippage, and execution delays may impact outcomes</li>
              <li>Only trade what you can afford to lose.</li>
            </ul>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">6. Public Wallet Visibility</h2>
          <ul className="list-disc pl-6 mb-8 space-y-2">
            <li>Polytrak.io analyzes public blockchain wallet addresses.</li>
            <li>All displayed addresses are publicly accessible on-chain</li>
            <li>No private keys, passwords, or sensitive user data are collected</li>
            <li>Displayed names or avatars are sourced from public profiles when available</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">7. Changes & Updates</h2>
          <ul className="list-disc pl-6 mb-8 space-y-2">
            <li>Polytrak.io is an evolving project.</li>
            <li>Features, calculations, UI, and methodologies may change at any time without notice as the product improves.</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default Disclaimer;
