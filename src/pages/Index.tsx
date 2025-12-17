import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { Search, Brain, Sparkles, Target, ArrowRight, Zap, TrendingUp, Shield, Settings, BarChart3, Wallet, Copy, DollarSign, AlertTriangle, ChevronUp } from 'lucide-react';
import tradeFoxLogo from '@/assets/tradefox-logo.png';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleAnalyze = () => {
    if (searchQuery.trim()) {
      navigate(`/analyze?address=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Auto-play carousel
  useEffect(() => {
    if (!carouselApi) return;

    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, 4000);

    carouselApi.on('select', () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    });

    return () => clearInterval(interval);
  }, [carouselApi]);

  const features = [
    { label: 'AI-Powered Analysis', description: 'Smart algorithms analyze trader performance', icon: Brain, useLogo: false },
    { label: 'Optimized Settings', description: 'Auto-calculate ideal copy trading config for TheTradeFox', icon: null, useLogo: true },
    { label: 'Personalized Strategy', description: 'Tailored to your risk & budget', icon: Sparkles, useLogo: false },
  ];

  const previewSlides = [
    {
      title: 'Smart Score Rating',
      description: 'AI-calculated quality score based on profitability, consistency, and risk management',
      icon: Brain,
      preview: (
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="37.68" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">85</span>
            </div>
          </div>
          <span className="text-sm text-muted-foreground">out of 100</span>
        </div>
      ),
    },
    {
      title: 'PnL Performance Chart',
      description: 'Visualize historical profit and loss across the trader\'s entire career',
      icon: TrendingUp,
      preview: (
        <div className="w-full h-32 flex items-end gap-1 px-4">
          {[20, 35, 25, 45, 40, 55, 50, 70, 65, 85, 75, 95].map((height, i) => (
            <div 
              key={i} 
              className="flex-1 bg-gradient-to-t from-primary/50 to-primary rounded-t transition-all"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      ),
    },
    {
      title: 'AI-Optimized Copy Settings',
      description: 'Personalized configuration calculated for your specific budget and risk tolerance',
      icon: Settings,
      preview: (
        <div className="space-y-3 w-full max-w-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
            <span className="text-sm text-muted-foreground">% Size per trade</span>
            <span className="font-mono font-semibold text-primary">15%</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
            <span className="text-sm text-muted-foreground">% of trade to copy</span>
            <span className="font-mono font-semibold text-primary">35%</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
            <span className="text-sm text-muted-foreground">Follow exits</span>
            <span className="font-mono font-semibold text-green-500">Enabled</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Risk Analysis',
      description: 'Understand risk-adjusted returns with Sharpe ratio and max drawdown estimates',
      icon: Shield,
      preview: (
        <div className="space-y-3 w-full max-w-xs">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
              <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-500">Excellent</span>
            </div>
            <span className="text-2xl font-bold text-green-500">1.85</span>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Est. Max Drawdown</span>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </div>
            <span className="text-2xl font-bold">-12.5%</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Fee Impact Analysis',
      description: 'See how TradeFox fees affect your expected returns before you start copying',
      icon: DollarSign,
      preview: (
        <div className="space-y-3 w-full max-w-xs">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="font-semibold text-green-500">Low Fee Impact</span>
            </div>
            <p className="text-xs text-muted-foreground">Fees represent less than 5% of expected returns</p>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
            <ChevronUp className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Higher tiers unlock better cashback</span>
          </div>
        </div>
      ),
    },
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
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/video/hero-bg.mp4" type="video/mp4" />
        </video>
        
        {/* Heavy dark overlay */}
        <div className="absolute inset-0 bg-black/75" />
        
        {/* Gradient effects on top */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl" />
        
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
                {feature.useLogo ? (
                  <img src={tradeFoxLogo} alt="TheTradeFox" className="h-10 w-auto mx-auto mb-3" />
                ) : (
                  feature.icon && <feature.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                )}
                <div className="font-semibold mb-1">{feature.label}</div>
                <div className="text-sm text-muted-foreground">{feature.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You'll Discover Carousel Section */}
      <section className="container py-16 border-b border-border/50">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What You'll Discover</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Comprehensive analysis for smarter copy trading decisions
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-8 md:px-12">
          <Carousel
            setApi={setCarouselApi}
            opts={{ align: 'center', loop: true }}
            className="w-full"
          >
            <CarouselContent>
              {previewSlides.map((slide, index) => (
                <CarouselItem key={slide.title} className="md:basis-full">
                  <Card className="p-6 md:p-8 bg-card/80 border-border/50 hover:border-primary/30 transition-all min-h-[360px] flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 rounded-lg bg-primary/10">
                        <slide.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl">{slide.title}</h3>
                        <p className="text-sm text-muted-foreground">{slide.description}</p>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      {slide.preview}
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {previewSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => carouselApi?.scrollTo(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentSlide === index 
                    ? 'bg-primary w-6' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
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
