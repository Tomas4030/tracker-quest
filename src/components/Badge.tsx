import React from "react";
import { getStatusColorClass, getStatusLabel } from "@/utils/helpers";

interface BadgeProps {
  label?: string;
  status?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  status,
  className = "",
}) => {
  const statusColor = status
    ? getStatusColorClass(status)
    : "bg-slate-100 text-slate-800";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor} ${className}`}
    >
      {status ? getStatusLabel(status) : (label ?? "")}
    </span>
  );
};
