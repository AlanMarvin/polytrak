// Color mapping for the 3-segment ring
export const getSmartScoreColor = (score: number): string => {
  if (score >= 70) return 'hsl(var(--success))';
  if (score >= 40) return 'hsl(48 96% 53%)'; // yellow
  return 'hsl(25 95% 53%)'; // orange
};

export const getSharpeColor = (ratio: number | null): string => {
  if (ratio === null || ratio < 0) return 'hsl(25 95% 53%)'; // orange
  if (ratio >= 0.5) return 'hsl(var(--success))';
  return 'hsl(48 96% 53%)'; // yellow
};

export const getCopySuitabilityColor = (rating: 'Low' | 'Medium' | 'High'): string => {
  if (rating === 'High') return 'hsl(var(--success))';
  if (rating === 'Medium') return 'hsl(48 96% 53%)'; // yellow
  return 'hsl(25 95% 53%)'; // orange
};

interface ThreeColorRingProps {
  smartScore: number;
  sharpeRatio: number;
  copySuitability: 'Low' | 'Medium' | 'High';
  size?: number;
  strokeWidth?: number;
}

export const ThreeColorRing = ({ 
  smartScore, 
  sharpeRatio, 
  copySuitability, 
  size = 52,
  strokeWidth = 4 
}: ThreeColorRingProps) => {
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
