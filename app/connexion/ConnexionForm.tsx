"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";
import styles from "./page.module.css";

const initial: LoginState = { status: "idle" };

export function ConnexionForm({ erreurInitiale }: { erreurInitiale?: string }) {
  const [state, action, pending] = useActionState(sendMagicLink, initial);

  if (state.status === "sent") {
    return (
      <div className={styles.envoye} role="status" aria-live="polite">
        <p>
          <strong>C&apos;est parti.</strong> Un lien de connexion vient d&apos;être envoyé à{" "}
          <strong>{state.email}</strong>.
        </p>
        <p>Ouvre-le depuis ta boîte mail. Il est valable une heure.</p>
        <p className={styles.petit}>
          Rien reçu au bout de deux minutes ? Regarde dans les indésirables, ou{" "}
          <a href="/connexion">redemande un lien</a>.
        </p>
      </div>
    );
  }

  const erreur = state.status === "error" ? state.message : erreurInitiale;

  return (
    <form action={action} className={styles.form} noValidate>
      <label htmlFor="email" className={styles.label}>
        Ton email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        className="champ"
        placeholder="toi@exemple.fr"
        defaultValue={state.status === "error" ? state.email : undefined}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur ? "erreur-connexion" : undefined}
      />
      {erreur ? (
        <p id="erreur-connexion" className={styles.erreur} role="alert">
          {erreur}
        </p>
      ) : null}
      <button type="submit" className="bouton bouton--grand" disabled={pending}>
        {pending ? "Envoi du lien…" : "Recevoir mon lien de connexion"}
      </button>
    </form>
  );
}
