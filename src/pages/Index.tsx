import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { RotatingWord } from '@/components/ui/rotating-word';
import { Search, Brain, Sparkles, Target, ArrowRight, Zap, TrendingUp, Shield, Settings, BarChart3, Wallet, Copy, Activity, Droplets, CheckCircle } from 'lucide-react';
import tradeFoxLogo from '@/assets/tradefox-logo.png';
import polycopLogo from '@/assets/polycop-logo.png';
import { RecentSearches } from '@/components/home/RecentSearches';
import { PublicRecentAnalyses } from '@/components/analyze/PublicRecentAnalyses';
import { SEOHead } from '@/components/seo/SEOHead';

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

  // Auto-play carousel every 5 seconds
  useEffect(() => {
    if (!carouselApi) return;

    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, 5000);

    carouselApi.on('select', () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    });

    return () => clearInterval(interval);
  }, [carouselApi]);

  const features = [
    { label: 'AI-Powered Analysis', description: 'AI analyzes real Polymarket trading history, profitability, and risk behavior.', icon: Brain, useLogo: false },
    { label: 'Optimized Settings', description: 'Automatically calculates optimal copy-trading settings tailored for TheTradeFox execution.', icon: null, useLogo: "tradefox" },
    { label: 'Personalized Strategy', description: 'Adapts position sizing, exits, and exposure for PolyCop and TradeFox based on risk tolerance.', icon: null, useLogo: "polycop" },
  ];

  const previewSlides = [
    {
      title: 'Smart Score Rating',
      description: 'PolyTrak assigns each Polymarket trader a Smart Score based on profitability, consistency, and risk management — not just raw profit.',
      icon: Brain,
      bullets: [
        'Combines multiple performance metrics into a single score',
        'Penalizes excessive drawdowns and unstable strategies',
        'Designed to reflect copy-trading suitability, not hype',
      ],
      preview: (
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="37.68" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">85</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">Risk-adjusted performance score</span>
        </div>
      ),
    },
    {
      title: 'Trader Efficiency (ROV)',
      description: 'Understand how efficiently traders make money using Return on Volume (ROV) — profit per dollar traded — instead of misleading total PnL.',
      icon: TrendingUp,
      bullets: [
        'Filters out high-volume churn strategies',
        'Highlights traders with real edge and execution discipline',
        'Essential for identifying copy-worthy traders',
      ],
      preview: (
        <div className="space-y-2 w-full max-w-[200px]">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <div className="text-xs text-muted-foreground mb-1">Return on Volume</div>
            <span className="text-xl font-bold text-primary">8.2%</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Profit per $ traded</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Exit Behavior',
      description: 'See whether profits come from holding to resolution or from smart partial exits — a critical factor for successful copy trading.',
      icon: Activity,
      bullets: [
        'Identifies partial exit vs full-hold strategies',
        'Explains why many profitable traders copy poorly',
        'Directly informs proportional vs mirror exit logic',
      ],
      preview: (
        <div className="space-y-2 w-full max-w-[200px]">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border/50">
            <span className="text-xs text-muted-foreground">Partial Exits</span>
            <span className="font-mono text-sm font-semibold text-primary">68%</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border/50">
            <span className="text-xs text-muted-foreground">Hold to Resolution</span>
            <span className="font-mono text-sm font-semibold">32%</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
            <span className="text-xs text-yellow-500">Use proportional exit mode</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Liquidity & Execution',
      description: 'Identify traders whose strategies survive real-world liquidity constraints, slippage, and execution delays.',
      icon: Droplets,
      bullets: [
        'Analyzes market liquidity sensitivity',
        'Flags strategies that break when copied',
        'Helps avoid slippage-driven losses',
      ],
      preview: (
        <div className="space-y-2 w-full max-w-[200px]">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Liquidity Score</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-500">Good</span>
            </div>
            <span className="text-xl font-bold text-green-500">High</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
            <Droplets className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Low slippage risk</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Copy Readiness',
      description: 'Get AI-optimized copy trading settings designed specifically for TheTradeFox and real execution conditions.',
      icon: Settings,
      bullets: [
        'Auto-configured position sizing',
        'Exit mode selection (proportional / mirror / optimized)',
        'Risk-adjusted settings based on trader behavior and your budget',
      ],
      preview: (
        <div className="space-y-2 w-full max-w-[200px]">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border/50">
            <span className="text-xs text-muted-foreground">Trade Size</span>
            <span className="font-mono text-sm font-semibold text-primary">15%</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border/50">
            <span className="text-xs text-muted-foreground">Exit Mode</span>
            <span className="font-mono text-sm font-semibold text-primary">Proportional</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-green-500/10 border border-green-500/30">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs text-green-500">Ready for TradeFox</span>
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
      <SEOHead
        title="PolyTrak | Polymarket Trader Analytics & TradeFox Copy Settings"
        description="Analyze any Polymarket wallet with ROV, exits, and liquidity signals. Get risk-adjusted copy settings for TradeFox to mirror traders with fewer surprises."
        canonicalUrl="/"
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">

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

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight flex flex-col items-center gap-2 md:gap-3">
              <span>Let AI find</span>
              <span className="inline-flex items-center justify-center text-primary">
                <RotatingWord
                  words={["recommended", "risk-adjusted", "starting", "suggested", "optimized"]}
                  interval={2500}
                  reducedMotionFallbackIndex={3}
                />
              </span>
              <span>settings for copy trading</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Analyze any Polymarket wallet, let AI calculate the best copy-trading settings, and mirror traders with risk-adjusted performance on <span className="text-primary font-semibold">TheTradeFox</span>.
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
                {feature.useLogo === "tradefox" ? (
                  <img src={tradeFoxLogo} alt="TheTradeFox" className="h-10 w-auto mx-auto mb-3" />
                ) : feature.useLogo === "polycop" ? (
                  <img src={polycopLogo} alt="PolyCop" className="h-10 w-auto mx-auto mb-3" />
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

      {/* Public Recent Analyses Section */}
      <section className="container py-8 border-b border-border/50">
        <PublicRecentAnalyses />
      </section>

      {/* Recent Searches Section */}
      <RecentSearches />

      {/* Demo Video Section */}
      <section className="container py-16 border-b border-border/50">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How these settings are generated</h2>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
            <video
              autoPlay
              loop
              muted
              playsInline
              controls
              className="w-full h-[600px] object-cover"
            >
              <source src="/video/demo-video.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      {/* What You'll Discover Carousel Section */}
      <section className="container py-16 border-b border-border/50">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why PolyTrak Is Different</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Real Polymarket trader analysis with ROV, liquidity signals, and risk-adjusted copy trading metrics
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-8 md:px-12">
          <Carousel
            setApi={setCarouselApi}
            opts={{ align: 'center', loop: true }}
            className="w-full"
          >
            <CarouselContent>
              {previewSlides.map((slide) => (
                <CarouselItem key={slide.title} className="md:basis-full">
                  <Card className="p-6 md:p-8 bg-card/80 border-border/50 hover:border-primary/30 transition-all min-h-[380px]">
                    <div className="grid md:grid-cols-2 gap-6 h-full">
                      {/* Left: Text content */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2.5 rounded-lg bg-primary/10">
                            <slide.icon className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="font-semibold text-xl">{slide.title}</h3>
                        </div>
                        <p className="text-muted-foreground mb-4">{slide.description}</p>
                        <ul className="space-y-2 mt-auto">
                          {slide.bullets.map((bullet, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {/* Right: Visual preview */}
                      <div className="flex items-center justify-center">
                        {slide.preview}
                      </div>
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
                className={`w-2 h-2 rounded-full transition-all ${currentSlide === index
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
          <Link to="/how-it-works" className="hover:text-primary transition-colors">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          </Link>
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
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 p-8 md:p-12">
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
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative text-center space-y-4 max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold">
              Ready to copy traders with data, not guesswork?
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
