import { useMemo, useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Database, Brain, TrendingUp, BarChart3, 
  Wallet, Activity,
  Settings, Star, LineChart, AlertTriangle, Info
} from 'lucide-react';

type StageStatus = 'idle' | 'pending' | 'success' | 'error';

export type LoadingStages = {
  profile?: StageStatus;
  openPositions?: StageStatus;
  closedPositionsSummary?: StageStatus;
  recentTrades?: StageStatus;
  full?: StageStatus;
};

const loadingSteps = [
  { key: "profile", icon: Database, message: "Connecting to Polymarket...", minProgress: 0 },
  { key: "profile", icon: Wallet, message: "Fetching wallet profile...", minProgress: 10 },
  { key: "openPositions", icon: Activity, message: "Loading open positions...", minProgress: 35 },
  { key: "closedPositionsSummary", icon: TrendingUp, message: "Calculating PnL metrics...", minProgress: 55 },
  { key: "recentTrades", icon: BarChart3, message: "Retrieving recent trades...", minProgress: 75 },
  { key: "full", icon: Brain, message: "Loading full history (optional)...", minProgress: 90 },
] as const;

const educationalTooltips = [
  "High win rate doesn't always mean low risk — trade size matters.",
  "Most copy-trading losses come from poor position sizing.",
  "Liquidity affects whether small accounts can follow large traders.",
  "Polytrak.io focuses on configuration, not signals.",
  "These settings are tailored to your chosen allocation.",
  "Polymarket predictions are ~90–95% accurate near resolution — market prices are statistically meaningful signals.",
  "Short-term predictions (within hours of resolution) reach ~90–94% accuracy.",
  "Longer horizons (~1 week or 1 month) still show ~88–91% accuracy.",
  "Markets with high volume tend to be more accurate.",
  "Copying 100% of a trader's size is rarely optimal.",
];

const previewCards = [
  {
    icon: Settings,
    title: "AI-Optimized Copy Settings",
    bullets: ["% bankroll per trade", "% of each trade to copy", "Suggested allocation range"],
    micro: "Built from real wallet behavior."
  },
  {
    icon: Star,
    title: "Smart Score",
    bullets: ["Consistency", "Risk discipline", "Trade frequency"],
    micro: "A simple score for copy-worthiness."
  },
  {
    icon: LineChart,
    title: "Sharpe Ratio & Drawdown",
    bullets: ["Risk-adjusted performance", "Estimated max drawdown"],
    micro: "Profit alone isn't the whole story."
  },
  {
    icon: AlertTriangle,
    title: "Execution Risk",
    bullets: ["Min buy size risk", "Liquidity sensitivity", "Skipped trade likelihood"],
    micro: "Avoid surprises when copying."
  },
];

export function LoadingProgress({ stages }: { stages?: LoadingStages }) {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tooltipIndex, setTooltipIndex] = useState(0);
  const [tooltipVisible, setTooltipVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const computed = useMemo(() => {
    if (!stages) return null;

    const requiredKeys: Array<keyof LoadingStages> = [
      "profile",
      "openPositions",
      "closedPositionsSummary",
      "recentTrades",
    ];

    const requiredDone = requiredKeys.filter((k) => stages[k] === "success").length;
    const requiredTotal = requiredKeys.length;
    const requiredPct = Math.round((requiredDone / requiredTotal) * 100);

    // Show the first non-success stage as current; fall back to last step.
    const currentKey =
      requiredKeys.find((k) => stages[k] !== "success") ||
      (stages.full ? "full" : "recentTrades");

    const stepIndex = loadingSteps.findIndex((s) => s.key === currentKey);
    return {
      requiredPct,
      stepIndex: stepIndex === -1 ? 0 : stepIndex,
      currentKey,
      includeFull: Boolean(stages.full),
    };
  }, [stages]);

  useEffect(() => {
    // If we have real stage signals, derive progress from them.
    if (computed) {
      setCurrentStepIndex(computed.stepIndex);

      // Cap progress at 95% until the required stages are done.
      const target = computed.requiredPct >= 100 ? 95 : Math.min(95, computed.requiredPct);
      setProgress((prev) => {
        if (prev >= target) return prev;
        return Math.min(target, prev + 2);
      });
      return;
    }

    // Fallback: simulated progress (legacy behavior)
    const interval = setInterval(() => {
      setProgress(prev => {
        const increment = Math.random() * 2 + 0.5;
        const newProgress = Math.min(prev + increment, 95);
        
        const newStepIndex = loadingSteps.findIndex(
          (step, idx) => 
            step.minProgress <= newProgress && 
            (loadingSteps[idx + 1]?.minProgress ?? 100) > newProgress
        );
        if (newStepIndex !== -1 && newStepIndex !== currentStepIndex) {
          setCurrentStepIndex(newStepIndex);
        }
        
        return newProgress;
      });
    }, 600 + Math.random() * 400);

    return () => clearInterval(interval);
  }, [currentStepIndex, computed]);

  // Rotating tooltips
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setTooltipVisible(false);
      setTimeout(() => {
        setTooltipIndex(prev => (prev + 1) % educationalTooltips.length);
        setTooltipVisible(true);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const CurrentIcon = loadingSteps[currentStepIndex]?.icon || Database;
  const currentMessage = loadingSteps[currentStepIndex]?.message || "Loading...";

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Main Progress Card */}
      <Card className="glass-card max-w-lg mx-auto">
        <CardContent className="p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                <CurrentIcon className="h-8 w-8 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Analyzing Trader
              </h3>
              <p className="text-sm text-muted-foreground animate-pulse">
                {currentMessage}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {loadingSteps.slice(0, 4).map((step, idx) => {
              const StepIcon = step.icon;
              const isComplete = progress >= (loadingSteps[idx + 1]?.minProgress || 100);
              const isActive = currentStepIndex === idx;
              
              return (
                <div 
                  key={idx}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                    isComplete 
                      ? 'bg-primary/20 text-primary' 
                      : isActive 
                        ? 'bg-primary/10 text-primary animate-pulse' 
                        : 'bg-muted/30 text-muted-foreground'
                  }`}
                >
                  <StepIcon className="h-4 w-4 mb-1" />
                  <span className="text-[10px] text-center leading-tight">
                    {step.message.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Rotating Educational Tooltips */}
      <div 
        className="text-center"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 border border-border/50">
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
          <p 
            className={`text-sm text-muted-foreground transition-opacity duration-300 ${
              tooltipVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {educationalTooltips[tooltipIndex]}
          </p>
        </div>
      </div>

      {/* What You'll Get Section */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-semibold text-foreground">What you'll get</h3>
          <p className="text-sm text-muted-foreground">
            Polytrak.io turns wallet history into copy-trading settings you can actually use.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {previewCards.map((card, idx) => {
            const CardIcon = card.icon;
            return (
              <Card key={idx} className="bg-card/50 border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CardIcon className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="font-medium text-sm text-foreground">{card.title}</h4>
                  </div>
                  <ul className="space-y-1">
                    {card.bullets.map((bullet, bulletIdx) => (
                      <li key={bulletIdx} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-primary/50" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-muted-foreground/70 italic">{card.micro}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
