"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Alert } from "@/components";
import { useAppStore } from "@/store";
import { isValidEmail } from "@/utils/helpers";

export const AuthPage: React.FC = () => {
  const router = useRouter();
  const { login, register, isLoading } = useAppStore();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState("admin@estagio.pt");
  const [loginPassword, setLoginPassword] = useState("admin123");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"estagiario" | "admin">("estagiario");

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regName.trim()) {
      setError("Por favor, preenche o teu nome");
      return;
    }

    if (!isValidEmail(regEmail)) {
      setError("Por favor, insere um email válido");
      return;
    }

    if (regPassword.length < 6) {
      setError("A palavra-passe deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      await register(regName, regEmail, regPassword, regRole);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registar");
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

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {mode === "login" && (
          <form onSubmit={handleLogin}>
            <h1 className="text-2xl font-semibold text-navy mb-1">Bem-vindo de volta</h1>
            <p className="text-sm text-slate-600 mb-6">Inicia sessão na tua conta</p>

            <Input label="Email" type="email" placeholder="nome@empresa.pt" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
            <Input label="Palavra-passe" type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />

            <Button type="submit" size="lg" isLoading={isLoading} className="mb-4">Entrar</Button>

            <div className="text-center text-sm text-slate-600">
              Não tens conta?{" "}
              <button type="button" onClick={() => { setMode("register"); setError(null); }} className="text-primary-600 font-medium hover:underline">
                Regista-te aqui
              </button>
            </div>

            <div className="mt-6 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
              <strong className="text-slate-800">Demo rápido:</strong>
              <div className="mt-2 space-y-1 font-mono">
                <div>Admin: admin@estagio.pt / admin123</div>
                <div>Estagiário: ana@estagio.pt / ana123</div>
              </div>
            </div>
          </form>
        )}

        {mode === "register" && (
          <form onSubmit={handleRegister}>
            <h1 className="text-2xl font-semibold text-navy mb-1">Criar conta</h1>
            <p className="text-sm text-slate-600 mb-6">Regista-te para começar</p>

            <Input label="Nome completo" type="text" placeholder="Ana Ferreira" value={regName} onChange={(e) => setRegName(e.target.value)} required />
            <Input label="Email" type="email" placeholder="nome@empresa.pt" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
            <Input label="Palavra-passe" type="password" placeholder="Mínimo 6 caracteres" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Perfil</label>
              <div className="flex gap-2">
                {([
                  { value: "estagiario", label: "📋 Estagiário" },
                  { value: "admin", label: "🔑 Admin" },
                ] as const).map((role) => (
                  <button key={role.value} type="button" onClick={() => setRegRole(role.value)} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${regRole === role.value ? "bg-primary-500 text-white border border-primary-500" : "bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300"}`}>
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" size="lg" isLoading={isLoading} className="mb-4">Criar conta</Button>

            <div className="text-center text-sm text-slate-600">
              Já tens conta?{" "}
              <button type="button" onClick={() => { setMode("login"); setError(null); }} className="text-primary-600 font-medium hover:underline">
                Faz login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;