import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { ExitMode, EXIT_MODE_OPTIONS } from "@/hooks/useAutoCopySettings";

interface ExitModeSelectorProps {
  value: ExitMode;
  onChange: (mode: ExitMode) => void;
  className?: string;
}

const inputBoxStyle = { backgroundColor: '#243540' };
const accentColor = '#5fd4d4';

export function ExitModeSelector({ value, onChange, className }: ExitModeSelectorProps) {
  const selectedOption = EXIT_MODE_OPTIONS.find(o => o.value === value) || EXIT_MODE_OPTIONS[0];

  return (
    <div 
      className={cn("rounded-xl p-5 space-y-4", className)}
      style={inputBoxStyle}
    >
      {/* Segmented Control */}
      <div className="flex gap-2">
        {EXIT_MODE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              value === option.value
                ? "text-[#1a2832]"
                : "text-white hover:bg-white/5"
            )}
            style={{
              backgroundColor: value === option.value ? accentColor : 'transparent',
              border: value === option.value ? 'none' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {value === option.value && <Check className="h-4 w-4" />}
            {option.label}
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-muted-foreground text-sm leading-relaxed">
        {selectedOption.description}
      </p>
    </div>
  );
}
