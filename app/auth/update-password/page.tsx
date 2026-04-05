"use client";

import { FormEvent, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";

// ─── helpers ───────────────────────────────────────────────────────────────────

function getPasswordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: "fraca", bar: "bg-red-400", text: "Muito fraca", color: "text-red-500" };
  if (score <= 2) return { level: "fraca", bar: "bg-orange-400", text: "Fraca", color: "text-orange-500" };
  if (score <= 3) return { level: "media", bar: "bg-amber-400", text: "Média", color: "text-amber-500" };
  if (score <= 4) return { level: "forte", bar: "bg-emerald-400", text: "Forte", color: "text-emerald-500" };
  return { level: "forte", bar: "bg-emerald-500", text: "Muito forte", color: "text-emerald-600" };
}

// ─── icons ─────────────────────────────────────────────────────────────────────

function EyeOpen() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeClosed() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function Dot({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function LockKeyhole() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ArrowLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

// ─── PasswordField ──────────────────────────────────────────────────────────────

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  showStrength?: boolean;
  autoComplete?: string;
  ariaDescribedBy?: string;
}

function PasswordField({ id, label, value, onChange, onBlur, placeholder, showStrength, autoComplete, ariaDescribedBy }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const strength = getPasswordStrength(value);
  const activeBars = strength.level === "fraca" ? 1 : strength.level === "media" ? 3 : 5;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-slate-700">
        {label}
      </label>
      <div className="group relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          minLength={8}
          placeholder={placeholder}
          aria-describedby={ariaDescribedBy}
          className="peer w-full rounded-[10px] border border-slate-200 bg-slate-50/60 px-3.5 py-[10px] pr-11 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-[3px] focus:ring-primary-500/10"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar password" : "Mostrar password"}
          className="pointer-events-auto absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-slate-500"
        >
          {visible ? <EyeClosed /> : <EyeOpen />}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <div className="mt-2.5 space-y-1.5">
          <div className="flex gap-[3px]">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-slate-100 transition">
                <div className={`h-full ${strength.bar} transition-all duration-500`} style={{ width: i < activeBars ? "100%" : "0%" }} />
              </div>
            ))}
          </div>
          <p className={`text-[11px] font-medium ${strength.color} transition`}>{strength.text}</p>
        </div>
      )}
    </div>
  );
}

// ─── Rules checklist ────────────────────────────────────────────────────────────

function PasswordRules({ password }: { password: string }) {
  const rules = [
    { ok: password.length >= 8, text: "8+ caracteres" },
    { ok: /[A-Z]/.test(password), text: "Maiúscula" },
    { ok: /[a-z]/.test(password), text: "Minúscula" },
    { ok: /[0-9]/.test(password), text: "Número" },
  ];

  return (
    <div className="mt-2 rounded-lg bg-slate-50/80 px-3 py-2.5">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Requisitos</p>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1" role="list">
        {rules.map((r) => (
          <li key={r.text} className={`flex items-center gap-1.5 text-[12px] transition-colors duration-200 ${r.ok ? "text-emerald-600" : "text-slate-400"}`}>
            <span className={`shrink-0 transition-colors ${r.ok ? "text-emerald-500" : "text-slate-300"}`}>
              {r.ok ? <CheckCircleIcon /> : <Dot active={false} />}
            </span>
            {r.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const pwRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    pwRef.current?.focus();
  }, []);

  const passwordsMatch = touched && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsClash = touched && confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit = password.length >= 8 && password === confirmPassword && !isSubmitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    setMessage(null);

    if (password.length < 8) {
      setError("A password deve ter pelo menos 8 caracteres.");
      pwRef.current?.focus();
      return;
    }

    if (password !== confirmPassword) {
      setError("As passwords não coincidem.");
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.updateMyPassword(password);
      setMessage("Password atualizada com sucesso.");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar a password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-slate-100 to-slate-100 px-4 py-12">
      {/* Subtle background grid */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)",
        backgroundSize: "28px 28px",
      }} />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 h-[28rem] w-[28rem] rounded-full bg-primary-500/[0.04] blur-[120px]" />

      <div className="relative w-full max-w-[400px]">
        {/* Back link */}
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mb-5 flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft /> Voltar ao login
        </button>

        {/* Card */}
        <div className="rounded-[14px] border border-slate-200/80 bg-white/90 p-7 shadow-[0_8px_40px_-18px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.06)] backdrop-blur sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500/10 text-primary-500 ring-1 ring-primary-500/10">
              <LockKeyhole />
            </div>
            <h1 className="text-[17px] font-semibold tracking-tight text-navy">
              Nova password
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
              Introduz e confirma a tua nova password.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <PasswordField
                id="new-password"
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                showStrength
                autoComplete="new-password"
              />
              <PasswordRules password={password} />
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-[13px] font-medium text-slate-700">
                Confirmar password
              </label>
              <div className="group relative">
                <input
                  id="confirm-password"
                  ref={pwRef}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouched(true)}
                  autoComplete="new-password"
                  placeholder="Repete a password"
                  aria-invalid={passwordsClash ? "true" : "false"}
                  aria-describedby={passwordsClash ? "confirm-error" : undefined}
                  className={`peer w-full rounded-[10px] border bg-slate-50/60 px-3.5 py-[10px] pr-11 text-[13px] placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:ring-[3px] ${
                    passwordsClash
                      ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                      : passwordsMatch
                        ? "border-emerald-300 bg-emerald-50/50 text-emerald-700 focus:border-emerald-500 focus:ring-emerald-500/10"
                        : "border-slate-200 focus:border-primary-500 focus:ring-primary-500/10"
                  }`}
                />
                {passwordsMatch && (
                  <span className="absolute inset-y-0 right-3 flex items-center text-emerald-500">
                    <CheckCircleIcon />
                  </span>
                )}
                {passwordsClash && (
                  <span className="absolute inset-y-0 right-3 flex items-center text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                  </span>
                )}
              </div>
              {passwordsClash && (
                <p id="confirm-error" role="alert" className="mt-1.5 flex items-center gap-1 text-[12px] text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  As passwords não coincidem
                </p>
              )}
            </div>

            {/* Feedback */}
            {message && (
              <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200/70 bg-emerald-50/80 px-3 py-2.5 text-[13px] font-medium text-emerald-700 ring-1 ring-emerald-500/5 animate-[fadeIn_200ms_ease]">
                <CheckCircleIcon />
                {message}
              </div>
            )}

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200/70 bg-red-50/80 px-3 py-2.5 text-[13px] text-red-700 ring-1 ring-red-500/5 animate-[fadeIn_200ms_ease]">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-px shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="relative w-full overflow-hidden rounded-[10px] bg-navy px-4 py-[11px] text-[13px] font-semibold tracking-tight text-white shadow-lg shadow-slate-900/15 transition-all duration-200 hover:bg-slate-800 hover:shadow-slate-900/20 focus:outline-none focus:ring-[3px] focus:ring-navy/20 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.985]"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  A atualizar...
                </span>
              ) : (
                "Atualizar password"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-5 text-center text-[12px] text-slate-400">
          A password será necessária no próximo login
        </p>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
