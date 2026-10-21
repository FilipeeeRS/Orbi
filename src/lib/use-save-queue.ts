"use client";

import { startTransition, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

// Salvar sem travar a tela: quem chama já mudou o estado na hora; aqui as gravações entram numa fila
// (uma de cada vez, na ordem dos cliques) e a página só é atualizada quando a fila esvazia.
export function useSaveQueue() {
  const router = useRouter();
  const queue = useRef<Promise<void>>(Promise.resolve());
  const waiting = useRef(0);
  return useCallback(
    (task: () => Promise<void>) => {
      waiting.current++;
      queue.current = queue.current
        .then(task)
        .catch((e) => console.error("Orbi: não foi possível salvar", e))
        .finally(() => {
          if (--waiting.current === 0) startTransition(() => router.refresh());
        });
    },
    [router],
  );
}
