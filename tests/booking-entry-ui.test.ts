import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { registerHooks } from "node:module";
import { Window } from "happy-dom";

Object.assign(globalThis, { React });
const fixture = { session: null as null | { email: string }, resume: false };
Object.assign(globalThis, { bookingEntryFixture: fixture });
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "next/navigation") return { url: "fixture:navigation", shortCircuit: true };
    if (specifier === "next/image" || specifier === "next/link") return { url: `fixture:${specifier}`, shortCircuit: true };
    const file = specifier.replaceAll("\\", "/").replace(/\.(tsx?|js)$/, "");
    for (const path of ["lib/auth/session", "lib/customers/repository", "lib/booking/repository", "lib/pickup-requests/checkout", "components/booking/StepPayment"]) {
      if (file.endsWith(path)) return { url: `fixture:${path}`, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    url = url.replaceAll("\\", "/").split("?")[0];
    let source: string | undefined;
    if (url === "fixture:next/image") source = "export default function Image({src, alt}) { return React.createElement('img', {src, alt}); }";
    if (url === "fixture:next/link") source = "export default function Link({children, ...props}) { return React.createElement('a', props, children); }";
    if (url === "fixture:navigation") source = `export const useRouter = () => ({push() {}}); export const usePathname = () => '/book'; export function redirect(url) { throw new Error('REDIRECT:' + url); }`;
    if (url.endsWith(".module.css")) source = "export default {};";
    if (url === "fixture:lib/auth/session") source = "export async function getSession() { return globalThis.bookingEntryFixture.session; }";
    if (url === "fixture:lib/customers/repository") source = "export async function getProfile() { return null; }";
    if (url === "fixture:lib/booking/repository") source = "export async function listBookingsForEmail() { return []; }";
    if (url === "fixture:lib/pickup-requests/checkout") source = `export async function getApprovedPickupRequest(id) { return {id, trailerId: 'trailer-004', date: '2027-10-10', time: '08:00', duration: 'fullDay', firstName: 'Alex', lastName: 'Fixture', email: 'fixture@example.com', phone: '2105550100'}; } export async function getResumablePickupCheckout() { return globalThis.bookingEntryFixture.resume ? {checkoutKey: 'resume-fixture'} : null; }`;
    // These tests stop before payment; render a sentinel to verify resume priority.
    if (url === "fixture:components/booking/StepPayment") source = "export function StepPayment() { return React.createElement('p', null, 'Resumed payment fixture'); }";
    if (source !== undefined) return { format: "module", source, shortCircuit: true };
    return next(url, context);
  },
});

test("query allows exact bookable slugs and safely rejects invalid, unavailable, generic and duplicate values", async () => {
  const { bookingTrailerFromQuery } = await import("../src/lib/booking/entry");
  assert.equal(bookingTrailerFromQuery("20-enclosed")?.id, "trailer-002");
  assert.equal(bookingTrailerFromQuery("12-utility")?.id, "trailer-004");
  for (const value of [undefined, "", "14-dump", "trailer-002", "unknown", ["20-enclosed", "12-utility"]]) {
    assert.equal(bookingTrailerFromQuery(value), undefined);
  }
});

test("Rates preserves every rental, tax, checkout total and coming-soon restriction with matching fleet photos", async () => {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { default: RatesPage } = await import("../src/app/rates/page");
  const window = new Window();
  window.document.body.innerHTML = renderToStaticMarkup(React.createElement(RatesPage));
  const cards = window.document.querySelectorAll("article");
  const expected = [
    { image: "/fleet/20-enclosed-side.png", amounts: ["$90.00", "$9.00", "$299.00", "$150.00", "$15.00", "$365.00", "$900.00", "$90.00", "$1,190.00", "$1,680.00", "$168.00", "$2,048.00"] },
    { image: "/fleet/12-utility-front.png", amounts: ["$75.00", "$7.50", "$282.50", "$100.00", "$10.00", "$310.00", "$600.00", "$60.00", "$860.00", "$900.00", "$90.00", "$1,190.00"] },
    { image: "https://lh3.googleusercontent.com/", amounts: ["$100.00", "$10.00", "$310.00", "$150.00", "$15.00", "$365.00", "$900.00", "$90.00", "$1,190.00", "$1,800.00", "$180.00", "$2,180.00"] },
  ];
  assert.equal(cards.length, 3);
  expected.forEach((item, index) => {
    assert.ok(cards[index].querySelector("img")?.getAttribute("src")?.startsWith(item.image));
    assert.deepEqual(cards[index].textContent.match(/\$[\d,]+\.\d{2}/g), item.amounts);
    assert.match(cards[index].textContent, /\$200 refundable deposit/);
    for (const label of ["Half Day", "Full Day", "1 Week", "2 Weeks"]) assert.ok(cards[index].textContent.includes(label));
  });
  assert.equal(cards[2].querySelector("a"), null);
  assert.match(cards[2].textContent, /Coming Soon/);
  assert.equal(cards[2].querySelector('[aria-disabled="true"]')?.textContent.trim(), "Available Soonschedule");
  await window.happyDOM.abort();
});

