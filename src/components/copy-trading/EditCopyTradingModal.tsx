import * as React from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface CopyTradingSettings {
  allocatedFunds: number;
  tradeSizePercent: number;
  copyPercentage: number;
  followExits: boolean;
  availableBalance: number;
  spentOnTrader: number;
}

interface EditCopyTradingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: CopyTradingSettings;
  onSettingsChange: (settings: Partial<CopyTradingSettings>) => void;
  onOpenAdvanced: () => void;
  onSave: () => void;
  onStopCopy?: () => void;
  traderName?: string;
}

export function EditCopyTradingModal({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
  onOpenAdvanced,
  onSave,
  onStopCopy,
}: EditCopyTradingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideCloseButton
        className="sm:max-w-[480px] p-0 gap-0 border-0 overflow-hidden"
        style={{ backgroundColor: 'hsl(200 25% 10%)' }}
      >
        {/* Custom Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-muted-foreground/60 hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-2xl font-semibold text-primary">
            Edit Copy Trading
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your future copy trades
          </p>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {/* Section A: Allocation */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              How much do you want to allocate to this trader?
            </p>
            <div 
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: 'hsl(200 20% 14%)' }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
                <span className="text-muted-foreground text-sm">Current Allocated Funds</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground font-medium text-lg tabular-nums">
                    {settings.allocatedFunds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-primary font-medium text-lg">$</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Available Balance</span>
                  <span className="text-foreground font-medium">
                    ${settings.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <span className="text-primary font-medium">
                  ${settings.spentOnTrader.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spent on this Trader
                </span>
              </div>
            </div>
          </div>

          {/* Section B: Trade Size */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              What percent of that should go into each trade?
            </p>
            <div 
              className="flex items-center justify-between px-5 py-4 rounded-xl"
              style={{ backgroundColor: 'hsl(200 20% 14%)' }}
            >
              <span className="text-muted-foreground text-sm">% Size for each trade</span>
              <div className="flex items-center gap-1.5">
                <span className="text-foreground font-medium text-lg tabular-nums">{settings.tradeSizePercent}</span>
                <span className="text-primary font-medium text-lg">%</span>
              </div>
            </div>
          </div>

          {/* Section C: Copy Percentage */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter the percentage of each trade to copy
            </p>
            <div 
              className="flex items-center justify-between px-5 py-4 rounded-xl"
              style={{ backgroundColor: 'hsl(200 20% 14%)' }}
            >
              <span className="text-muted-foreground text-sm">Max % per trade</span>
              <div className="flex items-center gap-1.5">
                <span className="text-foreground font-medium text-lg tabular-nums">{settings.copyPercentage}</span>
                <span className="text-primary font-medium text-lg">%</span>
              </div>
            </div>
          </div>

          {/* Follow Exits */}
          <div 
            className="flex items-start gap-4 p-5 rounded-xl"
            style={{ backgroundColor: 'hsl(200 20% 14%)' }}
          >
            <Checkbox
              checked={settings.followExits}
              disabled
              className="mt-0.5 h-5 w-5 rounded border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-foreground font-medium">Follow Exits</span>
              <span className="text-muted-foreground text-sm leading-relaxed">
                When the trader reduces or closes a position, you sell the same percentage of your copied position.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-t border-border/20"
          style={{ backgroundColor: 'hsl(200 22% 8%)' }}
        >
          <Button
            variant="ghost"
            onClick={onStopCopy}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 font-medium px-0"
          >
            Stop Copy Trading
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={onOpenAdvanced}
              className="h-10 w-10 rounded-lg border-border/40 bg-transparent hover:bg-secondary/50"
            >
              <Settings2 className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button
              onClick={onSave}
              variant="outline"
              className="border-primary/40 text-primary hover:bg-primary/10 font-medium px-6 rounded-lg"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
