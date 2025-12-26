import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { SettingsRow } from "./SettingsRow";
import { SettingsSectionTitle } from "./SettingsSectionTitle";
import { FollowExitsToggleCard } from "./FollowExitsToggleCard";

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
  traderName,
}: EditCopyTradingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border/50 p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-semibold text-primary">
            Edit Copy Trading
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Manage your future copy trades{traderName ? ` for ${traderName}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Section A: Allocation */}
          <div>
            <SettingsSectionTitle>
              How much do you want to allocate to this trader?
            </SettingsSectionTitle>
            <div className="bg-secondary/50 border border-border/50 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                <span className="text-muted-foreground text-sm">Current Allocated Funds</span>
                <div className="flex items-center gap-1">
                  <span className="text-foreground font-medium tabular-nums">
                    {settings.allocatedFunds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-primary font-medium">$</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-2 text-xs">
                <div className="flex items-center gap-1">
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
          <div>
            <SettingsSectionTitle>
              What percent of that should go into each trade?
            </SettingsSectionTitle>
            <SettingsRow
              label="% Size for each trade"
              value={settings.tradeSizePercent}
              suffix="%"
              readOnly
            />
          </div>

          {/* Section C: Copy Percentage */}
          <div>
            <SettingsSectionTitle>
              Enter the percentage of each trade to copy
            </SettingsSectionTitle>
            <SettingsRow
              label="Max % per trade"
              value={settings.copyPercentage}
              suffix="%"
              readOnly
            />
          </div>

          {/* Follow Exits */}
          <FollowExitsToggleCard
            checked={settings.followExits}
            onChange={(checked) => onSettingsChange({ followExits: checked })}
            disabled
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/30 bg-secondary/20">
          <Button
            variant="ghost"
            onClick={onStopCopy}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 font-medium"
          >
            Stop Copy Trading
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onOpenAdvanced}
              className="border-border/50 bg-secondary/50 hover:bg-secondary"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={onSave}
              className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 font-medium px-6"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
