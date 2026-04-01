import React from "react";

interface StatCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  subText?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  subText,
  className = "",
}) => {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg p-5 shadow-sm ${className}`}
    >
      {icon && <div className="mb-3 text-2xl">{icon}</div>}
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
        {label}
      </div>
      <div className="text-2xl font-bold text-navy">{value}</div>
      {subText && <div className="text-xs text-slate-600 mt-1">{subText}</div>}
    </div>
  );
};
