import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ExternalLink, Star, Zap, Brain, BarChart3, Users,
  MessageSquare, Smartphone, Bell, ArrowRight, Calendar,
  Clock, User, DollarSign
} from 'lucide-react';

const Blog = () => {
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  // Blog posts data
  const blogPosts = [
    {
      id: 'polymarket-fees-guide',
      title: 'Polymarket Fees & Costs Guide 2025: Complete Breakdown',
      excerpt: 'Everything you need to know about Polymarket trading fees, platform costs, gas fees, and hidden charges that can eat into your profits.',
      date: '2025-01-20',
      readTime: '8 min read',
      category: 'Guide',
      icon: DollarSign,
      featured: true
    },
    {
      id: 'polymarket-tools-guide',
      title: 'Polymarket Tools - The Complete No-BS Guide for 2025',
      excerpt: 'Tested every tool in the Polymarket ecosystem. Most are mediocre. Some actually make money. Here is what matters when you are trying to profit from prediction markets.',
      date: '2025-01-15',
      readTime: '10 min read',
      category: 'Guide',
      icon: Zap,
      featured: false
    }
  ];

  // SEO: Set document title and meta tags
  useEffect(() => {
    const currentPost = selectedPost ? blogPosts.find(p => p.id === selectedPost) : null;

    if (currentPost) {
      document.title = `${currentPost.title} | Polytrak.io Blog`;

      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', currentPost.excerpt);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = currentPost.excerpt;
        document.head.appendChild(meta);
      }
    } else {
      document.title = 'Blog - Polymarket Guides & Trading Insights | Polytrak.io';

      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 'Comprehensive guides and insights for Polymarket trading. Learn about fees, tools, strategies, and maximize your prediction market profits.');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = 'Comprehensive guides and insights for Polymarket trading. Learn about fees, tools, strategies, and maximize your prediction market profits.';
        document.head.appendChild(meta);
      }
    }

    return () => {
      // Cleanup will be handled by the next effect
    };
  }, [selectedPost]);

  // Polymarket Fees Guide Content
  const PolymarketFeesGuide = () => (
    <article className="container py-12 max-w-4xl">
      {/* Article Header */}
      <header className="mb-12">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Badge variant="outline">Guide</Badge>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <time dateTime="2025-01-20">January 20, 2025</time>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>8 min read</span>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          Polymarket Fees & Costs Guide 2025: Complete Breakdown
        </h1>

        <p className="text-xl text-muted-foreground leading-relaxed">
          Understanding Polymarket fees is crucial for profitable trading. Hidden costs can eat into your profits.
          Here's the complete breakdown of all fees, costs, and charges on Polymarket in 2025.
        </p>
      </header>

      {/* Key Takeaway Box */}
      <Card className="bg-primary/5 border-primary/20 mb-12">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/20">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">The Bottom Line</h3>
              <p className="text-muted-foreground">
                Polymarket fees are transparent but can add up. Trading fees are 2% per side, gas fees vary by network,
                and withdrawal fees depend on your method. Always factor these into your trading strategy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="prose prose-invert max-w-none space-y-8">

        {/* Trading Fees */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-primary border-b border-primary/20 pb-2">1. Trading Fees</h2>
          <p className="text-lg text-muted-foreground">The most straightforward fee on Polymarket.</p>

          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Standard Trading Fee</h3>
            <div className="grid gap-2">
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span><strong className="text-primary">2% per trade side</strong> - This means 2% when you buy and 2% when you sell</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>For a complete round trip (buy + sell), you're paying <strong className="text-primary">4% total</strong> in trading fees</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>This fee is deducted from your winnings when you sell a position</span>
              </div>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
            <h4 className="font-semibold text-green-400 mb-2">💡 Example Calculation</h4>
            <p className="text-sm text-muted-foreground mb-2">If you buy $100 worth of YES shares and they resolve to YES (you win):</p>
            <ul className="text-sm space-y-1">
              <li>You get back your $100 stake + winnings</li>
              <li>2% fee is deducted from your total payout</li>
              <li>If the market pays out $150 total, you receive $147 after fees</li>
            </ul>
          </div>
        </section>

        {/* Gas Fees */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-primary border-b border-primary/20 pb-2">2. Gas Fees (Network Fees)</h2>
          <p className="text-lg text-muted-foreground">Paid to blockchain networks for transaction processing.</p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-red-400 mb-3">🚫 Ethereum Mainnet</h3>
              <ul className="space-y-2 text-sm">
                <li><strong>Variable fees</strong> - Depend on network congestion</li>
                <li><strong>Typical range:</strong> $5-50 per transaction</li>
                <li><strong>Higher during peaks:</strong> Can exceed $100</li>
              </ul>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-400 mb-3">✅ Polygon Network</h3>
              <ul className="space-y-2 text-sm">
                <li><strong>Much lower fees</strong> - Often under $1</li>
                <li><strong>Recommended for most traders</strong></li>
                <li><strong>Bridge fees:</strong> Small fee to move funds</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Withdrawal Fees */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-primary border-b border-primary/20 pb-2">3. Withdrawal Fees</h2>
          <p className="text-lg text-muted-foreground">Fees for withdrawing funds from Polymarket.</p>

          <div className="grid gap-4">
            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-400 mb-2">🏦 Bank Transfer (ACH)</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div><strong className="text-green-400">Free</strong> for amounts over $100</div>
                <div><strong className="text-yellow-400">$1 fee</strong> for amounts under $100</div>
                <div><strong className="text-blue-400">3-5 business days</strong></div>
              </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-400 mb-2">💰 Wire Transfer</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div><strong className="text-red-400">$35 fee</strong></div>
                <div>Higher cost but faster</div>
                <div><strong className="text-green-400">1-2 business days</strong></div>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
              <h3 className="font-semibold text-green-400 mb-2">₿ Crypto Withdrawal</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div><strong className="text-green-400">Network gas fees only</strong></div>
                <div>No Polymarket withdrawal fee</div>
                <div>Pay gas fees for transfer</div>
              </div>
            </div>
          </div>
        </section>

        {/* Deposit Fees */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-primary border-b border-primary/20 pb-2">4. Deposit Fees</h2>
          <p className="text-lg text-muted-foreground">Most deposit methods are free.</p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
              <h3 className="font-semibold text-green-400 mb-2">🏦 Bank Deposits</h3>
              <ul className="space-y-1 text-sm">
                <li><strong className="text-green-400">ACH deposits: Free</strong></li>
                <li>Wire deposits: May have bank fees</li>
              </ul>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-400 mb-2">₿ Crypto Deposits</h3>
              <ul className="space-y-1 text-sm">
                <li><strong className="text-green-400">Gas fees only</strong></li>
                <li>No Polymarket fees</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Platform Fees */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-primary border-b border-primary/20 pb-2">5. Platform Fees</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-400 mb-2">🔄 USDC Conversion Fee</h3>
              <ul className="space-y-1 text-sm">
                <li><strong>0.1% fee</strong> when converting between stablecoins</li>
                <li>Applies to USDC ↔ USDT conversions</li>
              </ul>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
              <h3 className="font-semibold text-red-400 mb-2">💤 Inactive Account Fee</h3>
              <ul className="space-y-1 text-sm">
                <li><strong>$5 monthly fee</strong> for accounts inactive 6+ months</li>
                <li>Waived if account has balance or recent activity</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Copy Trading Fees */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-primary border-b border-primary/20 pb-2">6. Copy Trading Fees</h2>
          <p className="text-lg text-muted-foreground">When using third-party copy trading services.</p>

          <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-400 mb-3">🤖 Third-Party Copy Trading</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong className="text-orange-400">Platform fees:</strong><br />
                Vary by provider (5-15% of profits)
              </div>
              <div>
                <strong className="text-orange-400">Performance fees:</strong><br />
                Charged by copy trading platforms
              </div>
              <div>
                <strong className="text-orange-400">Withdrawal fees:</strong><br />
                Additional fees from the platform
              </div>
            </div>
          </div>
        </section>

        {/* Tax Considerations */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-primary border-b border-primary/20 pb-2">7. Tax Considerations</h2>
          <p className="text-lg text-muted-foreground">Trading profits may be taxable depending on your jurisdiction.</p>

          <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-400 mb-3">🇺🇸 US Traders</h3>
            <ul className="space-y-2 text-sm">
              <li><strong>Report as miscellaneous income</strong></li>
              <li><strong>Self-employment tax</strong> may apply</li>
              <li><strong>Keep detailed records</strong> of all trades</li>
            </ul>
          </div>
        </section>

        {/* Fee Optimization */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-primary border-b border-primary/20 pb-2">8. Fee Optimization Strategies</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
              <h3 className="font-semibold text-green-400 mb-3">📉 Minimize Trading Costs</h3>
              <ul className="space-y-1 text-sm">
                <li><strong className="text-green-400">Use Polygon network</strong> - Much lower gas fees</li>
                <li><strong className="text-green-400">Trade during off-peak hours</strong> - Lower gas fees</li>
                <li><strong className="text-green-400">Batch transactions</strong> - Reduce gas costs</li>
                <li><strong className="text-green-400">Hold positions longer</strong> - Reduce round-trip fees</li>
              </ul>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-400 mb-3">💰 Smart Withdrawal Strategy</h3>
              <ul className="space-y-1 text-sm">
                <li><strong className="text-blue-400">Withdraw over $100</strong> - Avoid ACH fees</li>
                <li><strong className="text-blue-400">Use crypto withdrawals</strong> - Lowest fees</li>
                <li><strong className="text-blue-400">Time withdrawals strategically</strong> - Avoid peak congestion</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Complete Fee Breakdown */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-primary border-b border-primary/20 pb-2">9. Complete Fee Breakdown Example</h2>

          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-center">💵 Scenario: $1000 Investment</h3>

            <div className="grid gap-3">
              <div className="flex justify-between items-center py-2 border-b border-primary/20">
                <span className="font-medium">Deposit</span>
                <span className="text-green-400 font-bold">$0 (ACH free)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-primary/20">
                <span className="font-medium">Buy transaction</span>
                <span className="text-red-400 font-bold">$20 (2% of $1000)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-primary/20">
                <span className="font-medium">Gas fee (Polygon)</span>
                <span className="text-yellow-400 font-bold">$2</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-primary/20">
                <span className="font-medium">Sell transaction</span>
                <span className="text-red-400 font-bold">$20 (2% of $1000)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-primary/20">
                <span className="font-medium">Gas fee (Polygon)</span>
                <span className="text-yellow-400 font-bold">$2</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b-2 border-primary/40">
                <span className="font-medium">Withdrawal</span>
                <span className="text-green-400 font-bold">$0 (ACH over $100)</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-primary/20 rounded px-3">
                <span className="font-bold text-lg">Total fees</span>
                <span className="font-bold text-lg text-primary">$44 (4.4% of principal)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Key Takeaways */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-primary border-b border-primary/20 pb-2">🔑 Key Takeaways</h2>

          <div className="grid gap-4">
            <div className="bg-primary/5 border border-primary/30 p-4 rounded-lg">
              <h3 className="font-semibold text-primary mb-2">💡 Fee Transparency</h3>
              <p className="text-sm text-muted-foreground">Polymarket's fee structure is relatively transparent compared to traditional financial markets.</p>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
              <h3 className="font-semibold text-green-400 mb-2">✅ Network Choice Matters</h3>
              <p className="text-sm text-muted-foreground">The 2% trading fee per side is standard for prediction markets, but using Polygon significantly reduces gas costs.</p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-400 mb-2">🎯 Profit Strategy</h3>
              <p className="text-sm text-muted-foreground">The key to profitable trading is understanding how fees impact your returns and developing strategies to minimize them.</p>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg mt-6">
            <p className="text-center font-medium text-yellow-400">
              Always calculate your expected returns after fees, and consider the total cost of each trade before entering positions.
            </p>
          </div>
        </section>
      </div>

      {/* Back to Blog */}
      <div className="mt-12 pt-8 border-t border-border">
        <Button variant="outline" onClick={() => setSelectedPost(null)}>
          ← Back to Blog
        </Button>
      </div>
    </article>
  );

  const coreTools = [
    { name: 'TradeFox', handle: '@tradefoxai', desc: 'Best liquidity across platforms. Spreads matter. Easy Bot Trading.', url: 'https://thetradefox.com', recommended: true },
    { name: 'Polymarket', handle: '@Polymarket', desc: 'The platform itself. Where your money goes.', url: 'https://polymarket.com', recommended: true },
    { name: 'PolymarketTrade', handle: '@PolymarketTrade', desc: 'Track profitable traders. Copy smart, not blindly.', url: 'https://polymarket.trade', recommended: true },
    { name: 'PolymarketIntel', handle: '@PolymarketIntel', desc: 'News feed. Sleep on events, lose money.', url: 'https://polymarketintel.com', recommended: true },
    { name: 'PolymarketBuild', handle: '@PolymarketBuild', desc: 'New tools drop here.', url: 'https://polymarket.build', recommended: true },
  ];

  const aiTools = [
    { name: 'Munar AI', handle: '@Munar_AI', desc: 'AI assistant for research and market analysis.', url: 'https://munar.ai', recommended: true },
    { name: 'PolyAgent', handle: '@trypolyagent', desc: 'AI-powered trading assistant.', url: 'https://polyagent.ai', recommended: false },
    { name: 'PolyTale AI', handle: '@polytaleai', desc: 'AI for filtering noise and finding signals.', url: 'https://polytale.ai', recommended: false },
    { name: 'PolyBro', handle: '@polybroapp', desc: 'Quantum signals. When it says fade - consider fading.', url: 'https://polybro.app', recommended: false },
    { name: 'PolySimplr', handle: '@polysimplr', desc: "If Polymarket's interface frustrates you, use this.", url: 'https://polysimplr.com', recommended: false },
    { name: 'Raven AI', handle: '@Ravenai_', desc: 'Meta-analysis. For those thinking three steps ahead.', url: 'https://raven.ai', recommended: false },
    { name: 'Rainmaker', handle: '@rainmakerdotfun', desc: 'Specifically for sports betting markets.', url: 'https://rainmaker.fun', recommended: false },
  ];

  const analyticsTools = [
    { name: 'PolymarketEco', handle: '@PolymarketEco', desc: 'Directory of all tools. Bookmark it.', url: 'https://polymarket.eco', recommended: true },
    { name: 'LayerHub', handle: '@layerhub', desc: 'Whale and smart money tracking.', url: 'https://layerhub.xyz', recommended: true },
    { name: 'PolyAlertHub', handle: '@PolyAlertHub', desc: 'Know when whales move.', url: 'https://polyalerthub.com', recommended: true },
    { name: 'Pizzint Watch', handle: '@pizzintwatch', desc: 'Pentagon pizza orders predict military action.', url: 'https://pizzint.watch', recommended: true },
    { name: 'HashDive', handle: '@hash_dive', desc: '"Smart Scores" = statistical edge. Check before big trades.', url: 'https://hashdive.com', recommended: true },
    { name: 'Polysights', handle: '@Polysights', desc: 'AI against revenge trading.', url: 'https://polysights.io', recommended: true },
    { name: 'Nevua Markets', handle: '@NevuaMarkets', desc: 'Instant alerts. Set it up or miss opportunities.', url: 'https://nevua.markets', recommended: true },
    { name: 'PolyFactual', handle: '@polyfactual', desc: 'Weekly streams and free alpha.', url: 'https://polyfactual.com', recommended: true },
    { name: 'PolyNoob', handle: '@Polynoob_', desc: 'Complete guide for beginners.', url: 'https://polynoob.com', recommended: true },
    { name: 'PolyScope', handle: '@polyscope_', desc: 'Free monitoring dashboard.', url: 'https://polyscope.io', recommended: false },
    { name: 'PredictFolio', handle: '@PredictFolio', desc: 'Real-time portfolio tracking.', url: 'https://predictfolio.com', recommended: false },
  ];

  const tradingTools = [
    { name: 'Ostium Labs', handle: '@OstiumLabs', desc: 'Long/short TradFi assets onchain with leverage.', url: 'https://ostium.io', recommended: false },
    { name: 'Flipr Bot', handle: '@fliprbot', desc: 'Leverage for prediction markets. Careful, liquidations are real.', url: 'https://flipr.bot', recommended: false },
    { name: 'OKBet', handle: '@tryokbet', desc: 'Telegram bot for trading.', url: 'https://okbet.io', recommended: false },
    { name: 'PolyX Bot', handle: '@PolyxBot', desc: 'Twitter bot integration.', url: 'https://polyx.bot', recommended: false },
    { name: 'Bankr Bot', handle: '@bankrbot', desc: 'Trade when you are not at your desk.', url: 'https://bankr.bot', recommended: false },
    { name: 'PolySwipe', handle: '@polyswipe_app', desc: 'Mobile terminal. Trade from anywhere.', url: 'https://polyswipe.app', recommended: false },
    { name: 'Polyburg', handle: '@polyburg', desc: 'Catches signals others miss. Contrarian positions.', url: 'https://polyburg.com', recommended: true },
    { name: 'Stand Trade', handle: '@StandDOTtrade', desc: 'Advanced terminal. Everything in one place.', url: 'https://stand.trade', recommended: false },
  ];

  const communities = [
    { name: 'ZSC DAO', handle: '@zscdao', desc: 'Real traders. Network here.', url: 'https://zsc.dao', recommended: true },
    { name: 'Prediction Arc', handle: '@predictionarc', desc: 'For beginners. Biggest community, supported by Polymarket.', url: 'https://predictionarc.com', recommended: true },
  ];

  // Extract Twitter handle from the @ format
  const getTwitterHandle = (handle: string) => handle.replace('@', '');

  const ToolSection = ({ 
    title, 
    icon: Icon, 
    tools, 
    description 
  }: { 
    title: string; 
    icon: React.ElementType; 
    tools: typeof coreTools; 
    description: string;
  }) => (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <p className="text-muted-foreground mb-6">{description}</p>
      <div className="grid gap-4">
        {tools.map((tool) => (
          <Card key={tool.name} className="glass-card hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Logo/Avatar */}
                <a href={tool.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <img 
                    src={`https://unavatar.io/twitter/${getTwitterHandle(tool.handle)}`}
                    alt={`${tool.name} logo`}
                    className="w-12 h-12 rounded-lg bg-muted object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tool.name)}&background=7c3aed&color=fff&size=48`;
                    }}
                  />
                </a>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <a 
                      href={tool.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {tool.name}
                    </a>
                    <a 
                      href={`https://twitter.com/${getTwitterHandle(tool.handle)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {tool.handle}
                    </a>
                    {tool.recommended && (
                      <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                        <Star className="h-3 w-3 mr-1" /> Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">{tool.desc}</p>
                </div>
                
                <a href={tool.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );

  // Blog Listing Component
  const BlogListing = () => (
    <Layout>
      <div className="container py-12 max-w-4xl">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Blog</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive guides and insights for Polymarket trading.
            Learn about fees, tools, strategies, and maximize your profits.
          </p>
        </header>

        {/* Featured Post */}
        {blogPosts.filter(post => post.featured).map((post) => (
          <Card key={post.id} className="mb-8 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 border-primary/20">
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                <div className="p-3 rounded-lg bg-primary/20 flex-shrink-0">
                  <post.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      Featured
                    </Badge>
                    <Badge variant="outline">{post.category}</Badge>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3">{post.title}</h2>
                  <p className="text-muted-foreground mb-4 leading-relaxed">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                  <Button onClick={() => setSelectedPost(post.id)}>
                    Read Full Article <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Other Posts */}
        <div className="grid gap-6">
          {blogPosts.filter(post => !post.featured).map((post) => (
            <Card key={post.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setSelectedPost(post.id)}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-muted flex-shrink-0">
                    <post.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{post.category}</Badge>
                      <span className="text-sm text-muted-foreground">{post.date}</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 hover:text-primary transition-colors">{post.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{post.excerpt}</p>
                    <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );

  // Polymarket Tools Guide (original content)
  const PolymarketToolsGuide = () => (
    <Layout>
      {/* Hero Section */}
      <article className="container py-12 max-w-4xl">
        {/* Article Header */}
        <header className="mb-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Badge variant="outline">Guide</Badge>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <time dateTime="2025-01-15">January 15, 2025</time>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>10 min read</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Polymarket Tools - The Complete No-BS Guide for 2025
          </h1>

          <p className="text-xl text-muted-foreground leading-relaxed">
            Tested every tool in the Polymarket ecosystem. Most are mediocre. Some actually make money.
            Here is what matters when you are trying to profit from prediction markets. No fluff, only what gives you an edge.
          </p>
        </header>

        {/* Key Takeaway Box */}
        <Card className="bg-primary/5 border-primary/20 mb-12">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/20">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">The Bottom Line</h3>
                <p className="text-muted-foreground">
                  Cut through the noise. Focus on execution. These are the tools that actually move your PnL.
                  Tools marked with <Star className="h-3 w-3 inline text-primary" /> are personally tested and recommended.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA: Use Our Analyze Tool */}
        <Card className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border-primary/20 mb-12">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold mb-1">Want to analyze any trader instantly?</h3>
                <p className="text-muted-foreground text-sm">
                  Use our free Trader Analyzer to check any wallet's PnL, win rate, and positions.
                </p>
              </div>
              <Link to="/analyze">
                <Button>
                  Try Analyzer <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Separator className="mb-12" />

        {/* Tool Sections */}
        <ToolSection
          title="Core Accounts - You Need These"
          icon={Zap}
          tools={coreTools}
          description="These are the essential accounts to follow. The foundation of staying informed in the Polymarket ecosystem."
        />

        <ToolSection
          title="AI Assistance"
          icon={Brain}
          tools={aiTools}
          description="AI assistants for research, market analysis, and filtering noise. Pick one that fits your style and save hours of manual work."
        />

        <ToolSection
          title="Data & Analytics"
          icon={BarChart3}
          tools={analyticsTools}
          description="Information is everything. These tools give you the data edge - whale tracking, alerts, smart scores, and portfolio analytics."
        />

        <ToolSection
          title="Trading Terminals & Bots"
          icon={Smartphone}
          tools={tradingTools}
          description="Execute trades faster with terminals and bots. Trade from Telegram, mobile, or advanced desktop interfaces."
        />

        <ToolSection
          title="Communities"
          icon={Users}
          tools={communities}
          description="Connect with other traders. Learn from winners. Network matters in prediction markets."
        />

        <Separator className="my-12" />

        {/* Conclusion */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Final Thoughts</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground mb-4">
              The Polymarket ecosystem has exploded with tools. Not all of them are worth your time.
              Focus on the ones that directly impact your trading edge:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li><strong>Information first</strong> - Follow the core accounts and set up alerts</li>
              <li><strong>Analytics second</strong> - Use HashDive or similar for smart scores before big trades</li>
              <li><strong>Copy trading carefully</strong> - Track profitable traders, but understand their strategy</li>
              <li><strong>Community for alpha</strong> - Join ZSC DAO or Prediction Arc for real-time discussions</li>
            </ul>
            <p className="text-muted-foreground">
              Most importantly: no tool replaces good judgment. Use them to enhance your edge, not replace your thinking.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <Card className="bg-gradient-to-r from-accent/20 via-primary/10 to-primary/20 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-2">Ready to find profitable traders?</h3>
            <p className="text-muted-foreground mb-6">
              Use Polytrak.io to discover and analyze the smartest traders on Polymarket.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/">
                <Button size="lg">
                  View Leaderboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/analyze">
                <Button variant="outline" size="lg">
                  Analyze a Trader
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </article>

      {/* Back to Blog */}
      <div className="container py-8 border-t border-border">
        <Button variant="outline" onClick={() => setSelectedPost(null)}>
          ← Back to Blog
        </Button>
      </div>
    </Layout>
  );

  // Main return - show either listing or selected post
  if (selectedPost === 'polymarket-fees-guide') {
    return <PolymarketFeesGuide />;
  } else if (selectedPost === 'polymarket-tools-guide') {
    return <PolymarketToolsGuide />;
  } else {
    return <BlogListing />;
  }
};

export default Blog;
