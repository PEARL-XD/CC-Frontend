import test from "node:test";
import assert from "node:assert/strict";
import { policyBusiness, policyContact, policySections } from "../src/data/policies.js";
import { isPublicPolicyPath, policySectionForLocation, publicPolicyRoutes } from "../src/data/policyRoutes.js";

test("all public policy paths resolve to an existing section, including trailing slashes", () => {
  for (const [path, section] of Object.entries(publicPolicyRoutes)) {
    assert.equal(isPublicPolicyPath(path), true);
    assert.equal(isPublicPolicyPath(`${path}/`), true);
    assert.equal(policySectionForLocation(path), section);
    assert.ok(policySections.some(({ id }) => id === section));
  }
});

test("policy guest access never exempts private or lookalike paths", () => {
  for (const path of ["/", "/profile", "/edit-profile", "/orderspage", "/paymentpage", "/admin/orders", "/info/private", "/privacy-policy-admin", "/constructor", "/__proto__"]) {
    assert.equal(isPublicPolicyPath(path), false, path);
  }
});

test("existing policy fragments keep working and unknown fragments fall back safely", () => {
  for (const id of ["about", "delivery", "privacy", "terms", "refunds", "contact"]) {
    assert.equal(policySectionForLocation("/info", `#${id}`), id);
  }
  assert.equal(policySectionForLocation("/privacy-policy", "#unknown"), "privacy");
  assert.equal(policySectionForLocation("/info", "#constructor"), "about");
});

test("published policies have complete readable sections and safe contact links", () => {
  assert.equal(new Set(policySections.map(({ id }) => id)).size, policySections.length);
  for (const section of policySections) {
    assert.ok(section.title && section.label && section.content.length);
    for (const { heading, body, links = [] } of section.content) {
      assert.ok(heading && body.length > 50);
      for (const { label, href } of links) {
        assert.ok(label);
        assert.match(href, /^(https:\/\/|mailto:|tel:)/);
      }
    }
  }
  const privacy = policySections.find(({ id }) => id === "privacy").content.map(({ body }) => body).join(" ");
  assert.match(privacy, /Cashfree or Razorpay/);
  assert.match(privacy, /coordinates/);
  assert.match(privacy, /deletion/);
  assert.equal(policyContact.phoneHref, "tel:+917678673823");
  assert.equal(policyContact.whatsappHref, "https://wa.me/917678673823");
});

test("business identity appears on public about, privacy, terms and contact sections", () => {
  assert.equal(policyBusiness.name, "CleanChops");
  assert.equal(policyBusiness.operator, "PEARL");
  assert.equal(policyBusiness.address, "Flat 1408, Tower G1, Bharat City Phase II, Indraprastha Yojana, Shahpur Nij Morta, Ghaziabad Tahsil, Ghaziabad, Uttar Pradesh - 201102, India");
  for (const id of ["about", "privacy", "terms", "contact"]) {
    const text = policySections.find((section) => section.id === id).content.map(({ body }) => body).join(" ");
    assert.ok(text.includes(policyBusiness.operator), id);
    if (id !== "terms") assert.ok(text.includes(policyBusiness.address), id);
  }
});
