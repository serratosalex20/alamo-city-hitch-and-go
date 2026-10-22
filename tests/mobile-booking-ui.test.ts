import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { registerHooks } from "node:module";
import { Window, type Element as DomElement } from "happy-dom";
import type { BookingFormData } from "../src/components/booking/BookingWizard";
import type { RentalDuration } from "../src/types/models";

Object.assign(globalThis, { React });
registerHooks({
  resolve(specifier, context, next) {
    if (["next/navigation", "next/image", "next/link"].includes(specifier))
      return { url: `mobile-fixture:${specifier}`, shortCircuit: true };
    if (specifier.replaceAll("\\", "/").replace(/\.tsx$/, "").endsWith("components/booking/StepPayment"))
      return { url: "mobile-fixture:payment", shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    const file = url.replaceAll("\\", "/").split("?")[0];
    let source: string | undefined;
    // Payment is outside these tests; avoid Stripe's import-time browser script.
    if (file === "mobile-fixture:payment") source = "export function StepPayment() { throw new Error('Payment must not mount in scheduling tests'); }";
    if (file.endsWith(".module.css")) source = "export default {};";
    if (file === "mobile-fixture:next/navigation") source = "export const useRouter = () => ({push() {}}); export const usePathname = () => '/book';";
    if (file === "mobile-fixture:next/image") source = "export default function Image({src, alt}) { return React.createElement('img', {src, alt}); }";
    if (file === "mobile-fixture:next/link") source = "export default function Link({children, ...props}) { return React.createElement('a', props, children); }";
    return source === undefined ? next(url, context) : { format: "module", source, shortCircuit: true };
  },
});

const date = "2030-10-10";
const slot = (time: string) => ({ value: time, label: time === "08:00" ? "8:00 AM" : "9:00 AM", startTimeMs: Date.parse(`${date}T${time}:00Z`) + 5 * 3600000 });
const calendar = (times = ["08:00", "09:00"]) => Response.json({ ok: true, days: [{ date, times: times.map(slot) }], checkedAtMs: Date.now() });
const deferred = () => {
  let resolve!: (value: Response) => void;
  const promise = new Promise<Response>((done) => { resolve = done; });
  return { promise, resolve };
};
type RequestHandler = (url: string, init?: RequestInit) => Promise<Response>;

async function mount(handler?: RequestHandler) {
  const window = new Window({ url: "http://localhost:3110/book" });
  Object.assign(globalThis, { window, self: window, document: window.document, HTMLElement: window.HTMLElement, Node: window.Node, IS_REACT_ACT_ENVIRONMENT: true });
  let visible = false;
  let reduced = false;
  const scrolls: { element: DomElement; options: ScrollIntoViewOptions }[] = [];
  window.matchMedia = (() => ({ matches: reduced })) as never;
  Object.defineProperty(window, "innerHeight", { value: 800 });
  window.HTMLElement.prototype.getBoundingClientRect = (() => ({ top: visible ? 400 : 1100, bottom: visible ? 500 : 1300, height: 200 })) as never;
  window.HTMLElement.prototype.scrollIntoView = function (options) { scrolls.push({ element: this, options: options as ScrollIntoViewOptions }); };
  const previousFetch = globalThis.fetch;
  const requests: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    requests.push({ url, init });
    if (url.includes("/api/auth/me")) return Response.json({ email: null });
    return handler ? handler(url, init) : init?.method === "POST" ? Response.json({ ok: true, available: true }) : calendar();
  };
  const { createRoot } = await import("react-dom/client");
  const host = window.document.createElement("div");
  window.document.body.append(host);
  const root = createRoot(host as unknown as HTMLElement);
  const render = async (element: React.ReactNode) => React.act(async () => root.render(element));
  const click = async (element: DomElement) => React.act(async () => { element.dispatchEvent(new window.MouseEvent("click", { bubbles: true })); });
  const button = (label: RegExp) => [...host.querySelectorAll("button")].find((item) => label.test(item.textContent))!;
  return { window, host, requests, scrolls, render, click, button,
    setVisible(value: boolean) { visible = value; }, setReduced(value: boolean) { reduced = value; },
    async close() { await React.act(async () => root.unmount()); globalThis.fetch = previousFetch; await window.happyDOM.abort(); },
  };
}

