"use client";

import { useEffect, useRef, useState } from "react";

// Altura em que o menu gruda (top-32) e a partir da qual o título da seção conta como "lido".
const READ_LINE = 160;

// Menu lateral do Sobre: destaca a seção que está na tela enquanto a pessoa rola.
export function AboutNav({ items }: { items: { id: string; title: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  // Logo após um clique, a rolagem é do salto até a âncora: não deixa ela trocar o item escolhido.
  const lockUntil = useRef(0);

  useEffect(() => {
    function update() {
      if (Date.now() < lockUntil.current) return;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) return setActive(items[items.length - 1]?.id);
      // A última seção cujo título já passou da linha de leitura é a atual.
      let current = items[0]?.id;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= READ_LINE) current = item.id;
      }
      setActive(current);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [items]);

  return (
    // self-start: sem ele a grade estica o menu até a altura do texto e o sticky não tem para onde grudar.
    // top-32 (128px) = cabeçalho (64) + respiro do main (32) + respiro da página (32): gruda já na
    // posição em que nasce, então o menu não se mexe nada ao rolar.
    <nav className="sticky top-32 hidden self-start md:block">
      <ul className="space-y-0.5 border-e border-border">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={() => {
                lockUntil.current = Date.now() + 800;
                setActive(item.id);
              }}
              aria-current={item.id === active ? "location" : undefined}
              className={`-me-px block border-e-2 py-1.5 pe-4 text-[15px] transition ${
                item.id === active ? "border-fg text-fg" : "border-transparent text-muted hover:text-fg"
              }`}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
