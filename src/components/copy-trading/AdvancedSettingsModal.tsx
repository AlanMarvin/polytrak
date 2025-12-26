import * as React from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, X } from "lucide-react";
import { SettingsSectionTitle } from "./SettingsSectionTitle";
import { SegmentedControl } from "./SegmentedControl";
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

interface SettingsInputProps {
  label: string;
  placeholder: string;
  value: number;
  onChange: (value: number) => void;
  suffix: string;
  readOnly?: boolean;
}

function SettingsInput({ label, placeholder, value, onChange, suffix, readOnly = true }: SettingsInputProps) {
  return (
    <div className="space-y-2">
      <SettingsSectionTitle className="mb-0">{label}</SettingsSectionTitle>
      <div className="flex items-center bg-secondary/50 border border-border/50 rounded-lg px-4 py-3">
        <span className="text-muted-foreground text-sm flex-1">{placeholder}</span>
        <div className="flex items-center gap-1">
          {readOnly ? (
            <span className="text-foreground font-medium tabular-nums">{value}</span>
          ) : (
            <Input
              type="number"
              value={value}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              className="w-16 h-6 text-right bg-transparent border-0 p-0 text-foreground font-medium focus-visible:ring-0"
            />
          )}
          <span className="text-primary font-medium">{suffix}</span>
        </div>
      </div>
    </div>
  );
}

interface DualInputRowProps {
  label1: string;
  placeholder1: string;
  value1: number;
  suffix1: string;
  label2: string;
  placeholder2: string;
  value2: number;
  suffix2: string;
  onChange1?: (value: number) => void;
  onChange2?: (value: number) => void;
  readOnly?: boolean;
}

function DualInputRow({
  label1, placeholder1, value1, suffix1,
  label2, placeholder2, value2, suffix2,
  onChange1, onChange2, readOnly = true
}: DualInputRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <SettingsSectionTitle className="mb-0">{label1}</SettingsSectionTitle>
        <div className="flex items-center bg-secondary/50 border border-border/50 rounded-lg px-4 py-3">
          <span className="text-muted-foreground text-sm flex-1">{placeholder1}</span>
          <div className="flex items-center gap-1">
            {readOnly ? (
              <span className="text-foreground font-medium tabular-nums">{value1}</span>
            ) : (
              <Input
                type="number"
                value={value1}
                onChange={(e) => onChange1?.(parseFloat(e.target.value) || 0)}
                className="w-16 h-6 text-right bg-transparent border-0 p-0 text-foreground font-medium focus-visible:ring-0"
              />
            )}
            <span className="text-primary font-medium">{suffix1}</span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <SettingsSectionTitle className="mb-0">{label2}</SettingsSectionTitle>
        <div className="flex items-center bg-secondary/50 border border-border/50 rounded-lg px-4 py-3">
          <span className="text-muted-foreground text-sm flex-1">{placeholder2}</span>
          <div className="flex items-center gap-1">
            {readOnly ? (
              <span className="text-foreground font-medium tabular-nums">{value2}</span>
            ) : (
              <Input
                type="number"
                value={value2}
                onChange={(e) => onChange2?.(parseFloat(e.target.value) || 0)}
                className="w-16 h-6 text-right bg-transparent border-0 p-0 text-foreground font-medium focus-visible:ring-0"
              />
            )}
            <span className="text-primary font-medium">{suffix2}</span>
          </div>
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] bg-card border-border/50 p-0 gap-0">
        {/* Custom Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full bg-secondary/50 hover:bg-secondary h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground">Advanced Settings</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-full opacity-70 hover:opacity-100 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Max/Min Amount Per Market */}
          <DualInputRow
            label1="Max amount per market"
            placeholder1="Max amount"
            value1={settings.maxAmountPerMarket}
            suffix1="$"
            label2="Min amount per market"
            placeholder2="Min amount"
            value2={settings.minAmountPerMarket}
            suffix2="$"
          />

          {/* Max Copy Amount Per Trade */}
          <SettingsInput
            label="Max copy amount per trade"
            placeholder="Max copy amount per trade"
            value={settings.maxCopyAmountPerTrade}
            onChange={(v) => onSettingsChange({ maxCopyAmountPerTrade: v })}
            suffix="$"
          />

          {/* Min Volume / Min Liquidity */}
          <DualInputRow
            label1="Min volume of each market"
            placeholder1="Min volume"
            value1={settings.minVolumePerMarket}
            suffix1="$"
            label2="Min liquidity per market"
            placeholder2="Min Amount"
            value2={settings.minLiquidityPerMarket}
            suffix2="$"
          />

          {/* Market Price Range / Max Slippage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <SettingsSectionTitle className="mb-0">Market price range</SettingsSectionTitle>
              <div className="flex gap-2">
                <div className="flex items-center bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 flex-1">
                  <span className="text-muted-foreground text-sm mr-2">Min</span>
                  <span className="text-foreground font-medium tabular-nums flex-1 text-right">{settings.marketPriceRangeMin}</span>
                  <span className="text-primary font-medium ml-1">¢</span>
                </div>
                <div className="flex items-center bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 flex-1">
                  <span className="text-muted-foreground text-sm mr-2">Max</span>
                  <span className="text-foreground font-medium tabular-nums flex-1 text-right">{settings.marketPriceRangeMax}</span>
                  <span className="text-primary font-medium ml-1">¢</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <SettingsSectionTitle className="mb-0">Max slippage per market</SettingsSectionTitle>
              <div className="flex items-center bg-secondary/50 border border-border/50 rounded-lg px-4 py-3">
                <span className="text-muted-foreground text-sm flex-1">Max Slippage</span>
                <span className="text-foreground font-medium tabular-nums">{settings.maxSlippagePerMarket}</span>
                <span className="text-primary font-medium ml-1">¢</span>
              </div>
            </div>
          </div>

          {/* Max Time Until Resolution */}
          <div className="space-y-3">
            <SettingsSectionTitle className="mb-0">Max time until resolution</SettingsSectionTitle>
            <SegmentedControl
              options={timeOptions}
              value={settings.maxTimeUntilResolution}
              onChange={(v) => onSettingsChange({ maxTimeUntilResolution: v as number | "any" })}
              allowCustom
              customSuffix="d"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/30 bg-secondary/20">
          <Button
            variant="outline"
            onClick={onReset}
            className="border-border/50 bg-secondary/50 hover:bg-secondary font-medium"
          >
            Reset to Default
          </Button>
          <Button
            onClick={onSave}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-6"
          >
            Save & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