async function schedule(handler?: RequestHandler, initial: Partial<BookingFormData> = {}) {
  const ui = await mount(handler);
  const { StepDateTime } = await import("../src/components/booking/StepDateTime");
  let data = { trailerId: "trailer-002", date, time: "08:00", duration: "fullDay", ...initial } as BookingFormData;
  let advances = 0;
  function Harness() {
    const [form, setForm] = React.useState(data);
    return React.createElement(StepDateTime, { formData: form, updateForm: (updates) => { data = { ...data, ...updates }; setForm(data); }, onNext: () => { advances++; }, onBack() {} });
  }
  await ui.render(React.createElement(Harness));
  return { ...ui, get data() { return data; }, get advances() { return advances; },
    async duration(value: RentalDuration) {
      const labels = { halfDay: "Half Day", fullDay: "Full Day", oneWeek: "1 Week", twoWeeks: "2 Weeks" };
      await ui.click(ui.host.querySelector(`[role="radio"][aria-label^="${labels[value]}"]`)!);
    },
  };
}

test("duration changes keep a valid pickup time during refresh and after validation", async () => {
  const pending = deferred();
  const ui = await schedule(async (url) => url.includes("duration=halfDay") ? pending.promise : calendar());
  try {
    assert.equal(ui.scrolls.length, 0, "prefill must not scroll");
    await ui.duration("halfDay");
    assert.equal(ui.data.time, "08:00");
    assert.match(ui.host.querySelector("#booking-time")!.textContent, /8:00 AM/);
    assert.equal(ui.button(/Continue to your details/).hasAttribute("disabled"), true);
    await React.act(async () => pending.resolve(calendar()));
    assert.equal(ui.data.time, "08:00");
    assert.equal(ui.button(/Continue to your details/).hasAttribute("disabled"), false);
    assert.equal(ui.advances, 0);
    await ui.duration("halfDay");
    assert.equal(ui.data.time, "08:00", "reselecting the current duration must preserve time");
  } finally { await ui.close(); }
});

test("a duration that invalidates the selected time clears it with an explanation", async () => {
  const ui = await schedule(async (url) => calendar(url.includes("duration=oneWeek") ? ["09:00"] : undefined));
  try {
    await ui.duration("oneWeek");
    assert.equal(ui.data.time, "");
    assert.match(ui.host.querySelector('[role="alert"]')?.textContent ?? "", /pickup time.*no longer available.*Choose another pickup time/i);
    assert.equal(ui.button(/Continue to your details/).hasAttribute("disabled"), true);
    assert.equal(ui.advances, 0);
  } finally { await ui.close(); }
});

test("an availability error retains time until a successful refresh can validate it", async () => {
  let fail = true;
  const ui = await schedule(async (url) => url.includes("duration=twoWeeks") && fail ? Response.json({ ok: false, error: "Could not refresh pickups" }, { status: 503 }) : calendar());
  try {
    await ui.duration("twoWeeks");
    assert.equal(ui.data.time, "08:00");
    assert.match(ui.host.textContent, /Could not refresh pickups/);
    assert.equal(ui.button(/Continue to your details/).hasAttribute("disabled"), true);
    fail = false;
    await ui.click(ui.button(/Try Again/));
    assert.equal(ui.data.time, "08:00");
    assert.equal(ui.button(/Continue to your details/).hasAttribute("disabled"), false);
  } finally { await ui.close(); }
});

