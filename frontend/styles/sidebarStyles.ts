const STYLE_ID = "library-iq-sidebar-rating-style";

export function installSidebarStyles() {
  const existing = document.getElementById(STYLE_ID);

  if (existing) {
    existing.remove();
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;

  style.textContent = `
    .library-iq-sidebar-host {
      display: flex !important;
      align-items: center !important;
      width: 100% !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
    }

    .library-iq-icon-rating-wrap {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: flex-start !important;
      flex: 0 0 var(--library-iq-icon-rating-width, 76px) !important;
      width: var(--library-iq-icon-rating-width, 76px) !important;
      min-width: var(--library-iq-icon-rating-width, 76px) !important;
      max-width: var(--library-iq-icon-rating-width, 76px) !important;
      gap: var(--library-iq-icon-badge-gap, 7px) !important;
      margin-right: var(--library-iq-icon-rating-margin-right, 0px) !important;
      padding-right: var(--library-iq-badge-title-spacing, 5px) !important;
      box-sizing: border-box !important;
      overflow: visible !important;
      vertical-align: middle !important;
    }

    .library-iq-rating-badge {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex: 0 0 40px !important;
      width: 40px !important;
      min-width: 40px !important;
      max-width: 40px !important;
      height: 16px !important;
      padding: 0 5px !important;
      border-radius: 999px !important;
      box-sizing: border-box !important;
      font-family: Arial, Helvetica, sans-serif !important;
      font-size: 10px !important;
      font-weight: 800 !important;
      line-height: 16px !important;
      letter-spacing: 0px !important;
      white-space: nowrap !important;
      user-select: none !important;
      pointer-events: auto !important;
      text-align: center !important;
      -webkit-font-smoothing: antialiased !important;
      -moz-osx-font-smoothing: grayscale !important;
      position: relative !important;
      color: var(--library-iq-badge-color, rgba(236, 242, 248, 0.98)) !important;
      background: var(--library-iq-badge-background, rgba(72, 86, 103, 0.58)) !important;
      border: var(--library-iq-badge-border, 1px solid rgba(166, 185, 205, 0.32)) !important;
      box-shadow: var(--library-iq-badge-shadow, none) !important;
    }

    .library-iq-rating-badge::before,
    .library-iq-rating-badge::after,
    .library-iq-rating-badge *::before,
    .library-iq-rating-badge *::after {
      content: none !important;
      display: none !important;
      animation: none !important;
    }

    .library-iq-rating-badge,
    .library-iq-rating-badge * {
      visibility: visible !important;
      color: var(--library-iq-badge-color, rgba(236, 242, 248, 0.98)) !important;
      text-shadow: none !important;
      -webkit-text-fill-color: var(--library-iq-badge-color, rgba(236, 242, 248, 0.98)) !important;
    }

    .library-iq-sidebar-host .library-iq-rating-badge {
      width: var(--library-iq-badge-width, 40px) !important;
      min-width: var(--library-iq-badge-width, 40px) !important;
      max-width: var(--library-iq-badge-width, 40px) !important;
    }

    .library-iq-sidebar-host > .library-iq-rating-badge-beforeIcon,
    .library-iq-sidebar-host > .library-iq-rating-badge-betweenIconAndTitle {
      margin-right: var(--library-iq-badge-right-spacing, 5px) !important;
    }

    .library-iq-sidebar-host > .library-iq-rating-badge-afterTitle {
      margin-left: 0 !important;
    }

    .library-iq-sidebar-host-afterTitle {
      position: relative !important;
      padding-right: 0 !important;
    }

    .library-iq-sidebar-host-afterTitle.library-iq-theme-minimal-dark {
      display: flex !important;
      align-items: center !important;
      overflow: visible !important;
      white-space: nowrap !important;
      padding-right: calc(var(--library-iq-badge-width, 40px) + 12px) !important;
    }

    .library-iq-theme-minimal-dark-active .library-iq-sidebar-host-afterTitle {
      position: relative !important;
      display: flex !important;
      align-items: center !important;
      overflow: visible !important;
      white-space: nowrap !important;
      padding-right: calc(var(--library-iq-badge-width, 40px) + 12px) !important;
    }

    .library-iq-sidebar-host-afterTitle > :not(.library-iq-rating-badge-afterTitle) {
      min-width: 0 !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .library-iq-sidebar-host-afterTitle > .library-iq-rating-badge-afterTitle {
      position: relative !important;
      flex: 0 0 var(--library-iq-badge-width, 40px) !important;
      right: auto !important;
      top: auto !important;
      margin-left: auto !important;
      margin-right: 0 !important;
      transform: none !important;
      z-index: 2 !important;
    }

    .library-iq-sidebar-host-afterTitle.library-iq-theme-minimal-dark > .library-iq-rating-badge-afterTitle {
      position: absolute !important;
      right: 4px !important;
      top: 50% !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
      transform: translateY(-50%) !important;
      z-index: 3 !important;
    }

    .library-iq-theme-minimal-dark-active .library-iq-sidebar-host-afterTitle > .library-iq-rating-badge-afterTitle {
      position: absolute !important;
      right: 4px !important;
      left: auto !important;
      top: 50% !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
      transform: translateY(-50%) !important;
      z-index: 3 !important;
    }

    .library-iq-theme-minimal-dark-active .library-iq-sidebar-host-afterTitle .library-iq-rating-badge-afterTitle {
      position: absolute !important;
      right: 4px !important;
      left: auto !important;
      top: 50% !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
      transform: translateY(-50%) !important;
      z-index: 3 !important;
    }

    .library-iq-theme-minimal-dark-active .library-iq-minimal-dark-after-title-row {
      position: relative !important;
      box-sizing: border-box !important;
      padding-right: calc(var(--library-iq-badge-width, 40px) + 12px) !important;
    }

    .library-iq-theme-minimal-dark-active .library-iq-minimal-dark-after-title-row .library-iq-sidebar-host-afterTitle {
      padding-right: calc(var(--library-iq-badge-width, 40px) + 12px) !important;
    }

    .library-iq-theme-minimal-dark-active .library-iq-minimal-dark-after-title-row > .library-iq-rating-badge-afterTitle {
      position: absolute !important;
      right: 6px !important;
      left: auto !important;
      top: 50% !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
      transform: translateY(-50%) !important;
      z-index: 5 !important;
    }

    .library-iq-theme-minimal-dark-active .library-iq-minimal-dark-after-title-row > .library-iq-rating-badge-placeholder {
      display: none !important;
    }

    .library-iq-theme-minimal-dark-active [data-library-iq-quick-filter] {
      position: fixed !important;
      z-index: 2147483647 !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      isolation: isolate !important;
      transform: translateZ(0) !important;
      filter: none !important;
    }

    .library-iq-theme-minimal-dark-active [data-library-iq-quick-filter] button {
      background: rgba(42, 71, 94, 0.98) !important;
      border: 1px solid rgba(102, 192, 244, 0.75) !important;
      color: rgba(255, 255, 255, 0.98) !important;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.65) !important;
    }
  `;

  document.head.appendChild(style);
}
