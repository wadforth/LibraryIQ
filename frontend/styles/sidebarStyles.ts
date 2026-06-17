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
    }
  `;

  document.head.appendChild(style);
}
