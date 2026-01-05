import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ExternalLink, Star, Zap, Brain, BarChart3, Users, 
  MessageSquare, Smartphone, Bell, ArrowRight, Calendar,
  Clock, User
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { StructuredData } from '@/components/seo/StructuredData';

const Blog = () => {
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

  return (
    <Layout>
      <SEOHead
        title="Polymarket Tools Guide 2025 - Best Trading Tools & Resources | PolyTrak"
        description="Complete guide to Polymarket trading tools in 2025. Discover the best analytics, copy trading, AI assistants, and portfolio tracking tools."
        canonicalUrl="/blog"
        ogType="article"
        article={{
          publishedTime: '2025-01-15',
          modifiedTime: '2025-01-15',
          author: 'PolyTrak',
        }}
      />
      <StructuredData
        schema={{
          type: 'Article',
          headline: 'Polymarket Tools - The Complete No-BS Guide for 2025',
          description: 'Comprehensive guide to Polymarket trading tools, analytics platforms, and resources for prediction market traders.',
          author: 'PolyTrak',
          publisher: 'PolyTrak',
          datePublished: '2025-01-15',
          dateModified: '2025-01-15',
          url: 'https://polytrak.io/blog',
        }}
      />
      {/* Blog Posts Navigation */}
      <div className="container py-8 max-w-4xl">
        <h2 className="text-lg font-semibold mb-4">Latest Articles</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="glass-card hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <Badge variant="outline" className="mb-2">Guide</Badge>
              <h3 className="font-semibold mb-1">Polymarket Tools - The Complete No-BS Guide for 2025</h3>
              <p className="text-sm text-muted-foreground mb-3">Tested every tool in the Polymarket ecosystem. Here's what matters.</p>
              <span className="text-sm text-primary">You're reading this →</span>
            </CardContent>
          </Card>
          <Link to="/blog/features">
            <Card className="glass-card hover:border-primary/30 transition-colors h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Features</Badge>
                  <Badge className="bg-accent text-accent-foreground text-xs">New</Badge>
                </div>
                <h3 className="font-semibold mb-1">PolyTrak Features: Complete Guide to Our Trading Analytics</h3>
                <p className="text-sm text-muted-foreground mb-3">Discover Smart Score, ROV, Sharpe Ratio, and auto-generated copy settings.</p>
                <span className="text-sm text-primary flex items-center gap-1">Read article <ArrowRight className="h-3 w-3" /></span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <Separator className="container max-w-4xl" />

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
                  Use our free Trader Analyzer to check any wallet is PnL, win rate, and positions.
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
              Use PolyTracker to discover and analyze the smartest traders on Polymarket.
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
    </Layout>
  );
};

export default Blog;