test("only manual completion reveals the Details CTA and never submits availability automatically", async () => {
  const ui = await schedule(undefined, { time: "" });
  try {
    assert.equal(ui.scrolls.length, 0);
    const trigger = ui.host.querySelector("#booking-time")!;
    (trigger as import("happy-dom").HTMLElement).focus();
    await ui.click(trigger);
    const pickerScrolls = ui.scrolls.length;
    await ui.click(ui.host.querySelector('[role="option"]')!);
    assert.equal(ui.scrolls.length, pickerScrolls + 1);
    assert.match(ui.scrolls.at(-1)!.element.textContent, /Continue to your details/);
    assert.ok(ui.window.document.activeElement === trigger, "time picker retains focus");
    assert.equal(ui.requests.filter((r) => r.init?.method === "POST").length, 0);
    assert.equal(ui.advances, 0);
    ui.setVisible(true);
    await ui.duration("halfDay");
    assert.equal(ui.scrolls.length, pickerScrolls + 1, "already-visible CTA must not scroll");
    await React.act(async () => { ui.window.dispatchEvent(new ui.window.Event("focus")); });
    assert.equal(ui.scrolls.length, pickerScrolls + 1, "background refresh must not scroll");
    await ui.click(ui.button(/Continue to your details/));
    assert.equal(ui.requests.filter((r) => r.init?.method === "POST").length, 1);
    assert.equal(ui.advances, 1);
  } finally { await ui.close(); }
});

test("calendar opening reveals the whole panel with reduced motion and keeps keyboard focus", async () => {
  const ui = await mount();
  const { PickupDatePicker } = await import("../src/components/booking/PickupDatePicker");
  let changes = 0;
  try {
    ui.setReduced(true);
    await ui.render(React.createElement(PickupDatePicker, { value: "", month: "2030-10", today: "2030-10-01", onMonthChange() {}, onChange() { changes++; } }));
    const trigger = ui.host.querySelector("#booking-date")!;
    await ui.click(trigger);
    assert.equal(ui.scrolls.length, 1);
    assert.equal(ui.scrolls[0].element.getAttribute("role"), "dialog");
    assert.equal(ui.scrolls[0].options.behavior, "instant");
    assert.equal(ui.window.document.activeElement?.getAttribute("aria-label"), "Close calendar");
    await React.act(async () => { ui.host.querySelector('[aria-label="Close calendar"]')!.dispatchEvent(new ui.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })); });
    assert.equal(trigger.getAttribute("aria-expanded"), "false");
    assert.ok(ui.window.document.activeElement === trigger, "Escape restores focus to date trigger");
    assert.equal(changes, 0);
  } finally { await ui.close(); }
});

test("opening pickup time reveals its option panel without changing value or focus", async () => {
  const ui = await mount();
  const { PickupTimePicker } = await import("../src/components/booking/PickupTimePicker");
  try {
    await ui.render(React.createElement(PickupTimePicker, { value: "08:00", options: [slot("08:00"), slot("09:00")], onChange() { assert.fail("opening must not select"); } }));
    const trigger = ui.host.querySelector("#booking-time")!;
    (trigger as import("happy-dom").HTMLElement).focus();
    await ui.click(trigger);
    assert.equal(ui.scrolls.length, 1);
    assert.ok(ui.scrolls[0].element.querySelector('[role="listbox"]'));
    assert.ok(ui.window.document.activeElement === trigger, "combobox retains focus");
    assert.match(trigger.textContent, /8:00 AM/);
  } finally { await ui.close(); }
});

test("reselecting a trailer reveals Continue without advancing, while prefill never scrolls", async () => {
  const ui = await mount();
  const { StepTrailer } = await import("../src/components/booking/StepTrailer");
  let data = { trailerId: "", trailerSlug: "" };
  function Harness() {
    const [form, setForm] = React.useState(data);
    return React.createElement(StepTrailer, { formData: form as BookingFormData, updateForm(updates) { data = { ...data, ...updates }; setForm(data); }, onNext() { assert.fail("no auto advance"); } });
  }
  try {
    await ui.render(React.createElement(Harness));
    const first = ui.host.querySelector('[role="radio"]')!;
    await ui.click(first);
    await ui.click(first);
    assert.equal(ui.scrolls.length, 2);
    assert.match(ui.scrolls[1].element.textContent, /Continue to Schedule/);
    await ui.render(React.createElement(Harness, { key: "prefill" }));
    assert.equal(ui.scrolls.length, 2);
  } finally { await ui.close(); }
});

