import * as React from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const inputBoxStyle = { backgroundColor: 'hsl(200 20% 14%)' };

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
        className="flex items-center justify-between px-4 py-3 rounded-xl"
        style={inputBoxStyle}
      >
        <span className="text-muted-foreground text-sm">{placeholder}</span>
        <div className="flex items-center gap-1">
          <span className="text-foreground font-medium tabular-nums">{value}</span>
          <span className="text-primary font-medium">{suffix}</span>
        </div>
      </div>
    </div>
  );
}

export function AdvancedSettingsModal({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
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

  const handleTimeSelect = (value: string | number) => {
    onSettingsChange({ maxTimeUntilResolution: value as number | "any" });
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomDays(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      onSettingsChange({ maxTimeUntilResolution: num });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideCloseButton
        className="sm:max-w-[540px] p-0 gap-0 border-0 overflow-hidden"
        style={{ backgroundColor: 'hsl(200 25% 10%)' }}
      >
        {/* Custom Header */}
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={onBack}
            className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            style={{ backgroundColor: 'hsl(200 20% 16%)' }}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-foreground">Advanced Settings</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Max/Min Amount Per Market - Two Column */}
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Market price range</p>
              <div className="flex gap-2">
                <div 
                  className="flex items-center justify-between px-3 py-3 rounded-xl flex-1"
                  style={inputBoxStyle}
                >
                  <span className="text-muted-foreground text-sm">Min</span>
                  <div className="flex items-center gap-1">
                    <span className="text-foreground font-medium tabular-nums">{settings.marketPriceRangeMin}</span>
                    <span className="text-primary font-medium">¢</span>
                  </div>
                </div>
                <div 
                  className="flex items-center justify-between px-3 py-3 rounded-xl flex-1"
                  style={inputBoxStyle}
                >
                  <span className="text-muted-foreground text-sm">Max</span>
                  <div className="flex items-center gap-1">
                    <span className="text-foreground font-medium tabular-nums">{settings.marketPriceRangeMax}</span>
                    <span className="text-primary font-medium">¢</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Max slippage per market</p>
              <div 
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={inputBoxStyle}
              >
                <span className="text-muted-foreground text-sm">Max Slippage</span>
                <div className="flex items-center gap-1">
                  <span className="text-foreground font-medium tabular-nums">{settings.maxSlippagePerMarket}</span>
                  <span className="text-primary font-medium">¢</span>
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
                  onClick={() => handleTimeSelect(option.value)}
                  className={cn(
                    "px-4 py-2.5 rounded-lg text-sm font-medium transition-all border",
                    settings.maxTimeUntilResolution === option.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-foreground border-border/40 hover:border-border"
                  )}
                >
                  {option.label}
                </button>
              ))}
              <div
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all",
                  isCustomSelected
                    ? "border-primary bg-primary/10"
                    : "border-border/40 bg-transparent"
                )}
              >
                <input
                  type="text"
                  value={customDays}
                  onChange={handleCustomChange}
                  placeholder="0"
                  className="w-6 text-center bg-transparent border-0 p-0 text-foreground font-medium focus:outline-none text-sm"
                />
                <span className="text-muted-foreground text-sm">d</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-t border-border/20"
          style={{ backgroundColor: 'hsl(200 22% 8%)' }}
        >
          <Button
            variant="outline"
            onClick={onReset}
            className="border-border/40 bg-transparent hover:bg-secondary/30 font-medium rounded-lg"
          >
            Reset to Default
          </Button>
          <Button
            onClick={onSave}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-6 rounded-lg"
          >
            Save & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
