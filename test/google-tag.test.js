import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { policySections } from "../src/data/policies.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const bootstrap = head.match(/<script>([\s\S]*?)<\/script>/)[1];

function commands(existing = []) {
  const window = { dataLayer: existing };
  runInNewContext(bootstrap, { window });
  return window.dataLayer.map((entry) => Array.from(entry));
}

const consentKey = "cleanchops_ad_measurement_v1";
function consentBrowser(saved = null, blocked = false) {
  const values = new Map(saved === null ? [] : [[consentKey, saved]]);
  const browser = { localStorage: {
    getItem(key) { if (blocked) throw new Error("blocked"); return values.get(key) ?? null; },
    setItem(key, value) { if (blocked) throw new Error("blocked"); values.set(key, value); },
  } };
  runInNewContext(bootstrap, { window: browser });
  return { browser, values, queue: () => browser.dataLayer.map((entry) => Array.from(entry)) };
}

test("the shared HTML head loads the supplied Google tag once and asynchronously", () => {
  const scripts = [...head.matchAll(/<script\b([^>]*)src="([^"]+)"[^>]*>/g)];
  assert.equal(scripts.length, 1);
  assert.match(scripts[0][1], /\basync\b/);
  assert.equal(scripts[0][2], "https://www.googletagmanager.com/gtag/js?id=AW-18474051740");
  assert.match(html, /<script type="module" src="\/src\/main.jsx"><\/script>/);
});

test("privacy defaults are queued before the base tag is configured", () => {
  const queue = commands();
  assert.deepEqual(queue.map((entry) => entry.slice(0, 2)), [
    ["consent", "default"],
    ["set", "ads_data_redaction"],
    ["js", queue[2][1]],
    ["config", "AW-18474051740"],
  ]);
  assert.deepEqual(Object.keys(queue[0][2]).sort(), [
    "ad_personalization", "ad_storage", "ad_user_data", "analytics_storage",
  ]);
  assert.ok(Object.values(queue[0][2]).every((value) => value === "denied"));
  assert.equal(queue[1][2], true);
  assert.equal(queue[3][2].allow_ad_personalization_signals, false);
});

test("existing tag commands are preserved without waiting for the remote script", () => {
  const existing = [["existing-command"]];
  const queue = commands(existing);
  assert.equal(existing.length, 5);
  assert.deepEqual(queue[0], ["existing-command"]);
  assert.deepEqual(queue.at(-1).slice(0, 2), ["config", "AW-18474051740"]);
});

test("the base tag neither grants consent nor invents purchase conversions", () => {
  assert.equal(commands().some(([command]) => command === "event"), false);
  assert.equal(commands().some((entry) => Object.values(entry[2] || {}).includes("granted")), false);
  assert.doesNotMatch(bootstrap, /\b(?:send_to|transaction_id|user_id|user_data)\b|fetch\(/);
});

test("only an explicit measurement choice grants advertising consent, never analytics or personalisation", () => {
  const f = consentBrowser();
  assert.equal(f.browser.cleanChopsConsent.read(), null);
  assert.equal(f.browser.cleanChopsConsent.choose(true), true);
  const update = f.queue().at(-1);
  assert.deepEqual(update.slice(0, 2), ["consent", "update"]);
  assert.deepEqual({ ...update[2] }, { ad_storage: "granted", ad_user_data: "granted", analytics_storage: "denied", ad_personalization: "denied" });
  assert.deepEqual(Object.keys(JSON.parse(f.values.get(consentKey))).sort(), ["allowed", "updatedAt", "version"]);
  assert.equal(f.browser.cleanChopsConsent.choose(false), false);
  assert.ok(Object.values(f.queue().at(-1)[2]).every((value) => value === "denied"));
});

test("a saved allowed or declined choice is restored before tag configuration", () => {
  for (const allowed of [true, false]) {
    const f = consentBrowser(JSON.stringify({ version: 1, allowed, updatedAt: Date.now() - 1000 }));
    assert.equal(f.browser.cleanChopsConsent.read(), allowed);
    const queue = f.queue();
    assert.deepEqual(queue[1].slice(0, 2), ["consent", "update"]);
    assert.equal(queue[1][2].ad_user_data, allowed ? "granted" : "denied");
    assert.equal(queue.at(-1)[0], "config");
    assert.equal(queue.at(-1)[2].allow_ad_personalization_signals, false);
  }
});

test("invalid, expired or future-dated preferences cannot grant consent", () => {
  for (const saved of ["bad json", "null", "true", "{}", ...[
    { version: 2, allowed: true, updatedAt: Date.now() },
    { version: 1, allowed: "true", updatedAt: Date.now() },
    { version: 1, allowed: true, updatedAt: String(Date.now()) },
    { version: 1, allowed: true, updatedAt: Date.now() + 60000 },
    { version: 1, allowed: true, updatedAt: Date.now() - 180 * 86400000 },
  ].map(JSON.stringify)]) {
    const f = consentBrowser(saved);
    assert.equal(f.browser.cleanChopsConsent.read(), null, saved);
    assert.equal(f.queue().length, 4);
  }
});

test("storage failures keep deny defaults and allow explicit choices for the current page", () => {
  const f = consentBrowser(null, true);
  assert.equal(f.browser.cleanChopsConsent.read(), null);
  assert.equal(f.queue().length, 4);
  assert.equal(f.browser.cleanChopsConsent.choose(true), true);
  assert.equal(f.values.size, 0);
  assert.equal(f.browser.cleanChopsConsent.choose(false), false);
  assert.ok(Object.values(f.queue().at(-1)[2]).every((value) => value === "denied"));
});

test("other tabs can revoke consent and malformed choices never silently grant it", () => {
  const f = consentBrowser();
  for (const invalid of [undefined, null, "true", 1, {}]) {
    assert.equal(f.browser.cleanChopsConsent.choose(invalid), null);
  }
  assert.equal(f.queue().length, 4);
  f.browser.cleanChopsConsent.choose(true);
  f.values.delete(consentKey);
  assert.equal(f.browser.cleanChopsConsent.restore(), null);
  assert.ok(Object.values(f.queue().at(-1)[2]).every((value) => value === "denied"));
});

test("public privacy information explains cookieless Google measurement", () => {
  const disclosure = policySections.find(({ id }) => id === "privacy").content
    .find(({ heading }) => heading === "Google advertising measurement on our website");
  assert.match(disclosure.body, /cookieless measurement/);
  assert.match(disclosure.body, /denied by default/);
  assert.match(disclosure.body, /Allow measurement/);
  assert.match(disclosure.body, /180 days/);
  assert.match(disclosure.body, /withdraw/);
  assert.equal(disclosure.links[0].href, "https://policies.google.com/technologies/partner-sites");
});
