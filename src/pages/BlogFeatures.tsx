import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, Calendar, Clock, Brain, TrendingUp, 
  Shield, Zap, Target, BarChart3, Settings2, 
  Copy, Activity, Search, ChevronRight
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { StructuredData } from '@/components/seo/StructuredData';

const BlogFeatures = () => {
  const features = [
    {
      icon: Brain,
      title: 'Smart Score Rating',
      description: 'Our proprietary algorithm rates traders from 0-100 based on risk-adjusted performance.',
      details: [
        'Analyzes profit consistency across different market conditions',
        'Weights recent performance more heavily than older trades',
        'Factors in drawdown patterns and recovery speed',
        'Considers position sizing discipline and risk management'
      ],
      badge: 'Core Feature'
    },
    {
      icon: TrendingUp,
      title: 'ROV (Return on Volume)',
      description: 'A unique efficiency metric that measures how well traders convert trading volume into actual profit.',
      details: [
        'Calculates realized profits relative to total capital deployed',
        'Accounts for both entry and exit volume in closed positions',
        'Estimates missing sell volume for resolution exits',
        'Provides insight into true trading efficiency beyond raw PnL'
      ],
      badge: 'Beta'
    },
    {
      icon: Activity,
      title: 'Sharpe Ratio Analysis',
      description: 'Industry-standard risk-adjusted return metric adapted for prediction market trading.',
      details: [
        'Measures excess return per unit of volatility',
        'Higher values indicate better risk-adjusted performance',
        'Helps identify traders who achieve returns without excessive risk',
        'Compares traders on a level playing field regardless of capital'
      ],
      badge: 'Analytics'
    },
    {
      icon: Shield,
      title: 'Copy Suitability Score',
      description: 'AI-powered assessment of whether a trader is safe to copy trade.',
      details: [
        'Evaluates trading pattern consistency and predictability',
        'Analyzes position hold times and exit behavior',
        'Checks for erratic or high-risk trading patterns',
        'Rates as Excellent, Good, Fair, or Poor for copy trading'
      ],
      badge: 'AI-Powered'
    },
    {
      icon: Settings2,
      title: 'Auto-Generated Copy Settings',
      description: 'Intelligent configuration generator that creates optimal copy trading parameters.',
      details: [
        'Calculates recommended allocation based on trader volatility',
        'Sets appropriate trade size percentages for risk management',
        'Determines optimal exit mode (Follow Exits vs Manual)',
        'Configures slippage and timing parameters automatically'
      ],
      badge: 'New'
    },
    {
      icon: Search,
      title: 'Deep Trader Analysis',
      description: 'Comprehensive breakdown of any Polymarket trader by wallet address.',
      details: [
        'Full trading history with profit/loss breakdown',
        'Win rate across different market categories',
        'Open positions with current unrealized P&L',
        'Historical performance charts and trends'
      ],
      badge: 'Free'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Enter Wallet Address',
      description: 'Paste any Polymarket trader wallet address or username into the analyzer.'
    },
    {
      step: 2,
      title: 'Fetch On-Chain Data',
      description: 'We pull real trading data directly from Polymarket APIs and blockchain.'
    },
    {
      step: 3,
      title: 'Calculate Metrics',
      description: 'Our algorithms process trades to generate Smart Score, ROV, and Sharpe Ratio.'
    },
    {
      step: 4,
      title: 'Generate Settings',
      description: 'AI creates optimal copy trading configuration based on the analysis.'
    }
  ];

  return (
    <Layout>
      <SEOHead
        title="PolyTrak Features - Smart Copy Trading Analytics for Polymarket | PolyTrak"
        description="Discover how PolyTrak analyzes Polymarket traders with Smart Score, ROV, Sharpe Ratio, and AI-powered copy trading settings. Deep dive into all features."
        canonicalUrl="/blog/features"
        ogType="article"
        article={{
          publishedTime: '2025-01-05',
          modifiedTime: '2025-01-05',
          author: 'PolyTrak',
        }}
      />
      <StructuredData
        schema={{
          type: 'Article',
          headline: 'PolyTrak Features - Complete Guide to Smart Copy Trading Analytics',
          description: 'Deep dive into PolyTrak features: Smart Score, ROV, Sharpe Ratio, Copy Suitability, and auto-generated copy trading settings.',
          author: 'PolyTrak',
          publisher: 'PolyTrak',
          datePublished: '2025-01-05',
          dateModified: '2025-01-05',
          url: 'https://polytrak.io/blog/features',
        }}
      />

      <article className="container py-12 max-w-4xl">
        {/* Article Header */}
        <header className="mb-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Features</Badge>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <time dateTime="2025-01-05">January 5, 2025</time>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>8 min read</span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            PolyTrak Features - Complete Guide to Smart Copy Trading Analytics
          </h1>
          
          <p className="text-xl text-muted-foreground leading-relaxed">
            PolyTrak transforms raw Polymarket trading data into actionable insights. Here's a deep dive into every feature, how it works, and how to use it for smarter copy trading decisions.
          </p>
        </header>

        {/* Feature Image */}
        <div className="relative mb-12 rounded-xl overflow-hidden border border-border/50">
          <div className="aspect-video bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="flex justify-center gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-primary/20 backdrop-blur">
                  <Brain className="h-10 w-10 text-primary" />
                </div>
                <div className="p-4 rounded-2xl bg-accent/20 backdrop-blur">
                  <TrendingUp className="h-10 w-10 text-accent" />
                </div>
                <div className="p-4 rounded-2xl bg-primary/20 backdrop-blur">
                  <Target className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Smart Analytics for Polymarket</h2>
              <p className="text-muted-foreground">Analyze → Score → Copy</p>
            </div>
          </div>
        </div>

        {/* Quick Overview */}
        <Card className="bg-primary/5 border-primary/20 mb-12">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/20">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">What PolyTrak Does</h3>
                <p className="text-muted-foreground">
                  We analyze any Polymarket trader's wallet and generate a complete profile with Smart Score (0-100), 
                  ROV efficiency metric, Sharpe Ratio, Copy Suitability rating, and AI-generated copy trading settings. 
                  All from a single wallet address.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="mb-12" />

        {/* How It Works */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-accent/10">
              <Settings2 className="h-5 w-5 text-accent" />
            </div>
            <h2 className="text-2xl font-bold">How It Works</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {howItWorks.map((step) => (
              <Card key={step.step} className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-primary">{step.step}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Process Flow Visual */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <span className="px-3 py-1 rounded-full bg-muted">Wallet</span>
            <ChevronRight className="h-4 w-4" />
            <span className="px-3 py-1 rounded-full bg-muted">API</span>
            <ChevronRight className="h-4 w-4" />
            <span className="px-3 py-1 rounded-full bg-muted">Analysis</span>
            <ChevronRight className="h-4 w-4" />
            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary">Settings</span>
          </div>
        </section>

        <Separator className="mb-12" />

        {/* Feature Deep Dives */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Feature Deep Dive</h2>
          </div>

          <div className="space-y-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="glass-card overflow-hidden">
                  <CardContent className="p-0">
                    <div className="md:flex">
                      {/* Feature Icon Section */}
                      <div className="md:w-1/3 p-6 bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center">
                        <div className="text-center">
                          <div className="inline-flex p-4 rounded-2xl bg-primary/20 mb-3">
                            <Icon className="h-8 w-8 text-primary" />
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={
                              feature.badge === 'Beta' 
                                ? 'bg-orange-500/20 text-orange-400' 
                                : feature.badge === 'New'
                                ? 'bg-green-500/20 text-green-400'
                                : feature.badge === 'AI-Powered'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-primary/20 text-primary'
                            }
                          >
                            {feature.badge}
                          </Badge>
                        </div>
                      </div>

                      {/* Feature Content */}
                      <div className="md:w-2/3 p-6">
                        <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground mb-4">{feature.description}</p>
                        <ul className="space-y-2">
                          {feature.details.map((detail, detailIndex) => (
                            <li key={detailIndex} className="flex items-start gap-2 text-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                              <span className="text-muted-foreground">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <Separator className="mb-12" />

        {/* Copy Trading Settings Explained */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-accent/10">
              <Copy className="h-5 w-5 text-accent" />
            </div>
            <h2 className="text-2xl font-bold">Auto-Generated Copy Settings</h2>
          </div>

          <p className="text-muted-foreground mb-6">
            When you analyze a trader, PolyTrak generates recommended copy trading settings based on their trading patterns. Here's what each setting means:
          </p>

          <div className="grid gap-4">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Allocated Funds</h4>
                    <p className="text-sm text-muted-foreground">Total capital to dedicate to copying this trader</p>
                  </div>
                  <Badge variant="outline">$100 - $10,000</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Trade Size %</h4>
                    <p className="text-sm text-muted-foreground">Percentage of allocation to use per trade</p>
                  </div>
                  <Badge variant="outline">1% - 25%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Copy Percentage</h4>
                    <p className="text-sm text-muted-foreground">How much of the trader's position size to mirror</p>
                  </div>
                  <Badge variant="outline">10% - 100%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Exit Mode</h4>
                    <p className="text-sm text-muted-foreground">How to handle position exits</p>
                  </div>
                  <Badge variant="outline">Follow Exits / Manual</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 border-primary/20 mb-12">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-2">Ready to analyze a trader?</h3>
            <p className="text-muted-foreground mb-6">
              Enter any Polymarket wallet address and get a complete analysis in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/analyze">
                <Button size="lg">
                  Try Analyzer <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" size="lg">
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Related Links */}
        <section>
          <h3 className="font-semibold mb-4">Related Resources</h3>
          <div className="flex flex-wrap gap-2">
            <Link to="/blog">
              <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                Polymarket Tools Guide →
              </Badge>
            </Link>
            <Link to="/how-it-works">
              <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                How Copy Trading Works →
              </Badge>
            </Link>
            <Link to="/disclaimer">
              <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                Risk Disclaimer →
              </Badge>
            </Link>
          </div>
        </section>
      </article>
    </Layout>
  );
};

export default BlogFeatures;
