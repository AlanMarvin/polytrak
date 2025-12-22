import { useNavigate } from 'react-router-dom';
import { usePublicRecentAnalyses, PublicAnalysis } from '@/hooks/usePublicRecentAnalyses';
import { ThreeColorRing } from '@/components/ui/three-color-ring';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Globe, Loader2 } from 'lucide-react';

const shortenAddress = (address: string): string => {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
};

interface AnalysisItemProps {
  analysis: PublicAnalysis;
  onClick: () => void;
}

const AnalysisItem = ({ analysis, onClick }: AnalysisItemProps) => {
  const displayName = analysis.username || shortenAddress(analysis.address);
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className="relative flex items-center justify-center p-1.5 rounded-full hover:bg-card/80 transition-all group shrink-0"
            aria-label={`Analyze ${displayName}`}
          >
            {/* Avatar with tri-color ring */}
            <div className="relative w-10 h-10 flex items-center justify-center">
              <ThreeColorRing
                smartScore={analysis.smartScore}
                sharpeRatio={analysis.sharpeRatio}
                copySuitability={analysis.copySuitability}
                size={40}
                strokeWidth={3}
              />
              <div className="absolute inset-[5px]">
                <Avatar className="w-full h-full">
                  <AvatarImage src={analysis.profileImage || undefined} alt={displayName} />
                  <AvatarFallback className="text-[10px] font-mono bg-muted">
                    {analysis.address.slice(2, 4).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-card border-border">
          <div className="space-y-1.5 text-xs">
            <p className="font-mono text-muted-foreground">{analysis.address}</p>
            {analysis.username && (
              <p className="font-medium">{analysis.username}</p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Smart Score:</span>
              <span className={`font-semibold ${
                analysis.smartScore >= 70 ? 'text-green-500' : 
                analysis.smartScore >= 40 ? 'text-yellow-500' : 'text-orange-500'
              }`}>{analysis.smartScore}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Sharpe Ratio:</span>
              <span className={`font-semibold ${
                analysis.sharpeRatio >= 0.5 ? 'text-green-500' : 
                analysis.sharpeRatio >= 0 ? 'text-yellow-500' : 'text-orange-500'
              }`}>{analysis.sharpeRatio.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Copy Suitability:</span>
              <span className={`font-semibold ${
                analysis.copySuitability === 'High' ? 'text-green-500' : 
                analysis.copySuitability === 'Medium' ? 'text-yellow-500' : 'text-orange-500'
              }`}>{analysis.copySuitability}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface PublicRecentAnalysesProps {
  className?: string;
  compact?: boolean;
}

export const PublicRecentAnalyses = ({ className = '', compact = false }: PublicRecentAnalysesProps) => {
  const { analyses, loading, error } = usePublicRecentAnalyses();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">Recent public analyses</h3>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error || analyses.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">Recent public analyses</h3>
        </div>
        <p className="text-sm text-muted-foreground/60 italic">
          {error || 'No analyses yet. Be the first to analyze a wallet!'}
        </p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">Recent public analyses</h3>
      </div>
      <div className={`flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent ${compact ? 'flex-wrap' : ''}`}>
        {analyses.map((analysis) => (
          <AnalysisItem
            key={analysis.id}
            analysis={analysis}
            onClick={() => navigate(`/analyze?address=${encodeURIComponent(analysis.address)}`)}
          />
        ))}
      </div>
    </div>
  );
};
