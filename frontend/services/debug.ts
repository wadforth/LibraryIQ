const DEBUG_ENABLED = false;

const seenKeys = new Set<string>();

function toDebugJson(data: unknown): string {
  try {
    return JSON.stringify(data);
  } catch {
    return '"[unserializable]"';
  }
}

export function debugLog(scope: string, message: string, data?: unknown) {
  if (!DEBUG_ENABLED) {
    return;
  }

  const suffix = data === undefined ? "" : ` ${toDebugJson(data)}`;

  console.info(`[LibraryIQ debug] ${scope}: ${message}${suffix}`);
}

export function debugLogOnce(
  key: string,
  scope: string,
  message: string,
  data?: unknown
) {
  if (seenKeys.has(key)) {
    return;
  }

  seenKeys.add(key);
  debugLog(scope, message, data);
}
