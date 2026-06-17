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
    const status = installSidebarRatingPatch();
    console.log("[LibraryIQ]", status);
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
