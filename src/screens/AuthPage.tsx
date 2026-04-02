"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Alert } from "@/components";
import { useAppStore } from "@/store";

export const AuthPage: React.FC = () => {
  const router = useRouter();
  const { login, isLoading } = useAppStore();
  const [error, setError] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(loginEmail, loginPassword);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy via-blue-900 to-primary-600 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center text-lg font-bold text-white">
            📋
          </div>
          <div>
            <div className="font-semibold text-navy">EstágioTrack</div>
            <div className="text-xs text-slate-600">Gestão de atividades</div>
          </div>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}

        <form onSubmit={handleLogin}>
          <h1 className="text-2xl font-semibold text-navy mb-1">
            Bem-vindo de volta
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            Inicia sessão na tua conta
          </p>

          <Input
            label="Email"
            type="email"
            placeholder="nome@empresa.pt"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            required
          />
          <Input
            label="Palavra-passe"
            type="password"
            placeholder="••••••••"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            size="lg"
            isLoading={isLoading}
            className="mb-4"
          >
            Entrar
          </Button>

          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            Contas sao geridas apenas por administradores. Se nao tiveres
            acesso, pede criacao de conta ao admin.
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
