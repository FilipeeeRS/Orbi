import { Fragment, type ReactNode } from "react";

// Troca as marcas {nome} de um texto do dicionário por elementos (links, negrito...), na ordem que
// cada idioma escolher: fill("Aceito os {terms} e a {privacy}.", { terms: <Link/>, privacy: <Link/> }).
export function fill(template: string, parts: Record<string, ReactNode>) {
  return template.split(/(\{\w+\})/).map((piece, i) => {
    const key = /^\{(\w+)\}$/.exec(piece)?.[1];
    return <Fragment key={i}>{key && key in parts ? parts[key] : piece}</Fragment>;
  });
}
