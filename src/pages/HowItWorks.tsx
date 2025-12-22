import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ArrowRight, Brain, Target, Zap, TrendingUp,
  Shield, DollarSign, AlertTriangle, CheckCircle,
  Users, BarChart3, Settings, Wallet, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const HowItWorks = () => {
  const steps = [
    {
      step: 1,
      title: "Analyze a wallet",
      icon: BarChart3,
      description: "Paste any Polymarket wallet address into PolyTrak for instant analysis.",
      details: [
        "No login or signup required",
        "Analyzes real trading behavior, not just final PnL",
        "Examines performance, volatility, liquidity usage, frequency, and risk patterns",
        "Focuses on HOW traders behave, not just how much they made"
      ]
    },
    {
      step: 2,
      title: "Understand the results",
      icon: Brain,
      description: "Get comprehensive insights into trader behavior and risk profile.",
      details: [
        "Smart Score (0-100 quality rating)",
        "Sharpe Ratio (risk-adjusted returns)",
        "Maximum drawdown analysis",
        "Risk regime (Conservative/Moderate/Aggressive)",
        "Liquidity sensitivity warnings",
        "Bot-like or high-frequency trader flags"
      ]
    },
    {
      step: 3,
      title: "Get optimized copy settings",
      icon: Settings,
      description: "Receive AI-calculated copy trading configuration tailored to your budget.",
      details: [
        "Enter only your allocation amount",
        "Automatic % per trade calculation",
        "Risk-adjusted position sizing",
        "Advanced caps and limits",
        "Fee-aware optimization",
        "Practical settings you can actually use"
      ]
    },
    {
      step: 4,
      title: "Execute on TradeFox",
      icon: Target,
      description: "Apply the optimized settings on TheTradeFox copy trading platform.",
      details: [
        "Create free TradeFox account",
        "Manually apply PolyTrak settings",
        "TradeFox handles execution, fees, and custody",
        "Optional referral link supports PolyTrak development"
      ]
    }
  ];

  const targetUsers = [
    "Users with $500–$5,000 portfolios",
    "People who want structure, not signals",
    "Users avoiding over-copied leaderboard wallets",
    "Risk-aware traders seeking proper sizing"
  ];

  return (
    <Layout>
      <div className="container py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">How It Works</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            From Analysis to Profits:<br />
            The PolyTrak → TradeFox Flow
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Clear, step-by-step guidance on how PolyTrak helps you analyze traders
            and optimize your copy trading strategy on TradeFox.
          </p>
        </div>

        {/* Role Explanation */}
        <Card className="mb-12 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 border-primary/20">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">PolyTrak = Analysis & Configuration</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Analyzes public Polymarket wallet data</li>
                  <li>• Translates behavior into copy-trading settings</li>
                  <li>• Provides risk-aware recommendations</li>
                  <li>• <strong>DOES NOT execute trades</strong></li>
                </ul>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <Target className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold">TradeFox = Execution & Copy Trading</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Handles actual trade execution</li>
                  <li>• Manages funds and custody</li>
                  <li>• Processes fees and settlements</li>
                  <li>• Platform where copying happens</li>
                </ul>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-center font-medium">
                <strong>PolyTrak helps you decide HOW to copy, not WHO to blindly follow.</strong>
                <br />
                We focus on behavior analysis and risk-aware configuration, not leaderboard chasing.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step-by-Step Flow */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">The Complete Flow</h2>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <Card key={step.step} className="relative overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    {/* Step Number */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                        {step.step}
                      </div>
                      {index < steps.length - 1 && (
                        <div className="w-0.5 h-16 bg-border mx-auto mt-4"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <step.icon className="h-6 w-6 text-primary" />
                        <h3 className="text-xl font-semibold">{step.title}</h3>
                      </div>

                      <p className="text-muted-foreground mb-4">{step.description}</p>

                      <ul className="space-y-2">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Fees & Realism Section */}
        <Card className="mb-12 bg-yellow-500/5 border-yellow-500/30">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">Fees & Market Reality</h3>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-medium mb-2">Expected Costs</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Polymarket trading fees (2% per side)</li>
                      <li>• TradeFox platform fees</li>
                      <li>• Gas fees on Polygon/Ethereum</li>
                      <li>• Potential slippage in illiquid markets</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Common Pitfalls</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Blindly copying leaderboard wallets</li>
                      <li>• Ignoring liquidity and slippage</li>
                      <li>• Over-sizing positions</li>
                      <li>• Not accounting for fees in PnL</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-500/10 p-4 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    <strong>Reality Check:</strong> PolyTrak is designed to reduce common copy-trading mistakes,
                    not eliminate risk. Always understand what you're copying and why.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Who This Is For */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <h3 className="text-xl font-semibold mb-6 text-center">Who This Is For</h3>

            <div className="grid gap-4">
              {targetUsers.map((user, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Users className="h-5 w-5 text-primary" />
                  <span>{user}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Referral Section */}
        <Card className="mb-12 bg-green-500/5 border-green-500/30">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-green-500/20">
                <ExternalLink className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Referral Transparency</h3>
                <p className="text-muted-foreground mb-4">
                  If you sign up for TradeFox using our referral link, it helps support PolyTrak development.
                  Using the link is completely optional and doesn't change your fees or experience.
                </p>
                <Link to="https://thetradefox.com?ref=POLYTRAK" target="_blank">
                  <Button variant="outline" className="gap-2">
                    Visit TradeFox <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="bg-red-500/5 border-red-500/30">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-red-500/20">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Important Disclaimers</h3>

                <div className="space-y-3 text-sm">
                  <p>
                    <strong>No Affiliation:</strong> PolyTrak is not affiliated with Polymarket or TradeFox.
                  </p>
                  <p>
                    <strong>No Financial Advice:</strong> This is not financial or investment advice.
                  </p>
                  <p>
                    <strong>No Trade Execution:</strong> PolyTrak does not execute trades or handle funds.
                  </p>
                  <p>
                    <strong>Analytics Only:</strong> We provide analysis and configuration recommendations only.
                  </p>
                  <p>
                    <strong>Risk Warning:</strong> Trading prediction markets involves significant risk.
                    Only trade what you can afford to lose.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mt-12">
          <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-muted-foreground mb-6">
            Analyze any Polymarket trader and get AI-optimized copy trading settings for TradeFox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/analyze">
              <Button size="lg" className="gap-2">
                Start Analyzing <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/blog">
              <Button variant="outline" size="lg">
                Read Our Blog
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HowItWorks;
