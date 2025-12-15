import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Market } from '@/types/polymarket';
import { Link } from 'react-router-dom';
import { Clock, TrendingUp } from 'lucide-react';

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const formatVolume = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const yesPrice = market.outcomes.find(o => o.name === 'Yes')?.price || 0;

  return (
    <Card className="glass-card hover:border-primary/30 transition-all duration-300 group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <Badge variant="secondary" className="text-xs">
            {market.category}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDate(market.endDate)}
          </div>
        </div>

        <h3 className="font-semibold leading-tight mb-4 group-hover:text-primary transition-colors line-clamp-2">
          {market.title}
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-success">
                {(yesPrice * 100).toFixed(0)}¢
              </p>
              <p className="text-xs text-muted-foreground">Yes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-destructive">
                {((1 - yesPrice) * 100).toFixed(0)}¢
              </p>
              <p className="text-xs text-muted-foreground">No</p>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span className="text-sm font-mono">{formatVolume(market.volume)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Volume</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
