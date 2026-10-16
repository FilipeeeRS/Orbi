"use client";

import { useState, useTransition } from "react";
import { useI18n } from "./i18n";
import { translateText } from "@/app/translate-actions";

// Texto de review ou comentário com "Traduzir" embaixo (estilo Twitter): mostra a tradução no
// idioma do site e "Ver original" para voltar. Se já estiver no idioma da pessoa, o botão some.
// before / children: outras ações na mesma linha, antes e depois do "Traduzir"
// (nos comentários: Responder · Traduzir · Apagar).
export function TranslatableText({
  text,
  className,
  before,
  children,
}: {
  text: string;
  className?: string;
  before?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { t } = useI18n();
  const [translated, setTranslated] = useState<string | null>(null);
  const [showing, setShowing] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  function toggle() {
    if (translated) return setShowing(!showing);
    setError(false);
    start(async () => {
      const result = await translateText(text);
      if (!result) return setError(true);
      if (result.sameLanguage) return setHidden(true);
      setTranslated(result.text);
      setShowing(true);
    });
  }

  return (
    <div>
      <p className={className}>{showing && translated ? translated : text}</p>
      {(!hidden || before || children) && (
        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs">
          {before}
          {!hidden && (
            <button
              type="button"
              onClick={toggle}
              disabled={pending}
              className={`transition ${error ? "text-danger" : "text-muted hover:text-accent"} disabled:animate-pulse`}
            >
              {error ? t.translate.error : pending ? t.translate.translating : showing ? t.translate.original : t.translate.translate}
            </button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
