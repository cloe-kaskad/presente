"use client";

import type { ReactNode } from "react";
import { noterDepuisLeNavigateur } from "@/app/semaine/actions";

/** Un lien externe dont on compte l'ouverture (jamais autre chose que le fait de l'avoir ouvert). */
export function LienSuivi({ href, className, type, semaine, cle, children }: { href: string; className?: string; type: string; semaine?: number; cle?: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={() => void noterDepuisLeNavigateur(type, semaine, cle).catch(() => null)}>
      {children}
    </a>
  );
}
