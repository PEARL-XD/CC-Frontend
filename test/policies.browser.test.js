/* global process */
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { publicPolicyRoutes } from "../src/data/policyRoutes.js";

const env = process.env;
const playwright = await import(env.PLAYWRIGHT_MODULE ? pathToFileURL(env.PLAYWRIGHT_MODULE).href : "playwright").catch(() => null);
const options = { skip: !playwright && "Install Playwright or set PLAYWRIGHT_MODULE to run browser checks." };
const baseURL = env.POLICY_TEST_BASE_URL || "https://localhost:5177";
let browser;
before(async () => {
  if (playwright) browser = await playwright.chromium.launch({ headless: true, ...(env.PW_BROWSER_CHANNEL ? { channel: env.PW_BROWSER_CHANNEL } : {}) });
});
after(async () => { await browser?.close(); });

async function openPolicy(path, width = 390, auth = "pending") {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/**", async (route) => {
    if (auth === "pending" && route.request().url().includes("/refresh-token")) return;
    if (auth === "signed-in") {
      const data = route.request().url().includes("/refresh-token")
        ? { accessToken: "test-token" }
        : { user: { _id: "test-user", name: "Test", role: "user" }, cart: [] };
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
    }
    return route.fulfill({ status: 401, contentType: "application/json", body: "{}" });
  });
  await page.goto(`${baseURL}${path}`, { waitUntil: "domcontentloaded" });
  return { context, page, errors };
}

for (const [path, section] of Object.entries(publicPolicyRoutes)) {
  test(`guest reads ${path} while session refresh is unavailable`, options, async () => {
    const { context, page, errors } = await openPolicy(path);
    try {
      await page.locator(`#${section}-title`).waitFor();
      assert.equal(new URL(page.url()).pathname, path);
      assert.equal(await page.locator("main section").count(), 6);
      assert.ok((await page.locator("body").innerText()).includes("without signing in"));
      assert.equal(await page.locator('a[href="mailto:supportcleanchops@gmail.com"]').count() > 0, true);
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
}

test("legacy privacy fragment and section links scroll to the right content", options, async () => {
  const { context, page } = await openPolicy("/info#privacy", 1280);
  try {
    await page.waitForFunction(() => {
      const heading = document.getElementById("privacy-title");
      return heading && heading.getBoundingClientRect().top >= 0 && heading.getBoundingClientRect().top < 200;
    });
    await page.getByRole("link", { name: "Cancellation & Refunds", exact: true }).click();
    await page.waitForFunction(() => {
      const heading = document.getElementById("refunds-title");
      return heading && heading.getBoundingClientRect().top >= 0 && heading.getBoundingClientRect().top < 200;
    });
    assert.equal(new URL(page.url()).hash, "#refunds");
  } finally { await context.close(); }
});

for (const width of [320, 390, 1440]) {
  test(`policy page fits ${width}px without horizontal overflow`, options, async () => {
    const { context, page, errors } = await openPolicy("/info", width);
    try {
      await page.locator("#about-title").waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
      await page.screenshot({ path: join(tmpdir(), `cleanchops-policy-${width}.png`) });
      await page.locator("#contact").scrollIntoViewIfNeeded();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
      assert.equal(await page.locator('a[href="tel:+917678673823"]').count() > 0, true);
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
}

test("signed-in users can read policies without losing their session", options, async () => {
  const { context, page, errors } = await openPolicy("/privacy-policy", 1280, "signed-in");
  try {
    await page.locator("#privacy-title").waitFor();
    assert.equal(new URL(page.url()).pathname, "/privacy-policy");
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test("policy content fits a small screen with enlarged text", options, async () => {
  const { context, page } = await openPolicy("/info", 320);
  try {
    await page.locator("#about-title").waitFor();
    await page.addStyleTag({ content: "html { font-size: 20px; }" });
    await page.locator("#refunds").scrollIntoViewIfNeeded();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.locator("#contact").scrollIntoViewIfNeeded();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  } finally { await context.close(); }
});

test("private profile remains protected for a signed-out guest", options, async () => {
  const { context, page, errors } = await openPolicy("/profile", 390, "signed-out");
  try {
    await page.waitForURL("**/login");
    assert.equal(await page.locator("#privacy-title").count(), 0);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
