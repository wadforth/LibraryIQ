import type { WebpackRequire } from "../types";

export function getWebpackRequire(): WebpackRequire | null {
  const win = window as unknown as {
    webpackChunksteamui?: unknown[];
  };

  try {
    let capturedRequire: WebpackRequire | null = null;

    win.webpackChunksteamui = win.webpackChunksteamui || [];

    win.webpackChunksteamui.push([
      [`library-iq-sidebar-rating-${Date.now()}`],
      {},
      (req: WebpackRequire) => {
        capturedRequire = req;
      }
    ]);

    return capturedRequire;
  } catch (error) {
    console.error("[LibraryIQ] Failed to capture webpack require", error);
    return null;
  }
}

export function findJsxRuntime(req: WebpackRequire): {
  moduleId: string;
  runtime: Record<string, unknown>;
} | null {
  const moduleIds = Object.keys(req.m ?? {});
  const preferredIds = ["62540", "44846"];

  for (const id of [...preferredIds, ...moduleIds]) {
    try {
      const runtime = req(id) as Record<string, unknown>;

      if (
        runtime &&
        typeof runtime === "object" &&
        typeof runtime.jsx === "function" &&
        typeof runtime.jsxs === "function"
      ) {
        return {
          moduleId: String(id),
          runtime
        };
      }
    } catch {
      // Ignore modules that fail during require.
    }
  }

  return null;
}