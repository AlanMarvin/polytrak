import * as React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface FollowExitsToggleCardProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const FollowExitsToggleCard = React.forwardRef<HTMLDivElement, FollowExitsToggleCardProps>(
  ({ checked, onChange, disabled = true, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start gap-3 bg-secondary/50 border border-border/50 rounded-lg p-4",
          className
        )}
      >
        <Checkbox
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
          className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <div className="flex flex-col gap-1">
          <span className="text-foreground font-medium text-sm">Follow Exits</span>
          <span className="text-muted-foreground text-xs leading-relaxed">
            When the trader reduces or closes a position, you sell the same percentage of your copied position.
          </span>
        </div>
      </div>
    );
  }
);
FollowExitsToggleCard.displayName = "FollowExitsToggleCard";
