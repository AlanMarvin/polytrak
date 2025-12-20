import { useNavigate } from 'react-router-dom';
import { useRecentSearches, RecentSearch } from '@/hooks/useRecentSearches';
import { ThreeColorRing } from '@/components/ui/three-color-ring';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { History } from 'lucide-react';

const shortenAddress = (address: string): string => {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
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
