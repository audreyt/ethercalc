export function isAllowedWebSocketOrigin(
  request: Request,
  configuredOrigin: string | null | undefined,
  hasSessionCookie: boolean,
): boolean {
  const origin = request.headers.get('Origin');
  if (origin === null) return !hasSessionCookie;
  return origin === (configuredOrigin || new URL(request.url).origin);
}
