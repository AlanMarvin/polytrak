import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Brain, Sparkles, Target, ArrowRight, Zap, TrendingUp, Shield, Settings, BarChart3, Wallet, Copy } from 'lucide-react';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = () => {
    if (searchQuery.trim()) {
      navigate(`/analyze?address=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const features = [
    { label: 'AI-Powered Analysis', description: 'Smart algorithms analyze trader performance', icon: Brain },
    { label: 'Optimized Settings', description: 'Auto-calculate ideal copy trading config', icon: Target },
    { label: 'Personalized Strategy', description: 'Tailored to your risk & budget', icon: Sparkles },
  ];

  const howItWorks = [
    { 
      step: '1', 
      title: 'Paste Wallet Address', 
      description: 'Enter any Polymarket trader wallet address to start the analysis',
      icon: Wallet 
    },
    { 
      step: '2', 
      title: 'AI Analyzes Performance', 
      description: 'Our AI evaluates win rate, Sharpe ratio, PnL history, and trading patterns',
      icon: BarChart3 
    },
    { 
      step: '3', 
      title: 'Get Optimized Settings', 
      description: 'Receive personalized copy trading configuration based on your budget',
      icon: Settings 
    },
    { 
      step: '4', 
      title: 'Copy on TheTradeFox', 
      description: 'Use the recommended settings to start copy trading with confidence',
      icon: Copy 
    },
  ];

  const aiFeatures = [
    {
      title: 'Smart Score Rating',
      description: 'AI calculates a 0-100 score based on profitability, consistency, and risk management',
      icon: Brain,
    },
    {
      title: 'Sharpe Ratio Analysis',
      description: 'Understand risk-adjusted returns to identify truly skilled traders vs lucky ones',
      icon: TrendingUp,
    },
    {
      title: 'Kelly Criterion Sizing',
      description: 'Mathematically optimal position sizing calculated for your specific bankroll',
      icon: Target,
    },
    {
      title: 'Risk Assessment',
      description: 'Get estimated max drawdown and expected returns before you commit funds',
      icon: Shield,
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        {/* Background gradient effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container relative py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary">
              <Zap className="h-4 w-4" />
              <span>AI-Powered Copy Trading Optimization</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Let AI find the <span className="text-primary">perfect settings</span> for copy trading
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Analyze any Polymarket wallet, get AI-optimized copy trading configuration, and start mirroring profitable traders on <span className="text-primary font-semibold">TheTradeFox</span>.
            </p>

            {/* Search Bar */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }}
              className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto pt-4"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Paste wallet address to analyze..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-border/50 font-mono"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-6" disabled={!searchQuery.trim()}>
                Analyze <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* AI Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto mt-12 md:mt-16">
            {features.map((feature) => (
              <div 
                key={feature.label} 
                className="text-center p-5 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <feature.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                <div className="font-semibold mb-1">{feature.label}</div>
                <div className="text-sm text-muted-foreground">{feature.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From wallet address to optimized copy trading in 4 simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {howItWorks.map((item, index) => (
            <Card key={item.step} className="relative p-6 bg-card/50 border-border/50 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                {item.step}
              </div>
              <item.icon className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
              {index < howItWorks.length - 1 && (
                <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground/30" />
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* AI Analysis Features Section */}
      <section className="container py-16 border-t border-border/50">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-sm text-accent mb-4">
            <Brain className="h-4 w-4" />
            <span>Advanced AI Analysis</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our AI Analyzes</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Deep analysis of trading patterns to give you the best copy trading configuration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {aiFeatures.map((feature) => (
            <Card key={feature.title} className="p-6 bg-card/50 border-border/50 hover:border-accent/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-accent/10">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container pb-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border border-primary/20 p-8 md:p-12">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative text-center space-y-4 max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold">
              Ready to copy the best traders?
            </h3>
            <p className="text-muted-foreground">
              Analyze any Polymarket wallet and get AI-optimized settings for TheTradeFox copy trading.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button 
                size="lg" 
                className="min-w-[180px]"
                onClick={() => document.querySelector('input')?.focus()}
              >
                <Search className="mr-2 h-4 w-4" />
                Start Analyzing
              </Button>
              <a 
                href="https://thetradefox.com?ref=POLYTRAK" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="min-w-[180px]">
                  Visit TheTradeFox
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
