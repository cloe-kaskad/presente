import { redirect } from "next/navigation";

/** L'ancienne adresse : l'échange à deux s'appelle maintenant /a-deux. */
export default function AncienneAdresse() {
  redirect("/a-deux");
}
