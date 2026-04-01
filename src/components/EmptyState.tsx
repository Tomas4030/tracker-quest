import React from "react";
import { InboxIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <InboxIcon className="w-12 h-12" />,
  title,
  description,
}) => {
  return (
    <div className="text-center py-12 px-4">
      <div className="flex justify-center mb-4 text-slate-300">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-600">{description}</p>}
    </div>
  );
};
