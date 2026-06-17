import {
  SETTINGS_EVENT,
  readSettings
} from "../hooks/useLibraryIqSettings";
import { getInternalRating } from "../services/steamAppStore";
import type { LibraryIqSettings } from "../types";

type RowRenderer = ((args: unknown) => unknown) & {
  __libraryIqItemSwapPatched?: boolean;
  __libraryIqOriginalRowRenderer?: RowRenderer;
  __libraryIqOriginalRowCount?: number;
};

type VirtualGridInstance = {
  forceUpdate?: () => void;
  recomputeGridSize?: () => void;
  scrollToPosition?: (scrollTop: number) => void;
  state?: {
    scrollTop?: number;
  };
};

type VirtualListInstance = VirtualGridInstance & {
  forceUpdateGrid?: () => void;
  recomputeRowHeights?: (index?: number) => void;
  Grid?: VirtualGridInstance;
  _grid?: VirtualGridInstance;
  List?: VirtualGridInstance;
  _list?: VirtualGridInstance;
};

type AppRowInfo = {
  kind: "app";
  originalIndex: number;
  appid: string;
  rating: number | null;
  appProps: Record<string, unknown>;
};

type NonAppRowInfo = {
  kind: "nonApp";
  originalIndex: number;
};

type RowInfo = AppRowInfo | NonAppRowInfo;

type CachedPlan = {
  rowCount: number;
  rows: RowInfo[];
  displayRows: RowInfo[];
  signature: string;
};

type DomScrollSnapshot = {
  element: HTMLElement;
  scrollTop: number;
  scrollLeft: number;
};

type VirtualScrollSnapshot = {
  instance: VirtualListInstance;
  scrollTop: number | null;
};

type LibraryScrollSnapshot = {
  dom: DomScrollSnapshot[];
  virtual: VirtualScrollSnapshot[];
};

type PreservedClickHandler = ((
  this: unknown,
  ...args: unknown[]
) => unknown) & {
  __libraryIqScrollPreserved?: boolean;
};

let planCache = new WeakMap<RowRenderer, CachedPlan>();
const registeredVirtualLists = new Set<VirtualListInstance>();

function isSortOrFilterEnabled(settings: LibraryIqSettings): boolean {
  return settings.minimumRating !== null || settings.ratingSortMode !== "off";
}

function invalidatePlans() {
  planCache = new WeakMap<RowRenderer, CachedPlan>();
}

function refreshRegisteredVirtualLists() {
  invalidatePlans();

  const refresh = () => {
    for (const instance of registeredVirtualLists) {
      try {
        instance.recomputeRowHeights?.(0);
        instance.recomputeGridSize?.();
        instance.forceUpdateGrid?.();
        instance.Grid?.recomputeGridSize?.();
        instance.Grid?.forceUpdate?.();
        instance._grid?.recomputeGridSize?.();
        instance._grid?.forceUpdate?.();
        instance.forceUpdate?.();
      } catch {
        // Ignore Steam virtual list instances that do not support a method.
      }
    }

    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("scroll"));
  };

  refresh();
  window.requestAnimationFrame(refresh);
  window.setTimeout(refresh, 80);
  window.setTimeout(refresh, 180);
}

let refreshListenerInstalled = false;

function installRefreshListener() {
  if (refreshListenerInstalled) {
    return;
  }

  refreshListenerInstalled = true;

  window.addEventListener(SETTINGS_EVENT, () => {
    refreshRegisteredVirtualLists();
  });
}

function assignOriginalRef(
  originalRef: unknown,
  instance: VirtualListInstance | null
) {
  if (!originalRef) {
    return;
  }

  try {
    if (typeof originalRef === "function") {
      originalRef(instance);
      return;
    }

    if (typeof originalRef === "object" && "current" in originalRef) {
      (originalRef as { current: VirtualListInstance | null }).current =
        instance;
    }
  } catch {
    // Ignore refs that cannot be assigned.
  }
}

