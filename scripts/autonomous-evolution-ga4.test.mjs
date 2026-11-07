import test from "node:test";
import assert from "node:assert/strict";
import { fetchRealGa4Metrics } from "./autonomous-evolution.mjs";

test("fetches aggregated GA4 metrics with the federated access token", async () => {
  let requestUrl;
  let requestOptions;
  const result = await fetchRealGa4Metrics("561587520", "temporary-token", async (url, options) => {
    requestUrl = url;
    requestOptions = options;
    return {
      ok: true,
      json: async () => ({
        rows: [
          {
            metricValues: [{ value: "12" }, { value: "20" }, { value: "93.4" }],
          },
        ],
      }),
    };
  });

  assert.equal(
    requestUrl,
    "https://analyticsdata.googleapis.com/v1beta/properties/561587520:runReport",
  );
  assert.equal(requestOptions.headers.Authorization, "Bearer temporary-token");
  assert.deepEqual(result, { activeUsers: 12, sessions: 20, avgDurationSec: 93 });
});

test("does not call GA4 when the property or federated token is missing", async () => {
  let requestCount = 0;
  const fetchImpl = async () => {
    requestCount++;
  };

  assert.equal(await fetchRealGa4Metrics("561587520", "", fetchImpl), null);
  assert.equal(await fetchRealGa4Metrics("", "temporary-token", fetchImpl), null);
  assert.equal(requestCount, 0);
});
