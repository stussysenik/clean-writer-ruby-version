/**
 * Overlap Detection Dev Utility
 * Keyboard shortcuts:
 *   - Cmd+Shift+Alt+O (primary)
 *   - Cmd+Shift+Alt+D (secondary)
 * Auto-rescans on window resize when active (debounced 300ms).
 * Zero runtime cost when inactive.
 */
export function initOverlapDebug() {
  let active = false;
  let overlayEls: HTMLElement[] = [];
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;

  const SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "HEAD",
    "META",
    "LINK",
    "BR",
    "HR",
    "NOSCRIPT",
    "TEMPLATE",
  ]);

  function rectsOverlap(a: DOMRect, b: DOMRect): boolean {
    return !(
      a.right <= b.left ||
      a.left >= b.right ||
      a.bottom <= b.top ||
      a.top >= b.bottom
    );
  }

  function isAncestor(a: Element, b: Element): boolean {
    return a.contains(b) || b.contains(a);
  }

  function runSweep() {
    cleanup();

    const allElements = document.querySelectorAll("body *");
    const visible: { el: Element; rect: DOMRect }[] = [];

    allElements.forEach((el) => {
      if (SKIP_TAGS.has(el.tagName)) return;
      // Skip our own debug overlays
      if (el.hasAttribute("data-overlap-debug")) return;
      // Skip elements explicitly marked to ignore
      if (el.hasAttribute("data-overlap-ignore")) return;

      const style = getComputedStyle(el);
      if (
        style.display === "none" ||
        style.visibility === "hidden"
      ) {
        return;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      visible.push({ el, rect });
    });

    const overlaps: { a: Element; b: Element; rect: DOMRect }[] = [];

    for (let i = 0; i < visible.length; i++) {
      for (let j = i + 1; j < visible.length; j++) {
        const a = visible[i];
        const b = visible[j];

        // Skip parent-child pairs
        if (isAncestor(a.el, b.el)) continue;

        if (rectsOverlap(a.rect, b.rect)) {
          // Compute intersection rect
          const left = Math.max(a.rect.left, b.rect.left);
          const top = Math.max(a.rect.top, b.rect.top);
          const right = Math.min(a.rect.right, b.rect.right);
          const bottom = Math.min(a.rect.bottom, b.rect.bottom);

          const intersectionArea = (right - left) * (bottom - top);
          const smallerArea = Math.min(
            a.rect.width * a.rect.height,
            b.rect.width * b.rect.height,
          );

          // Only flag if overlap is >= 10% of the smaller element
          if (intersectionArea / smallerArea >= 0.1) {
            overlaps.push({
              a: a.el,
              b: b.el,
              rect: new DOMRect(left, top, right - left, bottom - top),
            });
          }
        }
      }
    }

    // Inject overlays
    for (const overlap of overlaps) {
      const overlay = document.createElement("div");
      overlay.setAttribute("data-overlap-debug", "true");
      overlay.style.cssText = `
        position: fixed;
        left: ${overlap.rect.left}px;
        top: ${overlap.rect.top}px;
        width: ${overlap.rect.width}px;
        height: ${overlap.rect.height}px;
        border: 2px dashed red;
        background: rgba(255, 0, 0, 0.08);
        pointer-events: none;
        z-index: 99999;
        box-sizing: border-box;
      `;
      overlay.title = `Overlap: <${overlap.a.tagName.toLowerCase()}> x <${overlap.b.tagName.toLowerCase()}>`;
      document.body.appendChild(overlay);
      overlayEls.push(overlay);
    }

    // Console output
    if (overlaps.length > 0) {
      console.table(
        overlaps.map((o) => ({
          elementA: `<${o.a.tagName.toLowerCase()}${o.a.className ? "." + String(o.a.className).split(" ")[0] : ""}>`,
          elementB: `<${o.b.tagName.toLowerCase()}${o.b.className ? "." + String(o.b.className).split(" ")[0] : ""}>`,
          overlapX: Math.round(o.rect.left),
          overlapY: Math.round(o.rect.top),
          overlapW: Math.round(o.rect.width),
          overlapH: Math.round(o.rect.height),
        })),
      );
    }

    console.log(
      `[Overlap Debug] ${overlaps.length} overlap${overlaps.length === 1 ? "" : "s"} found.`,
    );
  }

  function cleanup() {
    overlayEls.forEach((el) => el.remove());
    overlayEls = [];
  }

  function handleResize() {
    if (!active) return;
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      runSweep();
    }, 300);
  }

  function toggle() {
    active = !active;
    if (active) {
      console.log("[Overlap Debug] Activated -- scanning for overlaps...");
      runSweep();
      window.addEventListener("resize", handleResize);
    } else {
      console.log("[Overlap Debug] Deactivated");
      cleanup();
      window.removeEventListener("resize", handleResize);
      if (resizeTimer) {
        clearTimeout(resizeTimer);
        resizeTimer = null;
      }
    }
  }

  // Keyboard shortcuts
  window.addEventListener("keydown", (e) => {
    // Primary: Cmd+Shift+Alt+O
    if (
      (e.ctrlKey || e.metaKey) &&
      e.shiftKey &&
      e.altKey &&
      e.code === "KeyO"
    ) {
      e.preventDefault();
      toggle();
      return;
    }
    // Secondary: Cmd+Shift+Alt+D (Alt avoids Chrome conflict)
    if (
      (e.ctrlKey || e.metaKey) &&
      e.shiftKey &&
      e.altKey &&
      e.code === "KeyD"
    ) {
      e.preventDefault();
      toggle();
    }
  });

}