function createCapturedRef(originalRef: unknown) {
  return function libraryIqVirtualListRef(instance: VirtualListInstance | null) {
    if (instance) {
      registeredVirtualLists.add(instance);
    }

    assignOriginalRef(originalRef, instance);
  };
}

function getLibraryScrollContainers(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      ".ReactVirtualized__Grid, .ReactVirtualized__List, [role='grid'], [role='listbox'], div"
    )
  ).filter((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    const isLeftLibraryArea =
      rect.left < 380 && rect.width >= 120 && rect.width <= 430;

    const canScroll =
      element.scrollHeight > element.clientHeight + 2 &&
      element.clientHeight > 80;

    const allowsScroll =
      style.overflowY === "auto" ||
      style.overflowY === "scroll" ||
      style.overflow === "auto" ||
      style.overflow === "scroll";

    return isLeftLibraryArea && canScroll && allowsScroll;
  });
}

function readVirtualScrollTop(instance: VirtualListInstance): number | null {
  const candidates: Array<VirtualGridInstance | undefined> = [
    instance,
    instance.Grid,
    instance._grid,
    instance.List,
    instance._list
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      candidate.state &&
      typeof candidate.state.scrollTop === "number"
    ) {
      return candidate.state.scrollTop;
    }
  }

  return null;
}

function restoreVirtualScrollTop(
  instance: VirtualListInstance,
  scrollTop: number | null
) {
  if (typeof scrollTop !== "number") {
    return;
  }

  const candidates: Array<VirtualGridInstance | undefined> = [
    instance,
    instance.Grid,
    instance._grid,
    instance.List,
    instance._list
  ];

  for (const candidate of candidates) {
    try {
      candidate?.scrollToPosition?.(scrollTop);
      candidate?.recomputeGridSize?.();
      candidate?.forceUpdate?.();
    } catch {
      // Ignore unsupported virtual-list methods.
    }
  }

  try {
    instance.recomputeRowHeights?.(0);
    instance.forceUpdateGrid?.();
    instance.forceUpdate?.();
  } catch {
    // Ignore unsupported virtual-list methods.
  }
}

function captureLibraryScroll(): LibraryScrollSnapshot {
  return {
    dom: getLibraryScrollContainers().map((element) => ({
      element,
      scrollTop: element.scrollTop,
      scrollLeft: element.scrollLeft
    })),
    virtual: Array.from(registeredVirtualLists).map((instance) => ({
      instance,
      scrollTop: readVirtualScrollTop(instance)
    }))
  };
}

function restoreLibraryScroll(snapshot: LibraryScrollSnapshot) {
  for (const item of snapshot.dom) {
    try {
      item.element.scrollTop = item.scrollTop;
      item.element.scrollLeft = item.scrollLeft;
      item.element.dispatchEvent(new Event("scroll", { bubbles: true }));
    } catch {
      // Ignore detached DOM nodes.
    }
  }

  for (const item of snapshot.virtual) {
    restoreVirtualScrollTop(item.instance, item.scrollTop);
  }

  window.dispatchEvent(new Event("scroll"));
  window.dispatchEvent(new Event("resize"));
}

function scheduleLibraryScrollRestore(snapshot: LibraryScrollSnapshot) {
  restoreLibraryScroll(snapshot);

  window.requestAnimationFrame(() => restoreLibraryScroll(snapshot));
  window.setTimeout(() => restoreLibraryScroll(snapshot), 0);
  window.setTimeout(() => restoreLibraryScroll(snapshot), 40);
  window.setTimeout(() => restoreLibraryScroll(snapshot), 100);
  window.setTimeout(() => restoreLibraryScroll(snapshot), 220);
}

function runWithLibraryScrollPreserved<T>(action: () => T): T {
  const snapshot = captureLibraryScroll();

  try {
    const result = action();
    scheduleLibraryScrollRestore(snapshot);
    return result;
  } catch (error) {
    scheduleLibraryScrollRestore(snapshot);
    throw error;
  }
}

