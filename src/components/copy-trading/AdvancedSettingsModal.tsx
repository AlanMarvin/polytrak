import * as React from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdvancedSettings {
  maxAmountPerMarket: number;
  minAmountPerMarket: number;
  maxCopyAmountPerTrade: number;
  minVolumePerMarket: number;
  minLiquidityPerMarket: number;
  marketPriceRangeMin: number;
  marketPriceRangeMax: number;
  maxSlippagePerMarket: number;
  maxTimeUntilResolution: number | "any";
}

interface AdvancedSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AdvancedSettings;
  onSettingsChange: (settings: Partial<AdvancedSettings>) => void;
  onSave: () => void;
  onReset: () => void;
  onBack: () => void;
}

const inputBoxStyle = { backgroundColor: '#243540' };
const modalBgStyle = { backgroundColor: '#1a2832' };
const footerBgStyle = { backgroundColor: '#16222a' };
const accentColor = '#5fd4d4';

interface SettingsInputProps {
  label: string;
  placeholder: string;
  value: number;
  suffix: string;
}

function SettingsInput({ label, placeholder, value, suffix }: SettingsInputProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div 
        className="flex items-center justify-between px-4 py-3.5 rounded-xl"
        style={inputBoxStyle}
      >
        <span className="text-muted-foreground text-sm">{placeholder}</span>
        <div className="flex items-center gap-1">
          <span className="text-white font-medium tabular-nums">{value}</span>
          <span style={{ color: accentColor }} className="font-medium">{suffix}</span>
        </div>
      </div>
    </div>
  );
}

export function AdvancedSettingsModal({
  open,
  onOpenChange,
  settings,
  onSave,
  onReset,
  onBack,
}: AdvancedSettingsModalProps) {
  const timeOptions = [
    { label: "Any", value: "any" },
    { label: "2 days", value: 2 },
    { label: "7 days", value: 7 },
    { label: "30 days", value: 30 },
    { label: "90 days", value: 90 },
  ];

  const [customDays, setCustomDays] = React.useState("");
  const isCustomSelected = typeof settings.maxTimeUntilResolution === 'number' && 
    !timeOptions.find(o => o.value === settings.maxTimeUntilResolution);

  React.useEffect(() => {
    if (isCustomSelected && typeof settings.maxTimeUntilResolution === 'number') {
      setCustomDays(settings.maxTimeUntilResolution.toString());
    }
  }, [isCustomSelected, settings.maxTimeUntilResolution]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideCloseButton
        className="sm:max-w-[540px] p-0 gap-0 border-0 overflow-hidden rounded-2xl"
        style={modalBgStyle}
      >
        {/* Custom Header */}
        <div className="flex items-center justify-between px-5 py-5">
          <button
            onClick={onBack}
            className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            style={inputBoxStyle}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-white">Advanced Settings</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Max/Min Amount Per Market - Two Column */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SettingsInput
              label="Max amount per market"
              placeholder="Max amount"
              value={settings.maxAmountPerMarket}
              suffix="$"
            />
            <SettingsInput
              label="Min amount per market"
              placeholder="Min amount"
              value={settings.minAmountPerMarket}
              suffix="$"
            />
          </div>

          {/* Max Copy Amount Per Trade - Full Width */}
          <SettingsInput
            label="Max copy amount per trade"
            placeholder="Max copy amount per trade"
            value={settings.maxCopyAmountPerTrade}
            suffix="$"
          />

          {/* Min Volume / Min Liquidity - Two Column */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SettingsInput
              label="Min volume of each market"
              placeholder="Min volume"
              value={settings.minVolumePerMarket}
              suffix="$"
            />
            <SettingsInput
              label="Min liquidity per market"
              placeholder="Min Amount"
              value={settings.minLiquidityPerMarket}
              suffix="$"
            />
          </div>

          {/* Market Price Range / Max Slippage - Two Column */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Market price range</p>
              <div className="flex gap-2">
                <div 
                  className="flex items-center justify-between px-3 py-3.5 rounded-xl flex-1"
                  style={inputBoxStyle}
                >
                  <span className="text-muted-foreground text-sm">Min</span>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-medium tabular-nums">{settings.marketPriceRangeMin}</span>
                    <span style={{ color: accentColor }} className="font-medium">¢</span>
                  </div>
                </div>
                <div 
                  className="flex items-center justify-between px-3 py-3.5 rounded-xl flex-1"
                  style={inputBoxStyle}
                >
                  <span className="text-muted-foreground text-sm">Max</span>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-medium tabular-nums">{settings.marketPriceRangeMax}</span>
                    <span style={{ color: accentColor }} className="font-medium">¢</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Max slippage per market</p>
              <div 
                className="flex items-center justify-between px-4 py-3.5 rounded-xl"
                style={inputBoxStyle}
              >
                <span className="text-muted-foreground text-sm">Max Slippage</span>
                <div className="flex items-center gap-1">
                  <span className="text-white font-medium tabular-nums">{settings.maxSlippagePerMarket}</span>
                  <span style={{ color: accentColor }} className="font-medium">¢</span>
                </div>
              </div>
            </div>
          </div>

          {/* Max Time Until Resolution */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Max time until resolution</p>
            <div className="flex flex-wrap gap-2">
              {timeOptions.map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                    settings.maxTimeUntilResolution === option.value
                      ? "text-[#1a2832]"
                      : "text-white"
                  )}
                  style={{
                    backgroundColor: settings.maxTimeUntilResolution === option.value 
                      ? accentColor 
                      : '#243540'
                  }}
                >
                  {option.label}
                </button>
              ))}
              <div
                className="flex items-center gap-1 px-3 py-2 rounded-xl"
                style={inputBoxStyle}
              >
                <input
                  type="text"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="0"
                  className="w-6 text-center bg-transparent border-0 p-0 text-white font-medium focus:outline-none text-sm"
                />
                <span className="text-muted-foreground text-sm">d</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div 
          className="flex items-center justify-between px-6 py-5 border-t"
          style={{ ...footerBgStyle, borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <Button
            variant="outline"
            onClick={onReset}
            className="border-0 bg-transparent hover:bg-white/5 text-white font-medium rounded-xl px-5 h-11"
            style={{ backgroundColor: '#243540' }}
          >
            Reset to Default
          </Button>
          <Button
            onClick={onSave}
            className="font-medium px-6 h-11 rounded-xl border-0"
            style={{ backgroundColor: accentColor, color: '#1a2832' }}
          >
            Save & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
