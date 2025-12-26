import * as React from "react";
import { cn } from "@/lib/utils";

interface SettingsSectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const SettingsSectionTitle = React.forwardRef<HTMLHeadingElement, SettingsSectionTitleProps>(
  ({ children, className }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          "text-sm font-medium text-foreground/80 mb-3",
          className
        )}
      >
        {children}
      </h3>
    );
  }
);
SettingsSectionTitle.displayName = "SettingsSectionTitle";
