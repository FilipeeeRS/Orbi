"use client";

import { useEffect, useRef } from "react";

// Coloca a órbita da lua no relógio da página (startTime = 0 na linha do tempo do documento),
// assim toda logo que aparecer (cabeçalho, carregamento...) fica na mesma posição que as outras.
export function OrbitSync() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const mark = ref.current?.parentElement;
    if (!mark?.getAnimations) return;
    for (const animation of mark.getAnimations({ subtree: true })) animation.startTime = 0;
  }, []);

  return <span ref={ref} hidden />;
}
