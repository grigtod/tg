async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.json();
}

async function loadOptionalJson(url) {
  try {
    return await fetchJson(url);
  } catch (error) {
    console.warn(`Skipping POI dataset ${url}:`, error);
    return null;
  }
}

export async function loadAllPois() {
  const pois = [];

  function addToPois(id, lat, lon, label, emoji, embedUrl) {
    pois.push({ id, lat, lon, label, emoji, embedUrl });
  }

  function buildGwarekEmbedUrl(dialogueJson) {
    const baseUrl = new URL("./embeds/pomnik-gwarka.html", window.location.href);
    if (typeof dialogueJson === "string" && dialogueJson.trim()) {
      baseUrl.searchParams.set("dialogue", dialogueJson.trim());
    }
    return baseUrl.toString();
  }

  /*const loadedPOI = await loadOptionalJson("./data/poi.json");
  loadedPOI?.data?.forEach((el) =>
    // Temporarily hide the generic "info" POI and museum marker.
    el.id !== "info" &&
    el.id !== "museum-tg" &&
    addToPois(el.id, el.lat, el.lon, el.label, el.emoji, el.embedUrl)
  );*/

  const loadedGwarek = await loadOptionalJson("./data/gwarek.json");
  loadedGwarek?.data?.forEach((el) =>
    el.enabled !== false &&
    addToPois(
      el.id,
      el.lat,
      el.lon,
      el.label,
      "miner",
      buildGwarekEmbedUrl(el.json)
    )
  );

  // Temporarily hide photo POIs from photo.json.
  // const loadedPhotos = await loadOptionalJson("./data/photo.json");
  // loadedPhotos?.data?.forEach((el) =>
  //   addToPois(el.id, el.lat, el.lon, el.label, "📷", "./embeds/photo.html")
  // );

  const loadedHistoricalBuildings = await loadOptionalJson("./data/historical-buildings.json");
  loadedHistoricalBuildings?.data?.forEach((el) =>
    addToPois(el.id, el.lat, el.lon, el.label, "house", "./embeds/historical-building.html")
  );

  return pois;
}
