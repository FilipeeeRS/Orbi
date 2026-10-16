import { OrbiMark } from "@/components/logo";

// Carregando: a logo do Orbi com a lua orbitando, na metade da intensidade da cor do texto.
export default function Loading() {
  return (
    <div className="grid min-h-[50vh] place-items-center" aria-busy="true" role="status" aria-label="Loading">
      <OrbiMark className="size-16 text-fg opacity-50" />
    </div>
  );
}