test("server page forwards validated entry but pickupRequest takes priority, including auth and resume", async () => {
  const { default: BookPage } = await import("../src/app/book/page");
  const page = (params: { trailer?: string | string[]; pickupRequest?: string }) => BookPage({ searchParams: Promise.resolve(params) });
  for (const trailer of ["20-enclosed", "12-utility"]) {
    assert.equal((await page({ trailer })).props.initialTrailerSlug, trailer);
  }
  for (const trailer of [undefined, "14-dump", "invalid", ["20-enclosed", "12-utility"]]) {
    assert.equal((await page({ trailer })).props.initialTrailerSlug, undefined);
  }
  await assert.rejects(page({ trailer: "20-enclosed", pickupRequest: "approved-fixture" }), /REDIRECT:.*pickupRequest/);
  fixture.session = { email: "fixture@example.com" };
  try {
    const regular = await page({ trailer: "20-enclosed" });
    assert.equal(regular.props.initialTrailerSlug, "20-enclosed");
    const approved = await page({ trailer: "20-enclosed", pickupRequest: "approved-fixture" });
    assert.equal(approved.props.initialTrailerSlug, undefined);
    assert.equal(approved.props.savedDetails.trailerId, "trailer-004");
    assert.equal(approved.props.savedDetails.pickupRequestId, "approved-fixture");
    fixture.resume = true;
    assert.equal((await page({ trailer: "20-enclosed", pickupRequest: "approved-fixture" })).props.resumeCheckoutKey, "resume-fixture");
  } finally { fixture.session = null; fixture.resume = false; }
});

async function mount() {
  const window = new Window({ url: "http://localhost:3100/book" });
  Object.assign(globalThis, { window, self: window, document: window.document, HTMLElement: window.HTMLElement, Node: window.Node, IS_REACT_ACT_ENVIRONMENT: true });
  const oldFetch = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = async (input) => {
    requests.push(String(input));
    return Response.json(String(input).includes("/api/auth/me") ? { email: null } : { ok: true, days: [], checkedAtMs: Date.now() });
  };
  const { createRoot } = await import("react-dom/client");
  const host = window.document.createElement("div");
  window.document.body.append(host);
  const root = createRoot(host as unknown as HTMLElement);
  const render = async (element: React.ReactNode) => React.act(async () => root.render(element));
  const click = async (element: import("happy-dom").Element) => React.act(async () => { element.dispatchEvent(new window.MouseEvent("click", { bubbles: true })); });
  return { window, host, render, click, requests, async close() { await React.act(async () => root.unmount()); globalThis.fetch = oldFetch; await window.happyDOM.abort(); } };
}

test("wizard starts Schedule only for valid entry; Back/change and rerenders never lock the query selection", async () => {
  const ui = await mount();
  const { BookingWizard } = await import("../src/components/booking/BookingWizard");
  try {
    for (const slug of [undefined, "invalid", "14-dump"]) {
      await ui.render(React.createElement(BookingWizard, { key: String(slug), initialTrailerSlug: slug }));
      assert.match(ui.host.textContent, /Select Your Trailer/);
      assert.equal(ui.host.querySelectorAll('[aria-checked="true"]').length, 0);
    }
    for (const slug of ["20-enclosed", "12-utility"]) {
      await ui.render(React.createElement(BookingWizard, { key: slug, initialTrailerSlug: slug }));
      assert.match(ui.host.textContent, /Pick Your Schedule/);
      assert.equal(ui.host.querySelector('[aria-current="step"]')?.getAttribute("aria-label"), "Step 2: Schedule (current)");
      assert.match(ui.requests.at(-1)!, new RegExp(slug === "20-enclosed" ? "trailer-002" : "trailer-004"));
    }
    await ui.render(React.createElement(BookingWizard, { key: "change", initialTrailerSlug: "20-enclosed" }));
    await ui.click([...ui.host.querySelectorAll("button")].find((b) => b.textContent === "Back")!);
    assert.equal(ui.host.querySelector('[aria-checked="true"]')?.getAttribute("aria-label")?.includes("20'"), true);
    await ui.click(ui.host.querySelectorAll('[role="radio"]')[1]);
    assert.match(ui.host.textContent, /Select Your Trailer/);
    await ui.click([...ui.host.querySelectorAll("button")].find((b) => b.textContent.includes("Continue to Schedule"))!);
    assert.match(ui.host.textContent, /6.5'.*12' Utility Trailer/);
    await ui.render(React.createElement(BookingWizard, { key: "change", initialTrailerSlug: "20-enclosed" }));
    assert.match(ui.host.textContent, /6.5'.*12' Utility Trailer/);
    await ui.click([...ui.host.querySelectorAll("button")].find((b) => b.textContent === "Change trailer")!);
    assert.match(ui.host.textContent, /Select Your Trailer/);
    assert.match(ui.host.querySelector('[aria-checked="true"]')!.getAttribute("aria-label")!, /Utility/);
  } finally { await ui.close(); }
});

