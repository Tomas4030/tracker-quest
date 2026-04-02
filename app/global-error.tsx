"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt">
      <body>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-navy">
              Erro crítico da aplicação
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Foi detetada uma falha global. Tenta reiniciar a página.
            </p>
            <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-700">
              {error.message || "Sem detalhe de erro"}
            </pre>
            <button
              onClick={reset}
              className="mt-4 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
            >
              Recarregar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
