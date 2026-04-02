import React from "react";
import type { InsightLevel } from "@/types";

interface InsightCardProps {
  title: string;
  description: string;
  value?: string;
  level?: InsightLevel;
}

const levelStyles: Record<InsightLevel, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  critical: "border-rose-200 bg-rose-50 text-rose-800",
};

export const InsightCard: React.FC<InsightCardProps> = ({
  title,
  description,
  value,
  level = "info",
}) => {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${levelStyles[level]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <p className="mt-1 text-sm leading-6 opacity-90">{description}</p>
        </div>
        {value && (
          <div className="text-xs font-mono font-semibold">{value}</div>
        )}
      </div>
    </div>
  );
};
