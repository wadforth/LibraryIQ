import { debugLog } from "../services/debug";

const LIBRARY_CONTEXT_EVENT = "library-iq-library-context-observed";

let lastObservedAt = 0;
let observedCount = 0;

export function markLibraryContextObserved() {
  // Steam's client-side page changes are not always reflected in location.href.
  // Sidebar row rendering is the safest signal currently available for Library.
  lastObservedAt = Date.now();
  observedCount += 1;

  if (observedCount === 1 || observedCount % 50 === 0) {
    debugLog("libraryContext", "observed Library sidebar render", {
      observedCount,
      href: window.location.href,
      bodyClassName: document.body?.className ?? ""
    });
  }

  window.dispatchEvent(new Event(LIBRARY_CONTEXT_EVENT));
}

export function getLastLibraryContextObservedAt() {
  return lastObservedAt;
}

export function addLibraryContextListener(listener: () => void) {
  window.addEventListener(LIBRARY_CONTEXT_EVENT, listener);

  return () => {
    window.removeEventListener(LIBRARY_CONTEXT_EVENT, listener);
  };
}
