import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface SegmentedControlProps {
  options: Array<{ label: string; value: string | number }>;
  value: string | number;
  onChange: (value: string | number) => void;
  allowCustom?: boolean;
  customSuffix?: string;
  className?: string;
}

export const SegmentedControl = React.forwardRef<HTMLDivElement, SegmentedControlProps>(
  ({ options, value, onChange, allowCustom = false, customSuffix = "d", className }, ref) => {
    const [customValue, setCustomValue] = React.useState("");
    const isCustomSelected = allowCustom && !options.find(o => o.value === value);

    React.useEffect(() => {
      if (isCustomSelected && typeof value === 'number') {
        setCustomValue(value.toString());
      }
    }, [isCustomSelected, value]);

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setCustomValue(val);
      const num = parseInt(val, 10);
      if (!isNaN(num) && num > 0) {
        onChange(num);
      }
    };

    return (
      <div ref={ref} className={cn("flex flex-wrap gap-2", className)}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
              value === option.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary/50 text-muted-foreground border-border/50 hover:bg-secondary hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
        {allowCustom && (
          <div
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-lg border transition-all",
              isCustomSelected
                ? "bg-primary/10 border-primary"
                : "bg-secondary/50 border-border/50"
            )}
          >
            <Input
              type="text"
              value={customValue}
              onChange={handleCustomChange}
              placeholder="0"
              className="w-8 h-6 text-center bg-transparent border-0 p-0 text-foreground font-medium focus-visible:ring-0 text-sm"
            />
            <span className="text-muted-foreground text-sm">{customSuffix}</span>
          </div>
        )}
      </div>
    );
  }
);
SegmentedControl.displayName = "SegmentedControl";
