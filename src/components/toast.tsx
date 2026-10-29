"use client";

import { createContext, use, useCallback, useEffect, useRef, useState } from "react";

// Avisos curtos embaixo da tela depois de uma ação ("Adicionado à watchlist · Desfazer").
// Somem sozinhos em alguns segundos; erros ficam em vermelho.
type Toast = {
  id: number;
  message: string;
  tone?: "default" | "error";
  action?: { label: string; onClick: () => void };
};
type Show = (toast: Omit<Toast, "id">) => void;

const ToastContext = createContext<Show>(() => {});

export function useToast() {
  return use(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const show = useCallback<Show>((toast) => {
    const id = ++seq.current;
    // No máximo 3 de cada vez: o mais antigo sai
    setToasts((list) => [...list.slice(-2), { ...toast, id }]);
  }, []);

  return (
    <ToastContext value={show}>
      {children}
      {/* Acima da barra de baixo do celular */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDone={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext>
  );
}

function ToastItem({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, toast.action ? 6000 : 3500);
    return () => clearTimeout(timer);
  }, [onDone, toast.action]);

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex max-w-md items-center gap-4 rounded-lg border px-4 py-2.5 text-sm shadow-2xl ${
        toast.tone === "error" ? "border-danger/50 bg-surface text-danger" : "border-border bg-surface text-fg"
      }`}
    >
      <span>{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action!.onClick();
            onDone();
          }}
          className="shrink-0 font-semibold text-accent hover:underline"
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
