export function isSessionActive(expiresAt: number, now: number): boolean {
  return now < expiresAt;
}
