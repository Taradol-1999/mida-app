/**
 * Uses the address supplied by the trusted proxy in front of the application.
 * This value is for activity reporting only; never use it as an authentication
 * or authorization signal because forwarded headers can be spoofed on an
 * incorrectly configured proxy.
 */
export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidate = request.headers.get("cf-connecting-ip") ?? forwarded ?? request.headers.get("x-real-ip");
  if (!candidate || candidate.length > 45) return null;
  return candidate;
}
