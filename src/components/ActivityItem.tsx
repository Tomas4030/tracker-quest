import React from "react";
import { Activity } from "@/types";
import { calculateHours, formatHours } from "@/utils/helpers";
import { Badge } from "./Badge";
import { Edit2, Trash2 } from "lucide-react";

interface ActivityItemProps {
  activity: Activity;
  showUser?: boolean;
  userName?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const formatSimpleTime = (time?: string) => {
  if (!time) return "";
  return time.slice(0, 5);
};

const formatSimpleDate = (date?: string) => {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
};

export const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  showUser = false,
  userName,
  onEdit,
  onDelete,
}) => {
  const hours = calculateHours(activity.startTime, activity.endTime);
  const formattedDate = formatSimpleDate(activity.date);
  const formattedStartTime = formatSimpleTime(activity.startTime);
  const formattedEndTime = formatSimpleTime(activity.endTime);

  return (
    <div className="group flex gap-4 border-b border-slate-200 p-4 transition-colors last:border-b-0 hover:bg-slate-50">
      <div className="w-32 shrink-0">
        <div className="text-sm font-medium text-slate-700">
          {formattedDate}
        </div>
        <div className="mt-1 text-xs font-mono text-slate-500">
          {formattedStartTime} - {formattedEndTime}
        </div>
        {!showUser && (
          <div className="mt-2 text-xs font-medium text-slate-600">
            {formatHours(hours)}
          </div>
        )}
      </div>

      <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-500" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-900">
              {activity.title}
            </div>

            {activity.projectName && (
              <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                {activity.projectName}
              </div>
            )}

            {activity.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">
                {activity.description}
              </p>
            )}

            {showUser && userName && (
              <div className="mt-2 text-xs font-medium text-primary-600">
                {userName}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge status={activity.status} />
              <span className="text-xs font-medium text-slate-600">
                {formatHours(hours)}
              </span>
            </div>
          </div>

          {(onEdit || onDelete) && (
            <div className="flex shrink-0 gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(activity.id)}
                  className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-200"
                  title="Editar"
                  aria-label="Editar atividade"
                >
                  <Edit2 size={14} />
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(activity.id)}
                  className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-100"
                  title="Apagar"
                  aria-label="Apagar atividade"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};