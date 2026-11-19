"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Mantra } from "@/components/Mantra";

/** Entre la carte et la première visite de son espace : quelques phrases, puis son chemin. */
export function Bienvenue() {
  const router = useRouter();
  useEffect(() => {
    router.prefetch("/chemin");
    const t = setTimeout(() => router.replace("/chemin"), 7600);
    return () => clearTimeout(t);
  }, [router]);
  return <Mantra defile surtitre="/ On ouvre ton espace" />;
}
