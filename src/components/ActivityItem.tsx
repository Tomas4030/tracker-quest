import React from "react";
import { Activity } from "@/types";
import { calculateHours, formatHours, formatTimeRange } from "@/utils/helpers";
import { Badge } from "./Badge";
import { Edit2, Trash2 } from "lucide-react";

interface ActivityItemProps {
  activity: Activity;
  showUser?: boolean;
  userName?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  showUser,
  userName,
  onEdit,
  onDelete,
}) => {
  const hours = calculateHours(activity.startTime, activity.endTime);

  return (
    <div className="flex gap-4 p-4 border-b border-slate-200 hover:bg-slate-50 transition-colors last:border-b-0">
      {/* Time */}
      <div className="min-w-fit text-xs font-mono text-slate-500">
        <div>{activity.date}</div>
        <div>{formatTimeRange(activity.startTime, activity.endTime)}</div>
        {!showUser && (
          <div className="text-xs mt-0.5">{formatHours(hours)}</div>
        )}
      </div>

      {/* Dot */}
      <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-900 text-sm">
          {activity.title}
        </div>
        {activity.description && (
          <div className="text-xs text-slate-600 mt-1 line-clamp-2">
            {activity.description}
          </div>
        )}
        {showUser && (
          <div className="text-xs text-primary-600 font-medium mt-1">
            {userName}
          </div>
        )}
        <div className="mt-2 flex items-center gap-2">
          <Badge status={activity.status} />
          {showUser && (
            <span className="text-xs text-slate-600 font-mono">
              {formatHours(hours)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {(onEdit || onDelete) && (
        <div className="flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={() => onEdit(activity.id)}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
              title="Editar"
            >
              <Edit2 size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(activity.id)}
              className="p-1.5 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
              title="Apagar"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
