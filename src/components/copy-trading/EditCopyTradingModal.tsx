import * as React from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings2, X } from "lucide-react";
import { ExitModeSelector } from "./ExitModeSelector";
import { ExitMode } from "@/hooks/useAutoCopySettings";

interface CopyTradingSettings {
  allocatedFunds: number;
  tradeSizePercent: number;
  copyPercentage: number;
  exitMode: ExitMode;
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

const inputBoxStyle = { backgroundColor: '#243540' };
const modalBgStyle = { backgroundColor: '#1a2832' };
const footerBgStyle = { backgroundColor: '#16222a' };
const accentColor = '#5fd4d4';

export function EditCopyTradingModal({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
  onOpenAdvanced,
  onSave,
  onStopCopy,
  traderName,
}: EditCopyTradingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideCloseButton
        className="sm:max-w-[480px] p-0 gap-0 border-0 overflow-hidden rounded-2xl"
        style={modalBgStyle}
      >
        {/* Custom Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-5 top-5 text-muted-foreground/50 hover:text-foreground transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <h2 className="text-2xl font-semibold">
            <span style={{ color: accentColor }}>Copy</span>{' '}
            <span className="text-white">{traderName || 'Trader'}</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Configure your copy trading for this profile
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
              style={inputBoxStyle}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <span className="text-muted-foreground text-sm">Total Allocated Funds</span>
                <div className="flex items-center gap-1">
                  <span className="text-white font-medium text-lg tabular-nums">
                    {settings.allocatedFunds.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <span style={{ color: accentColor }} className="font-medium text-lg">$</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-muted-foreground">Available Balance</span>
                <span className="text-white font-medium">
                  ${settings.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              style={inputBoxStyle}
            >
              <span className="text-muted-foreground text-sm">% Size for each trade</span>
              <div className="flex items-center gap-1">
                <span className="text-white font-medium text-lg tabular-nums">{settings.tradeSizePercent}</span>
                <span style={{ color: accentColor }} className="font-medium text-lg">%</span>
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
              style={inputBoxStyle}
            >
              <span className="text-muted-foreground text-sm">Max % per trade</span>
              <div className="flex items-center gap-1">
                <span className="text-white font-medium text-lg tabular-nums">{settings.copyPercentage}</span>
                <span style={{ color: accentColor }} className="font-medium text-lg">%</span>
              </div>
            </div>
          </div>

          {/* Exit Mode Selector */}
          <ExitModeSelector
            value={settings.exitMode}
            onChange={(exitMode) => onSettingsChange({ exitMode })}
          />
        </div>

        {/* Footer Actions */}
        <div 
          className="flex items-center justify-between px-6 py-5 border-t"
          style={{ ...footerBgStyle, borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <Button
            variant="outline"
            onClick={onOpenAdvanced}
            className="border-0 font-medium px-5 h-11 rounded-xl flex items-center gap-2"
            style={{ backgroundColor: '#243540' }}
          >
            Advanced
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            onClick={onSave}
            className="font-medium px-8 h-11 rounded-xl border-0"
            style={{ backgroundColor: accentColor, color: '#1a2832' }}
          >
            Start Copying
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
