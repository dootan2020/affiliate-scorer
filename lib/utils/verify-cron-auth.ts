// Verify Vercel cron authorization header
export function verifyCronAuth(request: Request): boolean {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  return auth === `Bearer ${secret}`;
}
