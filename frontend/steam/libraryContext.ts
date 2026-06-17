const LIBRARY_CONTEXT_EVENT = "library-iq-library-context-observed";

let lastObservedAt = 0;

export function markLibraryContextObserved() {
  // Steam's client-side page changes are not always reflected in location.href.
  // Sidebar row rendering is the safest signal currently available for Library.
  lastObservedAt = Date.now();
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
