import * as React from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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
  onOpenAdvanced,
  onSave,
  onStopCopy,
}: EditCopyTradingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideCloseButton
        className="sm:max-w-[480px] p-0 gap-0 border-0 overflow-hidden rounded-2xl"
        style={{ backgroundColor: '#1a2832' }}
      >
        {/* Custom Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-5 top-5 text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <h2 className="text-2xl font-semibold" style={{ color: '#5fd4d4' }}>
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
              style={{ backgroundColor: '#243540' }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <span className="text-muted-foreground text-sm">Current Allocated Funds</span>
                <div className="flex items-center gap-1">
                  <span className="text-white font-medium text-lg tabular-nums">
                    {settings.allocatedFunds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span style={{ color: '#5fd4d4' }} className="font-medium text-lg">$</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Available Balance</span>
                  <span className="text-white font-medium">
                    ${settings.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <span style={{ color: '#5fd4d4' }} className="font-medium">
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
              style={{ backgroundColor: '#243540' }}
            >
              <span className="text-muted-foreground text-sm">% Size for each trade</span>
              <div className="flex items-center gap-1">
                <span className="text-white font-medium text-lg tabular-nums">{settings.tradeSizePercent}</span>
                <span style={{ color: '#5fd4d4' }} className="font-medium text-lg">%</span>
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
              style={{ backgroundColor: '#243540' }}
            >
              <span className="text-muted-foreground text-sm">Max % per trade</span>
              <div className="flex items-center gap-1">
                <span className="text-white font-medium text-lg tabular-nums">{settings.copyPercentage}</span>
                <span style={{ color: '#5fd4d4' }} className="font-medium text-lg">%</span>
              </div>
            </div>
          </div>

          {/* Follow Exits */}
          <div 
            className="flex items-start gap-4 p-5 rounded-xl"
            style={{ backgroundColor: '#243540' }}
          >
            <Checkbox
              checked={settings.followExits}
              disabled
              className="mt-0.5 h-5 w-5 rounded border-[#5fd4d4] data-[state=checked]:bg-[#5fd4d4] data-[state=checked]:border-[#5fd4d4]"
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-white font-medium">Follow Exits</span>
              <span className="text-muted-foreground text-sm leading-relaxed">
                When the trader reduces or closes a position, you sell the same percentage of your copied position.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div 
          className="flex items-center justify-between px-6 py-5 border-t"
          style={{ backgroundColor: '#16222a', borderColor: 'rgba(255,255,255,0.08)' }}
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
              className="h-11 w-11 rounded-xl border-0"
              style={{ backgroundColor: '#243540' }}
            >
              <Settings2 className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button
              onClick={onSave}
              className="font-medium px-8 h-11 rounded-xl border-0"
              style={{ backgroundColor: '#5fd4d4', color: '#1a2832' }}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
