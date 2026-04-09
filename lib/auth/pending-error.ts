let pendingAuthError: string | null = null;

export function setPendingAuthError(msg: string) {
  pendingAuthError = msg;
}

export function consumePendingAuthError(): string | null {
  const e = pendingAuthError;
  pendingAuthError = null;
  return e;
}
