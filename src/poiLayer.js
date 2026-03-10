import { POI_THEME } from "./poiTheme.js";

export function createPoiLayer({
  map,
  overlay,
  labelZoomThreshold = 21,
  dotZoomThreshold = 18
}) {
  if (!map) throw new Error("createPoiLayer requires map");
  if (!overlay) throw new Error("createPoiLayer requires overlay");

  let poiMarkers = [];
  let previousZoomLevel = map.getZoom();

  function getEffectiveThresholds() {
    return {
      dot: Math.min(dotZoomThreshold, labelZoomThreshold),
      label: Math.max(dotZoomThreshold, labelZoomThreshold)
    };
  }

  function getDotStyle(emoji) {
    return (
      POI_THEME.dotStylesByEmoji[emoji] ?? {
        fill: POI_THEME.defaultDotFill,
        outline: POI_THEME.defaultDotOutline
      }
    );
  }

  function escapeHtml(input) {
    return String(input)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function makePoiIcon(poi, zoomLevel, { animateLabelReveal = false } = {}) {
    const label = poi?.label ?? "";
    const safeLabel = escapeHtml(label);

    const isCompleted = overlay.isCompleted(poi.id);
    const thresholds = getEffectiveThresholds();
    const showDotOnly = zoomLevel < thresholds.dot;
    const showLabel = !showDotOnly && zoomLevel >= thresholds.label;

    const classNameParts = ["poi-marker"];
    if (showLabel) classNameParts.push("show-label");
    if (showLabel && animateLabelReveal && POI_THEME.labelRevealAnimationEnabled) {
      classNameParts.push("animate-label-reveal");
    }
    if (showDotOnly) classNameParts.push("dot-only");
    if (isCompleted) classNameParts.push("is-completed");

    const dotStyle = getDotStyle(poi.emoji);
    const markerThemeStyle = [
      `--poi-frame-background: ${POI_THEME.markerFrameBackground}`,
      `--poi-frame-border-color: ${POI_THEME.markerFrameBorder}`,
      `--poi-label-background: ${POI_THEME.labelBackground}`,
      `--poi-label-text-color: ${POI_THEME.labelText}`,
      `--poi-label-border-color: ${POI_THEME.labelBorder}`,
      `--poi-label-reveal-animation-name: ${POI_THEME.labelRevealAnimationEnabled ? "poi-label-reveal" : "none"}`,
      `--poi-label-reveal-duration: ${POI_THEME.labelRevealDurationMs}ms`,
      `--poi-label-reveal-easing: ${POI_THEME.labelRevealEasing}`,
      `--poi-label-reveal-distance: ${POI_THEME.labelRevealDistancePx}px`,
      `--poi-dot-color: ${dotStyle.fill}`,
      `--poi-dot-outline-color: ${dotStyle.outline}`
    ].join("; ");

    const markerVisual = showDotOnly
      ? `<span class="poi-dot" aria-hidden="true"></span>`
      : poi.emoji === "miner"
        ? `<img class="poi-image poi-image-miner" src="./assets/miner.png" alt="" aria-hidden="true" />`
        : poi.emoji === "house"
          ? `<img class="poi-image" src="./assets/building.png" alt="" aria-hidden="true" />`
          : `<span class="poi-emoji">${poi.emoji}</span>`;

    const html = `
      <div class="${classNameParts.join(" ")}" style="${markerThemeStyle}" role="button" aria-label="${safeLabel}">
        <span class="poi-visual-frame">
          ${markerVisual}
        </span>
        <span class="poi-label">${safeLabel}</span>
      </div>
    `;

    return L.divIcon({
      className: "poi-icon",
      html,
      iconSize: [1, 1]
    });
  }

  function updateIcons() {
    const zoomLevel = map.getZoom();
    const thresholds = getEffectiveThresholds();
    const animateLabelReveal = previousZoomLevel < thresholds.label && zoomLevel >= thresholds.label;
    for (const { poi, marker } of poiMarkers) {
      marker.setIcon(makePoiIcon(poi, zoomLevel, { animateLabelReveal }));
    }
    previousZoomLevel = zoomLevel;
  }

  function setPois(pois) {
    for (const { marker } of poiMarkers) map.removeLayer(marker);
    poiMarkers = [];

    poiMarkers = pois.map((poi) => {
      const marker = L.marker([poi.lat, poi.lon], {
        icon: makePoiIcon(poi, map.getZoom()),
        keyboard: true,
        riseOnHover: true
      }).addTo(map);

      marker.on("click", () => {
        overlay.open({ url: poi.embedUrl, poiId: poi.id });
      });

      marker.on("keypress", (e) => {
        const key = e.originalEvent?.key;
        if (key === "Enter" || key === " ") {
          overlay.open({ url: poi.embedUrl, poiId: poi.id });
        }
      });

      return { poi, marker };
    });

    updateIcons();
  }

  map.on("zoomend", updateIcons);

  return {
    setPois,
    updateIcons
  };
}
