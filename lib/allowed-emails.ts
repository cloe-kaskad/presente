/**
 * Liste blanche de la démo : seuls les emails de ALLOWED_EMAILS peuvent se connecter.
 * Variable d'environnement, emails séparés par des virgules (ou des espaces, ou des retours à la ligne).
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseAllowedEmails(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(/[\s,;]+/)
      .map(normalizeEmail)
      .filter((e) => e.length > 0),
  );
}

export function isEmailAllowed(
  email: string | null | undefined,
  raw: string | undefined = process.env.ALLOWED_EMAILS,
): boolean {
  if (!email) return false;
  return parseAllowedEmails(raw).has(normalizeEmail(email));
}