test("client navigation between trailer-specific and generic server entries resets only the entry", async () => {
  const ui = await mount();
  const { default: BookPage } = await import("../src/app/book/page");
  try {
    await ui.render(await BookPage({ searchParams: Promise.resolve({ trailer: "20-enclosed" }) }));
    assert.match(ui.host.textContent, /Pick Your Schedule/);
    await ui.render(await BookPage({ searchParams: Promise.resolve({}) }));
    assert.match(ui.host.textContent, /Select Your Trailer/);
    assert.equal(ui.host.querySelectorAll('[aria-checked="true"]').length, 0);
    await ui.render(await BookPage({ searchParams: Promise.resolve({ trailer: "12-utility" }) }));
    assert.match(ui.host.textContent, /Pick Your Schedule/);
    assert.match(ui.host.textContent, /Utility Trailer/);
  } finally { await ui.close(); }
});

test("pickup prefill and resume retain priority; going back clears request without reapplying trailer URL", async () => {
  const ui = await mount();
  const { BookingWizard } = await import("../src/components/booking/BookingWizard");
  const savedDetails = { pickupRequestId: "approved-fixture", trailerId: "trailer-004", trailerSlug: "12-utility", date: "2027-10-10", time: "08:00" };
  try {
    await ui.render(React.createElement(BookingWizard, { key: "pickup", initialTrailerSlug: "20-enclosed", savedDetails }));
    assert.equal(ui.host.querySelector('[aria-current="step"]')?.getAttribute("aria-label"), "Step 3: Details (current)");
    await ui.click(ui.host.querySelector('[aria-label="Step 1: Trailer (completed)"]')!);
    assert.doesNotMatch(ui.host.textContent, /Your approved pickup time is selected/);
    assert.match(ui.host.querySelector('[aria-checked="true"]')!.getAttribute("aria-label")!, /Utility/);
    await ui.render(React.createElement(BookingWizard, { key: "resume", initialTrailerSlug: "20-enclosed", savedDetails, resumeCheckoutKey: "resume-fixture" }));
    assert.match(ui.host.textContent, /Resumed payment fixture/);
    assert.equal(ui.host.querySelector('[aria-current="step"]')?.getAttribute("aria-label"), "Step 5: Payment (current)");
  } finally { await ui.close(); }
});

test("manual selection scrolls after SELECTED renders, only when needed, with reduced motion and focus preserved", async () => {
  const ui = await mount();
  const { StepTrailer } = await import("../src/components/booking/StepTrailer");
  let data = { trailerId: "", trailerSlug: "" };
  let reduced = false;
  let visible = false;
  const calls: ScrollIntoViewOptions[] = [];
  Object.defineProperty(ui.window, "innerHeight", { value: 800 });
  ui.window.matchMedia = (() => ({ matches: reduced })) as never;
  ui.window.HTMLElement.prototype.getBoundingClientRect = (() => ({ top: visible ? 500 : 1100, bottom: visible ? 556 : 1156 })) as never;
  ui.window.HTMLElement.prototype.scrollIntoView = function (options) {
    assert.match(ui.host.textContent, /SELECTED/);
    assert.equal(this.textContent, "Continue to Schedule");
    calls.push(options as ScrollIntoViewOptions);
  };
  function Harness() {
    const [form, setForm] = React.useState(data);
    return React.createElement(StepTrailer, { formData: form as never, updateForm: (updates) => { data = { ...data, ...updates }; setForm(data); }, onNext: () => assert.fail("must not auto advance") });
  }
  try {
    await ui.render(React.createElement(Harness, { key: "manual" }));
    assert.equal(calls.length, 0);
    const radios = ui.host.querySelectorAll('[role="radio"]');
    (radios[0] as import("happy-dom").HTMLElement).focus();
    await ui.click(radios[0]);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].behavior, "smooth");
    assert.equal(ui.window.document.activeElement, radios[0]);
    visible = true;
    await ui.click(radios[1]);
    assert.equal(calls.length, 1);
    visible = false; reduced = true;
    (radios[1] as import("happy-dom").HTMLElement).focus();
    await React.act(async () => { radios[1].dispatchEvent(new ui.window.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true })); });
    assert.equal(calls.length, 2);
    assert.equal(calls[1].behavior, "instant");
    assert.equal(ui.window.document.activeElement, radios[0]);
    assert.equal(radios[0].getAttribute("aria-checked"), "true");
    await ui.render(React.createElement(Harness, { key: "prefill" }));
    assert.equal(calls.length, 2, "prefill/remount must not scroll");
  } finally { await ui.close(); }
});
