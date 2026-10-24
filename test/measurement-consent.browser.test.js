/* global process */
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { tmpdir } from "node:os";

const env = process.env;
const playwright = await import(env.PLAYWRIGHT_MODULE ? pathToFileURL(env.PLAYWRIGHT_MODULE).href : "playwright").catch(() => null);
const options = { skip: !playwright && "Install Playwright or set PLAYWRIGHT_MODULE to run browser checks." };
const baseURL = env.POLICY_TEST_BASE_URL || "https://localhost:5177";
let browser;
before(async () => { if (playwright) browser = await playwright.chromium.launch({ headless: true, channel: env.PW_BROWSER_CHANNEL || "chrome" }); });
after(async () => { await browser?.close(); });

async function fixture(width = 390) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width, height: 844 } });
  await context.route(/googletagmanager\.com|googleadservices\.com|googlesyndication\.com/, (route) => route.abort());
  await context.route("**/api/**", (route) => route.fulfill({ status: 401, contentType: "application/json", body: "{}" }));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseURL}/privacy-policy`, { waitUntil: "domcontentloaded" });
  await page.getByRole("region", { name: "Advertising measurement choices" }).waitFor();
  await page.locator("#privacy-title").waitFor();
  return { context, page, errors };
}

for (const width of [320, 390, 1440]) {
  test(`measurement choice is usable at ${width}px without requiring login or allowing tracking automatically`, options, async () => {
    const f = await fixture(width);
    try {
      const panel = f.page.getByRole("region", { name: "Advertising measurement choices" });
      for (const name of ["Decline optional", "Allow measurement"]) assert.ok(await panel.getByRole("button", { name, exact: true }).isVisible());
      assert.equal(await f.page.evaluate(() => window.dataLayer.some((entry) => Object.values(entry[2] || {}).includes("granted"))), false);
      assert.ok(await f.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
      await f.page.screenshot({ path: join(tmpdir(), `cleanchops-consent-${width}.png`) });
      await panel.getByRole("button", { name: "Decline optional", exact: true }).click();
      assert.equal(await panel.count(), 0);
      await f.page.reload();
      await f.page.locator("#privacy-title").waitFor();
      assert.equal(await panel.count(), 0);
      assert.equal(await f.page.evaluate(() => window.cleanChopsConsent.read()), false);
      assert.deepEqual(f.errors, []);
    } finally { await f.context.close(); }
  });
}

test("explicit permission persists, can be withdrawn, and is synchronised across tabs without producing purchases", options, async () => {
  const f = await fixture();
  try {
    await f.page.getByRole("button", { name: "Allow measurement", exact: true }).click();
    const consent = await f.page.evaluate(() => window.dataLayer.filter((entry) => entry[0] === "consent").map((entry) => entry[2]));
    assert.equal(consent.at(-1).ad_user_data, "granted");
    assert.equal(consent.at(-1).ad_personalization, "denied");
    assert.equal(consent.at(-1).analytics_storage, "denied");
    await f.page.reload();
    await f.page.locator("#privacy-title").waitFor();
    assert.equal(await f.page.getByRole("region", { name: "Advertising measurement choices" }).count(), 0);
    const other = await f.context.newPage();
    await other.goto(`${baseURL}/info`, { waitUntil: "domcontentloaded" });
    await other.locator("#about-title").waitFor();
    assert.equal(await other.evaluate(() => window.cleanChopsConsent.read()), true);
    await f.page.getByRole("button", { name: "Privacy choices", exact: true }).click();
    await f.page.getByRole("button", { name: "Decline optional", exact: true }).click();
    await other.waitForFunction(() => window.cleanChopsConsent.read() === false);
    const states = await other.evaluate(() => window.dataLayer.filter((entry) => entry[0] === "consent").map((entry) => entry[2]));
    assert.ok(Object.values(states.at(-1)).every((value) => value === "denied"));
    assert.equal(await f.page.evaluate(() => window.dataLayer.some((entry) => entry[0] === "event")), false);
    assert.deepEqual(f.errors, []);
  } finally { await f.context.close(); }
});
