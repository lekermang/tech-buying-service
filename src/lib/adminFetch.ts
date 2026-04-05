export function adminHeaders(token: string, extra?: Record<string, string>): Record<string, string> {
  return {
    "X-Admin-Token": btoa(unescape(encodeURIComponent(token))),
    ...extra,
  };
}
