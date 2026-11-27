/**
 * scripts/skills/demand-sensors.mjs
 * Capa 4 — Sensores Exógenos Privacy-First (Zero-PII).
 * 1. Lee eventos reales agregados de producto desde GA4 Data API
 *    (emo_insight_feedback, maturity_diagnosis, roi_calculation, recipe_copy, emo_comment_submit).
 * 2. Consulta Google Search Console API (si hay permiso webmasters.readonly)
 *    para detectar consultas reales de pymes con impresiones y bajo CTR.
 */

const TRACKED_EVENTS = [
  "emo_insight_feedback",
  "emo_comment_submit",
  "maturity_diagnosis",
  "roi_calculation",
  "recipe_copy",
];

export async function fetchGa4ProductEvents(propertyId, accessToken, fetchImpl = fetch) {
  if (!propertyId || !accessToken) return null;

  try {
    const res = await fetchImpl(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
          dimensions: [{ name: "eventName" }],
          metrics: [{ name: "eventCount" }],
        }),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const counts = {
      emo_insight_feedback: 0,
      emo_comment_submit: 0,
      maturity_diagnosis: 0,
      roi_calculation: 0,
      recipe_copy: 0,
    };
    for (const row of data.rows || []) {
      const name = String(row?.dimensionValues?.[0]?.value || "");
      const count = parseInt(row?.metricValues?.[0]?.value || "0", 10) || 0;
      if (TRACKED_EVENTS.includes(name)) {
        counts[name] = count;
      }
    }
    return counts;
  } catch {
    return null;
  }
}

export async function fetchGscDemandQueries(
  siteUrl = "https://aievolutio.com/",
  accessToken = "",
  fetchImpl = fetch,
  options = {},
) {
  if (!siteUrl || !accessToken) return null;

  const endDate = options.endDate || new Date().toISOString().slice(0, 10);
  const startDateObj = new Date(`${endDate}T12:00:00Z`);
  startDateObj.setUTCDate(startDateObj.getUTCDate() - 28);
  const startDate = options.startDate || startDateObj.toISOString().slice(0, 10);

  try {
    const encodedSite = encodeURIComponent(siteUrl);
    const res = await fetchImpl(
      `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ["query"],
          rowLimit: 15,
        }),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const rows = Array.isArray(data.rows) ? data.rows : [];
    return rows
      .map((r) => ({
        query: String(r?.keys?.[0] || "").trim(),
        clicks: Number(r?.clicks || 0),
        impressions: Number(r?.impressions || 0),
        ctr: Math.round(Number(r?.ctr || 0) * 1000) / 10,
        position: Math.round(Number(r?.position || 0) * 10) / 10,
      }))
      .filter((q) => q.query && q.impressions >= 1)
      .sort((a, b) => b.impressions - a.impressions);
  } catch {
    return null;
  }
}
