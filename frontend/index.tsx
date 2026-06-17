import { Millennium, definePlugin } from "@steambrew/client";
import { Component, type ReactNode, useEffect } from "react";
import { LibraryIqSettingsPanel } from "./components/LibraryIqSettingsPanel";
import { QuickFilterBar } from "./components/QuickFilterBar";
import { installSidebarRatingPatch } from "./steam/sidebarPatch";

class QuickFilterErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);

    this.state = {
      hasError: false
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true
    };
  }

  componentDidCatch(error: unknown) {
    console.error("[LibraryIQ] Quick filter crashed", error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

function SteamRatingsLibraryInjector() {
  useEffect(() => {
    const ensurePatchInstalled = () => {
      const status = installSidebarRatingPatch();

      if (status.startsWith("reinstalled")) {
        console.info("[LibraryIQ]", status);
      }

      if (
        !status.startsWith("installed") &&
        !status.startsWith("reinstalled") &&
        status !== "already installed"
      ) {
        console.warn("[LibraryIQ]", status);
      }
    };

    ensurePatchInstalled();

    const intervalId = window.setInterval(ensurePatchInstalled, 2000);
    const timeoutIds = [250, 1000, 5000].map((delay) =>
      window.setTimeout(ensurePatchInstalled, delay)
    );

    window.addEventListener("focus", ensurePatchInstalled);
    document.addEventListener("visibilitychange", ensurePatchInstalled);

    return () => {
      window.clearInterval(intervalId);

      for (const timeoutId of timeoutIds) {
        window.clearTimeout(timeoutId);
      }

      window.removeEventListener("focus", ensurePatchInstalled);
      document.removeEventListener("visibilitychange", ensurePatchInstalled);
    };
  }, []);

  return (
    <QuickFilterErrorBoundary>
      <QuickFilterBar />
    </QuickFilterErrorBoundary>
  );
}

function steamRatingsLibrary() {
  return {
    SteamRatingsLibraryInjector
  };
}

Millennium.exposeObj({
  steamRatingsLibrary
});

export default definePlugin(() => {
  return {
    title: "LibraryIQ",
    icon: <span>★</span>,
    content: <LibraryIqSettingsPanel />
  };
});
