import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`w-full px-3.5 py-2.5 border-1.5 rounded-lg font-inherit text-sm transition-colors ${
          error
            ? "border-red-300 bg-red-50 text-red-900"
            : "border-slate-200 bg-white text-navy hover:border-slate-300 focus:outline-none focus:border-primary-500"
        }`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