function stripShiftFromEvent(value: unknown): unknown {
  if (!value || typeof value !== "object") {
    return value;
  }

  const event = value as Record<PropertyKey, unknown>;

  const nativeEvent =
    event.nativeEvent && typeof event.nativeEvent === "object"
      ? new Proxy(event.nativeEvent as Record<PropertyKey, unknown>, {
          get(target, prop, receiver): unknown {
            if (prop === "shiftKey") {
              return false;
            }

            return Reflect.get(target, prop, receiver);
          }
        })
      : event.nativeEvent;

  return new Proxy(event, {
    get(target, prop, receiver): unknown {
      if (prop === "shiftKey") {
        return false;
      }

      if (prop === "nativeEvent") {
        return nativeEvent;
      }

      return Reflect.get(target, prop, receiver);
    }
  });
}

function wrapClickHandler(handler: unknown): unknown {
  if (typeof handler !== "function") {
    return handler;
  }

  const original = handler as PreservedClickHandler;

  if (original.__libraryIqScrollPreserved) {
    return handler;
  }

  const wrapped = function libraryIqScrollPreservedClickHandler(
    this: unknown,
    ...args: unknown[]
  ) {
    const safeArgs = args.map((arg) => stripShiftFromEvent(arg));

    return runWithLibraryScrollPreserved(() => original.apply(this, safeArgs));
  } as PreservedClickHandler;

  wrapped.__libraryIqScrollPreserved = true;

  return wrapped;
}

function getNumericAppId(value: unknown): string | null {
  if (
    typeof value === "number" ||
    (typeof value === "string" && /^\d+$/.test(value))
  ) {
    return String(value);
  }

  return null;
}

function getAppStoreMap(): Map<unknown, unknown> | null {
  const win = window as unknown as Record<string, unknown>;
  const appStore = win.appStore as Record<string, unknown> | undefined;
  const appMap = appStore?.m_mapApps;

  if (
    !appMap ||
    typeof appMap !== "object" ||
    typeof (appMap as Map<unknown, unknown>).get !== "function"
  ) {
    return null;
  }

  return appMap as Map<unknown, unknown>;
}

function getAppFromStore(appid: string): Record<string, unknown> | null {
  const appMap = getAppStoreMap();

  if (!appMap) {
    return null;
  }

  const app = appMap.get(Number(appid)) ?? appMap.get(appid);

  if (!app || typeof app !== "object") {
    return null;
  }

  return app as Record<string, unknown>;
}

function isRealSteamAppId(appid: string): boolean {
  return Boolean(appid && appid !== "0" && getAppFromStore(appid));
}

function getAppIdFromPossibleApp(value: unknown, depth = 0): string | null {
  const direct = getNumericAppId(value);

  if (direct && isRealSteamAppId(direct)) {
    return direct;
  }

  if (!value || typeof value !== "object" || depth > 4) {
    return null;
  }

  const obj = value as Record<string, unknown>;

  const possible =
    getNumericAppId(obj.appid) ??
    getNumericAppId(obj.appId) ??
    getNumericAppId(obj.unAppID) ??
    getNumericAppId(obj.nAppID) ??
    getNumericAppId(obj.m_unAppID) ??
    getNumericAppId(obj.m_unAppId) ??
    getNumericAppId(obj.id);

  if (possible && isRealSteamAppId(possible)) {
    return possible;
  }

  return (
    getAppIdFromPossibleApp(obj.app, depth + 1) ??
    getAppIdFromPossibleApp(obj.overview, depth + 1) ??
    getAppIdFromPossibleApp(obj.data, depth + 1) ??
    getAppIdFromPossibleApp(obj.props, depth + 1) ??
    null
  );
}

function getRatingForSorting(
  appid: string,
  settings: LibraryIqSettings
): number | null {
  const rating =
    settings.ratingSource === "api"
      ? getInternalRating(appid, {
          ...settings,
          ratingSource: "filtered"
        })
      : getInternalRating(appid, settings);

  if (
    rating &&
    rating.ok &&
    typeof rating.positive_percent === "number" &&
    Number.isFinite(rating.positive_percent)
  ) {
    return rating.positive_percent;
  }

  return null;
}

