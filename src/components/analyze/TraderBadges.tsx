import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';
import { TrendingDown, Ticket, Award, Lightbulb } from 'lucide-react';

interface Position {
    id: string;
    marketTitle: string;
    outcome: string;
    size: number;
    avgPrice: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
    initialValue: number;
    currentValue: number;
    slug?: string;
    icon?: string;
}

interface TraderBadgesProps {
    openPositions: Position[];
    closedPositions: number;
    totalPositions: number;
}

interface BadgeData {
    id: string;
    name: string;
    icon: React.ReactNode;
    value: string | number;
    subtitle: string;
    tooltip: string;
    color: string;
    bgColor: string;
    borderColor: string;
    dimmed: boolean; // true if value is 0 or condition not met
}

export function TraderBadges({ openPositions, closedPositions, totalPositions }: TraderBadgesProps) {
    const badges = useMemo((): BadgeData[] => {
        const positions = openPositions || [];
        const totalPos = totalPositions || positions.length;

        // 1. Contrarian - % of entries priced < 0.5
        const contrarianCount = positions.filter(p => p.avgPrice < 0.5).length;
        const contrarianPercent = totalPos > 0 ? (contrarianCount / totalPos) * 100 : 0;

        // 2. Reverse Cramer - Entries placed >0.8 now trading <0.1
        const reverseCramerCount = positions.filter(p => p.avgPrice > 0.8 && p.currentPrice < 0.1).length;

        // 3. Lottery Ticket - Entries placed <0.2 now trading >0.9
        const lotteryCount = positions.filter(p => p.avgPrice < 0.2 && p.currentPrice > 0.9).length;

        // 4. Experience Level
        let experienceLevel = 'Novice';
        let experienceThreshold = '100+';
        if (totalPos >= 1000) {
            experienceLevel = 'Whale';
            experienceThreshold = '1000+';
        } else if (totalPos >= 500) {
            experienceLevel = 'Expert';
            experienceThreshold = '500+';
        } else if (totalPos >= 100) {
            experienceLevel = 'Intermediate';
            experienceThreshold = '100+';
        }

        return [
            {
                id: 'contrarian',
                name: 'Contrarian',
                icon: <Lightbulb className="h-4 w-4" />,
                value: `${contrarianPercent.toFixed(1)}%`,
                subtitle: 'of entries priced < 0.5',
                tooltip: 'Percentage of positions where the trader bought at odds below 50%. A high percentage indicates a tendency to bet on underdogs or less popular outcomes.',
                color: contrarianPercent > 40 ? 'text-purple-400' : 'text-muted-foreground',
                bgColor: contrarianPercent > 40 ? 'bg-purple-500/10' : 'bg-muted/30',
                borderColor: contrarianPercent > 40 ? 'border-purple-500/30' : 'border-border/50',
                dimmed: contrarianPercent <= 20,
            },
            {
                id: 'reverse-cramer',
                name: 'Reverse Cramer',
                icon: <TrendingDown className="h-4 w-4" />,
                value: reverseCramerCount,
                subtitle: 'Entries placed >0.8 now trading <0.1',
                tooltip: 'Positions where the trader bought at high confidence (>80%) but the market has since collapsed (<10%). Named after the infamous "inverse Cramer" strategy. More = worse timing.',
                color: reverseCramerCount > 0 ? 'text-red-400' : 'text-muted-foreground',
                bgColor: reverseCramerCount > 0 ? 'bg-red-500/10' : 'bg-muted/30',
                borderColor: reverseCramerCount > 0 ? 'border-red-500/30' : 'border-border/50',
                dimmed: reverseCramerCount === 0,
            },
            {
                id: 'lottery-ticket',
                name: 'Lottery Ticket',
                icon: <Ticket className="h-4 w-4" />,
                value: lotteryCount,
                subtitle: 'Entries placed <0.2 now trading >0.9',
                tooltip: 'Positions where the trader bought cheap long shots (<20%) that are now almost certain to win (>90%). These are the big wins from unlikely bets.',
                color: lotteryCount > 0 ? 'text-green-400' : 'text-muted-foreground',
                bgColor: lotteryCount > 0 ? 'bg-green-500/10' : 'bg-muted/30',
                borderColor: lotteryCount > 0 ? 'border-green-500/30' : 'border-border/50',
                dimmed: lotteryCount === 0,
            },
            {
                id: 'experience',
                name: experienceLevel,
                icon: <Award className="h-4 w-4" />,
                value: `${experienceThreshold}`,
                subtitle: `Total positions: ${totalPos}`,
                tooltip: `Experience level based on total trading history. Novice: <100, Intermediate: 100-499, Expert: 500-999, Whale: 1000+. This trader has ${totalPos} total positions.`,
                color: totalPos >= 500 ? 'text-yellow-400' : totalPos >= 100 ? 'text-orange-400' : 'text-gray-400',
                bgColor: totalPos >= 500 ? 'bg-yellow-500/10' : totalPos >= 100 ? 'bg-orange-500/10' : 'bg-muted/30',
                borderColor: totalPos >= 500 ? 'border-yellow-500/30' : totalPos >= 100 ? 'border-orange-500/30' : 'border-border/50',
                dimmed: false,
            },
        ];
    }, [openPositions, totalPositions]);

    return (
        <Card className="glass-card mb-8">
            <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold text-muted-foreground">Trader Badges</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {badges.map((badge) => (
                        <HoverCard key={badge.id}>
                            <HoverCardTrigger asChild>
                                <div
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg ${badge.bgColor} border ${badge.borderColor} cursor-pointer hover:opacity-80 transition-all ${badge.dimmed ? 'opacity-50' : ''}`}
                                >
                                    <span className={badge.color}>{badge.icon}</span>
                                    <div className="flex flex-col min-w-0">
                                        <span className={`text-sm font-bold ${badge.color}`}>{badge.name}</span>
                                        <span className={`text-lg font-mono font-bold ${badge.color}`}>{badge.value}</span>
                                    </div>
                                </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80 z-50" side="top">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className={badge.color}>{badge.icon}</span>
                                        <span className={`font-semibold ${badge.color}`}>{badge.name}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground italic">{badge.subtitle}</p>
                                    <p className="text-sm text-muted-foreground">{badge.tooltip}</p>
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
