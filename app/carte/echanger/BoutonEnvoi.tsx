"use client";

import { useFormStatus } from "react-dom";

export function BoutonEnvoi() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="bouton bouton--grand" disabled={pending}>
      {pending ? "On recalcule…" : "Échanger"}
    </button>
  );
}