function makeSignature(settings: LibraryIqSettings, rowCount: number): string {
  return [
    rowCount,
    settings.ratingSource,
    settings.minimumRating ?? "off",
    settings.ratingSortMode
  ].join("|");
}

function makeSyntheticRowArgs(index: number): Record<string, unknown> {
  return {
    index,
    key: `library-iq-scan-${index}`,
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "28px"
    },
    isScrolling: false,
    isVisible: false,
    parent: null
  };
}

function isReactElement(value: unknown): value is Record<string, unknown> & {
  props: Record<string, unknown>;
} {
  return Boolean(
    value &&
      typeof value === "object" &&
      "props" in value &&
      typeof (value as Record<string, unknown>).props === "object"
  );
}

function findAppRowProps(
  value: unknown,
  depth = 0
): Record<string, unknown> | null {
  if (!value || depth > 8) {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findAppRowProps(item, depth + 1);

      if (found) {
        return found;
      }
    }

    return null;
  }

  if (!isReactElement(value)) {
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;

      for (const key of Object.keys(obj).slice(0, 20)) {
        if (key === "_owner" || key === "ref") {
          continue;
        }

        const found = findAppRowProps(obj[key], depth + 1);

        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  const props = value.props;

  if ("item" in props) {
    const appid = getAppIdFromPossibleApp(props.item);

    if (appid) {
      return props;
    }
  }

  if ("children" in props) {
    const found = findAppRowProps(props.children, depth + 1);

    if (found) {
      return found;
    }
  }

  for (const key of Object.keys(props).slice(0, 25)) {
    if (
      key === "children" ||
      key === "_owner" ||
      key === "ref" ||
      typeof props[key] === "function"
    ) {
      continue;
    }

    const found = findAppRowProps(props[key], depth + 1);

    if (found) {
      return found;
    }
  }

  return null;
}

function scanRows(
  rowRenderer: RowRenderer,
  rowCount: number,
  settings: LibraryIqSettings
): RowInfo[] {
  const rows: RowInfo[] = [];

  for (let index = 0; index < rowCount; index++) {
    try {
      const rendered = rowRenderer(makeSyntheticRowArgs(index));
      const appProps = findAppRowProps(rendered);
      const appid = appProps ? getAppIdFromPossibleApp(appProps.item) : null;

      if (!appid || !appProps) {
        rows.push({
          kind: "nonApp",
          originalIndex: index
        });

        continue;
      }

      rows.push({
        kind: "app",
        originalIndex: index,
        appid,
        rating: getRatingForSorting(appid, settings),
        appProps
      });
    } catch {
      rows.push({
        kind: "nonApp",
        originalIndex: index
      });
    }
  }

  return rows;
}

function transformAppRows(
  appRows: AppRowInfo[],
  settings: LibraryIqSettings
): AppRowInfo[] {
  let nextRows = appRows;

  if (settings.minimumRating !== null) {
    nextRows = nextRows.filter(
      (row) =>
        typeof row.rating === "number" && row.rating >= settings.minimumRating!
    );
  }

  if (settings.ratingSortMode !== "off") {
    nextRows = [...nextRows].sort((a, b) => {
      const aHasRating = typeof a.rating === "number";
      const bHasRating = typeof b.rating === "number";

      if (aHasRating && !bHasRating) {
        return -1;
      }

      if (!aHasRating && bHasRating) {
        return 1;
      }

      const ratingA = a.rating ?? -1;
      const ratingB = b.rating ?? -1;

      if (settings.ratingSortMode === "highestFirst") {
        return ratingB - ratingA;
      }

      return ratingA - ratingB;
    });
  }

  return nextRows;
}

function applyFilterAndSort(
  rows: RowInfo[],
  settings: LibraryIqSettings
): RowInfo[] {
  const hasGroupedOrHeaderRows = rows.some((row) => row.kind === "nonApp");

  if (!hasGroupedOrHeaderRows) {
    return transformAppRows(rows as AppRowInfo[], settings);
  }

  const result: RowInfo[] = [];
  let appGroup: AppRowInfo[] = [];

  function flushAppGroup() {
    if (appGroup.length < 1) {
      return;
    }

    result.push(...transformAppRows(appGroup, settings));
    appGroup = [];
  }

  for (const row of rows) {
    if (row.kind === "app") {
      appGroup.push(row);
      continue;
    }

    flushAppGroup();
    result.push(row);
  }

  flushAppGroup();

  return result;
}

function getPlan(
  rowRenderer: RowRenderer,
  rowCount: number,
  settings: LibraryIqSettings
): CachedPlan {
  const signature = makeSignature(settings, rowCount);
  const cached = planCache.get(rowRenderer);

  if (cached && cached.signature === signature) {
    return cached;
  }

  const rows = scanRows(rowRenderer, rowCount, settings);
  const displayRows = applyFilterAndSort(rows, settings);

  const plan: CachedPlan = {
    rowCount,
    rows,
    displayRows,
    signature
  };

  planCache.set(rowRenderer, plan);

  return plan;
}

function getVirtualIndex(rowArgs: unknown): number {
  if (!rowArgs || typeof rowArgs !== "object") {
    return 0;
  }

  const obj = rowArgs as Record<string, unknown>;

  return typeof obj.index === "number" ? obj.index : 0;
}

function getRowStyle(rowArgs: unknown): unknown {
  if (!rowArgs || typeof rowArgs !== "object") {
    return undefined;
  }

  return (rowArgs as Record<string, unknown>).style;
}

function patchElementStyle(value: unknown, style: unknown): unknown {
  if (!isReactElement(value) || !style) {
    return value;
  }

  return {
    ...value,
    props: {
      ...value.props,
      style
    }
  };
}

function wrapClickHandlers(
  value: unknown,
  depth = 0
): { value: unknown; patched: boolean } {
  if (!value || depth > 8) {
    return { value, patched: false };
  }

  if (Array.isArray(value)) {
    let patchedAny = false;

    const nextArray = value.map((item) => {
      const result = wrapClickHandlers(item, depth + 1);

      if (result.patched) {
        patchedAny = true;
      }

      return result.value;
    });

    return {
      value: patchedAny ? nextArray : value,
      patched: patchedAny
    };
  }

  if (!isReactElement(value)) {
    return { value, patched: false };
  }

  const props = value.props;
  let patched = false;
  let nextProps = props;

  const handlerNames = [
    "onClick",
    "onClickCapture",
    "onMouseDown",
    "onMouseDownCapture",
    "onMouseUp",
    "onMouseUpCapture",
    "onPointerDown",
    "onPointerDownCapture",
    "onPointerUp",
    "onPointerUpCapture",
    "onDoubleClick"
  ];

  for (const handlerName of handlerNames) {
    if (typeof nextProps[handlerName] === "function") {
      nextProps = {
        ...nextProps,
        [handlerName]: wrapClickHandler(nextProps[handlerName])
      };
      patched = true;
    }
  }

  // Steam's native range selection uses the original unsorted row indexes.
  // When LibraryIQ sorting/filtering is active, disable range-select plumbing
  // so Shift-click cannot highlight the wrong unsorted range.
  if (typeof nextProps.fnSelectAppsInRange === "function") {
    nextProps = {
      ...nextProps,
      fnSelectAppsInRange: (): undefined => undefined
    };
    patched = true;
  }

  if (nextProps.shiftKey === true) {
    nextProps = {
      ...nextProps,
      shiftKey: false
    };
    patched = true;
  }

  if ("children" in props) {
    const childResult = wrapClickHandlers(props.children, depth + 1);

    if (childResult.patched) {
      nextProps = {
        ...nextProps,
        children: childResult.value
      };
      patched = true;
    }
  }

  if (!patched) {
    return { value, patched: false };
  }

  return {
    value: {
      ...value,
      props: nextProps
    },
    patched: true
  };
}

function renderNonAppRow(
  originalRowRenderer: RowRenderer,
  rowArgs: unknown,
  originalIndex: number
): unknown {
  const rendered = originalRowRenderer({
    ...(rowArgs && typeof rowArgs === "object"
      ? (rowArgs as Record<string, unknown>)
      : {}),
    index: originalIndex
  });

  return patchElementStyle(rendered, getRowStyle(rowArgs));
}

function renderAppRowWithTargetGame(
  originalRowRenderer: RowRenderer,
  rowArgs: unknown,
  targetRow: AppRowInfo
): unknown {
  const rowArgsObj =
    rowArgs && typeof rowArgs === "object"
      ? (rowArgs as Record<string, unknown>)
      : {};

  const renderedTarget = originalRowRenderer({
    ...rowArgsObj,
    index: targetRow.originalIndex
  });

  const positionedTarget = patchElementStyle(renderedTarget, getRowStyle(rowArgs));
  const wrappedTarget = wrapClickHandlers(positionedTarget);

  return wrappedTarget.value;
}

export function patchLibraryListProps(props: unknown): unknown {
  installRefreshListener();

  if (!props || typeof props !== "object") {
    return props;
  }

  const obj = props as Record<string, unknown>;

  if (
    !("rowCount" in obj) ||
    !("rowRenderer" in obj) ||
    typeof obj.rowRenderer !== "function" ||
    typeof obj.rowCount !== "number"
  ) {
    return props;
  }

  const incomingRowRenderer = obj.rowRenderer as RowRenderer;
  const incomingRowCount = obj.rowCount;

  if (incomingRowRenderer.__libraryIqItemSwapPatched) {
    const originalRowRenderer =
      incomingRowRenderer.__libraryIqOriginalRowRenderer ?? incomingRowRenderer;
    const originalRowCount =
      incomingRowRenderer.__libraryIqOriginalRowCount ?? incomingRowCount;

    const settingsAtRender = readSettings();
    const planAtRender = isSortOrFilterEnabled(settingsAtRender)
      ? getPlan(originalRowRenderer, originalRowCount, settingsAtRender)
      : null;

    return {
      ...obj,
      ref: createCapturedRef(obj.ref),
      rowCount: planAtRender ? planAtRender.displayRows.length : originalRowCount
    };
  }

  const originalRowRenderer = incomingRowRenderer;
  const originalRowCount = incomingRowCount;

  const settingsAtRender = readSettings();
  const planAtRender = isSortOrFilterEnabled(settingsAtRender)
    ? getPlan(originalRowRenderer, originalRowCount, settingsAtRender)
    : null;

  const patchedRowRenderer = function libraryIqItemSwapRowRenderer(
    this: unknown,
    rowArgs: unknown
  ) {
    const liveSettings = readSettings();

    if (!isSortOrFilterEnabled(liveSettings)) {
      return originalRowRenderer.call(this, rowArgs);
    }

    const livePlan = getPlan(originalRowRenderer, originalRowCount, liveSettings);
    const virtualIndex = getVirtualIndex(rowArgs);
    const mappedRow = livePlan.displayRows[virtualIndex];

    if (!mappedRow) {
      return null;
    }

    if (mappedRow.kind === "nonApp") {
      return renderNonAppRow(
        originalRowRenderer.bind(this) as RowRenderer,
        rowArgs,
        mappedRow.originalIndex
      );
    }

    return renderAppRowWithTargetGame(
      originalRowRenderer.bind(this) as RowRenderer,
      rowArgs,
      mappedRow
    );
  } as RowRenderer;

  patchedRowRenderer.__libraryIqItemSwapPatched = true;
  patchedRowRenderer.__libraryIqOriginalRowRenderer = originalRowRenderer;
  patchedRowRenderer.__libraryIqOriginalRowCount = originalRowCount;

  return {
    ...obj,
    ref: createCapturedRef(obj.ref),
    rowCount: planAtRender ? planAtRender.displayRows.length : originalRowCount,
    rowRenderer: patchedRowRenderer
  };
}
