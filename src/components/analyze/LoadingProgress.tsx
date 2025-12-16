import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Database, Brain, TrendingUp, BarChart3, 
  Wallet, Activity, Calculator, Zap 
} from 'lucide-react';

const loadingSteps = [
  { icon: Database, message: "Connecting to Polymarket...", minProgress: 0 },
  { icon: Wallet, message: "Fetching wallet data...", minProgress: 10 },
  { icon: Activity, message: "Loading open positions...", minProgress: 25 },
  { icon: BarChart3, message: "Retrieving trade history...", minProgress: 40 },
  { icon: TrendingUp, message: "Calculating PnL metrics...", minProgress: 55 },
  { icon: Calculator, message: "Computing win rate...", minProgress: 70 },
  { icon: Brain, message: "AI analyzing trading patterns...", minProgress: 80 },
  { icon: Zap, message: "Calculating Sharpe ratio...", minProgress: 90 },
];

export function LoadingProgress() {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        // Random increment between 2-8%
        const increment = Math.random() * 6 + 2;
        const newProgress = Math.min(prev + increment, 95);
        
        // Update step based on progress
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
    }, 300 + Math.random() * 200);

    return () => clearInterval(interval);
  }, [currentStepIndex]);

  const CurrentIcon = loadingSteps[currentStepIndex]?.icon || Database;
  const currentMessage = loadingSteps[currentStepIndex]?.message || "Loading...";

  return (
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
  );
}
