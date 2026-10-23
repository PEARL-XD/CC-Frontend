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
  assert.doesNotMatch(bootstrap, /\b(?:granted|send_to|transaction_id|user_id|user_data|localStorage)\b|fetch\(/);
});

test("public privacy information explains cookieless Google measurement", () => {
  const disclosure = policySections.find(({ id }) => id === "privacy").content
    .find(({ heading }) => heading === "Google advertising measurement on our website");
  assert.match(disclosure.body, /cookieless measurement/);
  assert.match(disclosure.body, /denied by default/);
  assert.equal(disclosure.links[0].href, "https://policies.google.com/technologies/partner-sites");
});