test("Continue focuses and reveals Schedule, validated continuation focuses Your Details", async () => {
  const pending = deferred();
  const ui = await mount(async (_url, init) => init?.method === "POST" ? pending.promise : calendar());
  const { BookingWizard } = await import("../src/components/booking/BookingWizard");
  try {
    await ui.render(React.createElement(BookingWizard, { savedDetails: { date, time: "08:00", duration: "fullDay" } }));
    await ui.click(ui.host.querySelector('[role="radio"]')!);
    await ui.click(ui.button(/Continue to Schedule/));
    assert.ok(ui.window.document.activeElement === ui.host.querySelector("h2"), "Schedule heading receives focus");
    assert.match(ui.scrolls.at(-1)!.element.textContent, /Pick Your Schedule/);
    assert.equal(ui.scrolls.at(-1)!.options.block, "start");
    const next = ui.button(/Continue to your details/);
    await ui.click(next);
    assert.equal(next.hasAttribute("disabled"), true);
    assert.match(next.textContent, /Checking availability/);
    assert.doesNotMatch(ui.host.textContent, /Your Details/);
    const posts = ui.requests.filter((r) => r.init?.method === "POST");
    assert.deepEqual(JSON.parse(String(posts[0].init?.body)), { trailerId: "trailer-002", date, time: "08:00", duration: "fullDay" });
    await React.act(async () => pending.resolve(Response.json({ ok: true, available: true })));
    assert.match(ui.host.querySelector("h2")!.textContent, /Your Details/);
    assert.ok(ui.window.document.activeElement === ui.host.querySelector("h2"), "Details heading receives focus");
    assert.equal(ui.scrolls.at(-1)!.options.block, "start");
    assert.equal(ui.requests.some((r) => r.url.includes("checkout")), false);
  } finally { await ui.close(); }
});

test("a stale availability validation cannot advance after the schedule changes", async () => {
  const pending = deferred();
  const ui = await schedule(async (_url, init) => init?.method === "POST" ? pending.promise : calendar());
  try {
    await ui.click(ui.button(/Check Availability|Continue to your details/));
    await ui.duration("halfDay");
    await React.act(async () => pending.resolve(Response.json({ ok: true, available: true })));
    assert.equal(ui.advances, 0);
    assert.equal(ui.data.duration, "halfDay");
  } finally { await ui.close(); }
});

test("a temporary validation failure preserves choices and offers retry without advancing", async () => {
  let failing = true;
  const ui = await schedule(async (_url, init) => init?.method === "POST"
    ? failing ? Response.json({ ok: false, error: "Availability service unavailable. Please retry." }, { status: 503 }) : Response.json({ ok: true, available: true })
    : calendar());
  try {
    await ui.click(ui.button(/Continue to your details/));
    assert.equal(ui.advances, 0);
    assert.equal(ui.data.time, "08:00");
    assert.match(ui.host.textContent, /Availability service unavailable/);
    failing = false;
    await ui.click(ui.button(/Continue to your details/));
    assert.equal(ui.advances, 1);
  } finally { await ui.close(); }
});

test("backend rejection clears a newly unavailable time with an explanation and prevents advancement", async () => {
  const ui = await schedule(async (_url, init) => init?.method === "POST"
    ? Response.json({ ok: true, available: false, error: "This pickup was just booked. Choose another time." }) : calendar());
  try {
    await ui.click(ui.button(/Continue to your details/));
    assert.equal(ui.advances, 0);
    assert.equal(ui.data.time, "");
    assert.match(ui.host.querySelector('[role="alert"]')?.textContent ?? "", /just booked.*Choose another time/);
    assert.equal(ui.button(/Continue to your details/).hasAttribute("disabled"), true);
  } finally { await ui.close(); }
});

test("an older calendar response cannot clear a time accepted for the latest duration", async () => {
  const older = deferred();
  const newer = deferred();
  const ui = await schedule(async (url) => url.includes("duration=halfDay") ? older.promise : url.includes("duration=oneWeek") ? newer.promise : calendar());
  try {
    await ui.duration("halfDay");
    await ui.duration("oneWeek");
    await React.act(async () => newer.resolve(calendar()));
    assert.equal(ui.data.time, "08:00");
    await React.act(async () => older.resolve(calendar(["09:00"])));
    assert.equal(ui.data.time, "08:00");
    assert.equal(ui.data.duration, "oneWeek");
  } finally { await ui.close(); }
});
