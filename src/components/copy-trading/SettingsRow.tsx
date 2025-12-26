import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface SettingsRowProps {
  label: string;
  value: string | number;
  suffix?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}

export const SettingsRow = React.forwardRef<HTMLDivElement, SettingsRowProps>(
  ({ label, value, suffix = "", onChange, readOnly = true, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between bg-secondary/50 border border-border/50 rounded-lg px-4 py-3",
          className
        )}
      >
        <span className="text-muted-foreground text-sm">{label}</span>
        <div className="flex items-center gap-1">
          {readOnly ? (
            <span className="text-foreground font-medium tabular-nums">{value}</span>
          ) : (
            <Input
              type="text"
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              className="w-20 h-8 text-right bg-transparent border-0 p-0 text-foreground font-medium focus-visible:ring-0"
            />
          )}
          {suffix && (
            <span className="text-primary font-medium">{suffix}</span>
          )}
        </div>
      </div>
    );
  }
);
SettingsRow.displayName = "SettingsRow";
