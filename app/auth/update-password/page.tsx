"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setError(null);
      setMessage(null);

      if (password.length < 8) {
        throw new Error("A password deve ter pelo menos 8 caracteres.");
      }

      if (password !== confirmPassword) {
        throw new Error("As passwords não coincidem.");
      }

      setIsSubmitting(true);
      await authService.updateMyPassword(password);
      setMessage("Password atualizada com sucesso.");

      setTimeout(() => {
        router.push("/login");
      }, 1200);
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
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">
          Redefinir password
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Introduz a tua nova password.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs mb-1 text-slate-500">
              Nova password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xs mb-1 text-slate-500">
              Confirmar nova password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          {message && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full rounded-lg bg-slate-900 text-white py-2.5 disabled:opacity-60"
          >
            {isSubmitting ? "A atualizar..." : "Guardar nova password"}
          </button>
        </div>
      </div>
    </main>
  );
}
