import { useNavigate } from 'react-router-dom';
import { useRecentSearches, RecentSearch } from '@/hooks/useRecentSearches';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { History } from 'lucide-react';

// Color mapping for the 3-segment ring
const getSmartScoreColor = (score: number): string => {
  if (score >= 70) return 'hsl(var(--success))';
  if (score >= 40) return 'hsl(48 96% 53%)'; // yellow
  return 'hsl(25 95% 53%)'; // orange
};

const getSharpeColor = (ratio: number | null): string => {
  if (ratio === null || ratio < 0) return 'hsl(25 95% 53%)'; // orange
  if (ratio >= 0.5) return 'hsl(var(--success))';
  return 'hsl(48 96% 53%)'; // yellow
};

const getCopySuitabilityColor = (rating: 'Low' | 'Medium' | 'High'): string => {
  if (rating === 'High') return 'hsl(var(--success))';
  if (rating === 'Medium') return 'hsl(48 96% 53%)'; // yellow
  return 'hsl(25 95% 53%)'; // orange
};

const shortenAddress = (address: string): string => {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
};

interface ThreeColorRingProps {
  smartScore: number;
  sharpeRatio: number;
  copySuitability: 'Low' | 'Medium' | 'High';
  size?: number;
}

const ThreeColorRing = ({ smartScore, sharpeRatio, copySuitability, size = 52 }: ThreeColorRingProps) => {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const segmentLength = circumference / 3;
  
  const color1 = getSmartScoreColor(smartScore);
  const color2 = getSharpeColor(sharpeRatio);
  const color3 = getCopySuitabilityColor(copySuitability);
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      {/* Segment 1: Smart Score (left) */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color1}
        strokeWidth={strokeWidth}
        strokeDasharray={`${segmentLength} ${circumference}`}
        strokeDashoffset={0}
        strokeLinecap="round"
      />
      {/* Segment 2: Sharpe Ratio (middle) */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color2}
        strokeWidth={strokeWidth}
        strokeDasharray={`${segmentLength} ${circumference}`}
        strokeDashoffset={-segmentLength}
        strokeLinecap="round"
      />
      {/* Segment 3: Copy Suitability (right) */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color3}
        strokeWidth={strokeWidth}
        strokeDasharray={`${segmentLength} ${circumference}`}
        strokeDashoffset={-segmentLength * 2}
        strokeLinecap="round"
      />
    </svg>
  );
};

interface WalletCircleProps {
  search: RecentSearch;
  onClick: () => void;
}

const WalletCircle = ({ search, onClick }: WalletCircleProps) => {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="relative w-[52px] h-[52px] flex items-center justify-center transition-transform group-hover:scale-110">
              <ThreeColorRing
                smartScore={search.smartScore}
                sharpeRatio={search.sharpeRatio}
                copySuitability={search.copySuitability}
              />
              {/* Inner circle with initials */}
              <div className="absolute inset-[6px] rounded-full bg-card flex items-center justify-center">
                <span className="text-xs font-mono text-muted-foreground">
                  {search.address.slice(2, 4).toUpperCase()}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">
              {shortenAddress(search.address)}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-card border-border">
          <div className="space-y-1.5 text-xs">
            <p className="font-mono text-muted-foreground">{shortenAddress(search.address)}</p>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Smart Score:</span>
              <span className={`font-semibold ${
                search.smartScore >= 70 ? 'text-green-500' : 
                search.smartScore >= 40 ? 'text-yellow-500' : 'text-orange-500'
              }`}>{search.smartScore}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Sharpe Ratio:</span>
              <span className={`font-semibold ${
                search.sharpeRatio >= 0.5 ? 'text-green-500' : 
                search.sharpeRatio >= 0 ? 'text-yellow-500' : 'text-orange-500'
              }`}>{search.sharpeRatio.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Copy Suitability:</span>
              <span className={`font-semibold ${
                search.copySuitability === 'High' ? 'text-green-500' : 
                search.copySuitability === 'Medium' ? 'text-yellow-500' : 'text-orange-500'
              }`}>{search.copySuitability}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const RecentSearches = () => {
  const { recentSearches } = useRecentSearches();
  const navigate = useNavigate();

  if (recentSearches.length === 0) {
    return (
      <section className="container py-8">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-muted-foreground">Recent searches</h2>
        </div>
        <p className="text-sm text-muted-foreground/60 italic">
          Analyze a wallet to see it appear here.
        </p>
      </section>
    );
  }

  return (
    <section className="container py-8">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-medium text-muted-foreground">Recent searches</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {recentSearches.map((search) => (
          <WalletCircle
            key={search.address}
            search={search}
            onClick={() => navigate(`/analyze?address=${encodeURIComponent(search.address)}`)}
          />
        ))}
      </div>
    </section>
  );
};
