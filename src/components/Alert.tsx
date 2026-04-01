import React from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

interface AlertProps {
  type: "error" | "success" | "info" | "warning";
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const styles: Record<
    string,
    { bg: string; text: string; icon: React.ReactNode }
  > = {
    error: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-800",
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
    },
    success: {
      bg: "bg-green-50 border-green-200",
      text: "text-green-800",
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-800",
      icon: <AlertCircle className="w-5 h-5 text-blue-600" />,
    },
    warning: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-800",
      icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
    },
  };

  const style = styles[type];

  return (
    <div
      className={`mb-4 p-4 rounded-lg border ${style.bg} flex items-start gap-3`}
    >
      {style.icon}
      <div className="flex-1">
        <p className={`text-sm font-medium ${style.text}`}>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`text-sm font-medium ${style.text} hover:opacity-70`}
        >
          ✕
        </button>
      )}
    </div>
  );
};
