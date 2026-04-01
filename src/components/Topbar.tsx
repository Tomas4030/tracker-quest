import React from "react";

interface TopbarProps {
  title: string;
  date?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ title, date }) => {
  return (
    <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4">
      <h1 className="text-lg font-semibold text-navy flex-1">{title}</h1>
      {date && <div className="text-sm text-slate-500">{date}</div>}
    </div>
  );
};
