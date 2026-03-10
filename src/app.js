import { createMap } from "./map.js";
import { createI18n } from "./i18n.js";

const APP_CONFIG = {
  // Master switch for landing overlay.
  showLanding: true,
  // true: show only on first visit, false: show on every page load.
  showLandingOnlyOnce: false,
  // Allow closing landing with Escape key.
  closeLandingOnEscape: true
};

const LANDING_SEEN_KEY = "discoverTG.landingSeen.v1";

function id(name) {
  const el = document.getElementById(name);
  if (!el) throw new Error(`Missing element with id="${name}"`);
  return el;
}

function optionalId(name) {
  return document.getElementById(name);
}

function hasSeenLanding() {
  try {
    return localStorage.getItem(LANDING_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markLandingSeen() {
  try {
    localStorage.setItem(LANDING_SEEN_KEY, "1");
  } catch {
    // Ignore storage failures.
  }
}

function setLandingHidden(ui, hidden) {
  ui.landingOverlay.classList.toggle("landing-hidden", hidden);
  ui.landingOverlay.setAttribute("aria-hidden", hidden ? "true" : "false");
}

function waitForLandingDismiss(ui, config) {
  return new Promise((resolve) => {
    const close = () => {
      if (config.showLandingOnlyOnce) markLandingSeen();
      setLandingHidden(ui, true);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("message", onMessage);
      resolve();
    };

    const onKeyDown = (event) => {
      if (config.closeLandingOnEscape && event.key === "Escape") close();
    };

    const onMessage = (event) => {
      if (event.source !== ui.landingOverlayFrame.contentWindow) return;
      if (!event.data || event.data.type !== "landing-close") return;
      close();
    };

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("message", onMessage);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const ui = {
    // landing
    landingOverlay: id("landingOverlay"),
    landingOverlayFrame: id("landingOverlayFrame"),

    // overlay
    poiOverlay: id("poiOverlay"),
    poiOverlayFrame: id("poiOverlayFrame"),
    poiOverlayClose: id("poiOverlayClose"),
    poiCompleteBtn: id("poiCompleteBtn"),
    poiCompleteLabel: id("poiCompleteLabel"),
    infoOverlay: id("infoOverlay"),
    infoOverlayFrame: id("infoOverlayFrame"),
    infoOverlayClose: id("infoOverlayClose"),
    infoCreditsBtn: id("infoCreditsBtn"),
    infoAboutBtn: id("infoAboutBtn"),
    infoFeatureBtn: id("infoFeatureBtn"),

    // banners
    locationBanner: id("locationBanner"),
    bannerText: id("bannerText"),
    layersBanner: id("layersBanner"),
    languageMenu: optionalId("languageMenu"),
    languageMenuTitle: optionalId("languageMenuTitle"),
    languageOptions: optionalId("languageOptions"),

    // buttons
    languageBtn: optionalId("languageBtn"),
    myLocationBtn: id("myLocationBtn"),
    centerBtn: id("centerBtn"),
    grantLocationBtn: id("grantLocationBtn"),
    dismissBannerBtn: id("dismissBannerBtn"),
    layersShowBtn: id("layersShowBtn"),
    infoBtn: id("infoBtn"),
    styleToggleBtn: id("styleToggleBtn"),
    toggleImageOverlayBtn: id("toggleImageOverlayBtn")
  };

  const i18n = createI18n();
  await i18n.init();

  if (!APP_CONFIG.showLanding) {
    setLandingHidden(ui, true);
  } else {
    const shouldShowLanding = !APP_CONFIG.showLandingOnlyOnce || !hasSeenLanding();
    if (shouldShowLanding) {
      setLandingHidden(ui, false);
      await waitForLandingDismiss(ui, APP_CONFIG);
    } else {
      setLandingHidden(ui, true);
    }
  }

  const api = createMap({
    mapElId: "map",
    ui,
    i18n
  });

  // If you ever need access from the console while debugging:
  // window.__mapApi = api;
});
