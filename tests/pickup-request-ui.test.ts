import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { registerHooks } from "node:module";
Object.assign(globalThis, { React });
registerHooks({
  load(url, context, next) {
    if (url.endsWith(".module.css"))
      return {
        format: "module",
        source: "export default {};",
        shortCircuit: true,
      };
    return next(url, context);
  },
});

test("first request opening uses current selections and reopening preserves its independent draft", async () => {
  const { Window } = await import("happy-dom");
  const window = new Window();
  Object.assign(globalThis, {
    window,
    document: window.document,
    HTMLElement: window.HTMLElement,
    Node: window.Node,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({ ok: true, days: [], checkedAtMs: Date.now() });
  const { createRoot } = await import("react-dom/client");
  const { StepDateTime } = await import(
    "../src/components/booking/StepDateTime"
  );
  const host = window.document.createElement("div");
  window.document.body.append(host);
  const root = createRoot(host as unknown as HTMLElement);
  let data = {
    trailerId: "trailer-004",
    date: "",
    time: "",
    duration: "fullDay",
  };
  const render = async () =>
    React.act(async () =>
      root.render(
        React.createElement(StepDateTime, {
          formData: data as never,
          updateForm: () => {},
          onNext: () => {},
          onBack: () => {},
        }),
      ),
    );
  try {
    await render();
    data = { ...data, date: "2027-10-10", duration: "oneWeek" };
    await render();
    const trigger = host.querySelector(
      '[aria-controls="pickup-request-dialog"]',
    )!;
    await React.act(async () =>
      trigger.dispatchEvent(new window.MouseEvent("click", { bubbles: true })),
    );
    assert.match(
      host.querySelector("#request-date")!.getAttribute("aria-label")!,
      /October 10, 2027/,
    );
    const duration = host.querySelector(
      "#request-duration",
    ) as import("happy-dom").HTMLSelectElement;
    assert.equal(duration.value, "oneWeek");
    await React.act(async () => {
      duration.value = "twoWeeks";
      duration.dispatchEvent(new window.Event("change", { bubbles: true }));
    });
    await React.act(async () =>
      host
        .querySelector('[aria-label="Close pickup request"]')!
        .dispatchEvent(new window.MouseEvent("click", { bubbles: true })),
    );
    await React.act(async () =>
      trigger.dispatchEvent(new window.MouseEvent("click", { bubbles: true })),
    );
    assert.equal(duration.value, "twoWeeks");
    assert.equal(data.date, "2027-10-10");
    assert.equal(data.duration, "oneWeek");
  } finally {
    await React.act(async () => root.unmount());
    globalThis.fetch = oldFetch;
    await window.happyDOM.abort();
  }
});

test("closed date and time pickers allow Escape to cancel the containing dialog", async () => {
  const { Window } = await import("happy-dom");
  const window = new Window();
  Object.assign(globalThis, {
    window,
    document: window.document,
    HTMLElement: window.HTMLElement,
    Node: window.Node,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  const { createRoot } = await import("react-dom/client");
  const { PickupDatePicker } = await import(
    "../src/components/booking/PickupDatePicker"
  );
  const { PickupTimePicker } = await import(
    "../src/components/booking/PickupTimePicker"
  );
  const host = window.document.createElement("div");
  window.document.body.append(host);
  const root = createRoot(host as unknown as HTMLElement);
  try {
    await React.act(async () =>
      root.render(
        React.createElement(
          React.Fragment,
          null,
          React.createElement(PickupDatePicker, {
            value: "2027-10-10",
            month: "2027-10",
            today: "2027-10-01",
            onChange: () => {},
            onMonthChange: () => {},
          }),
          React.createElement(PickupTimePicker, {
            value: "07:30",
            options: [{ value: "07:30", label: "7:30 AM" }],
            onChange: () => {},
          }),
        ),
      ),
    );
    for (const id of ["booking-date", "booking-time"]) {
      const trigger = host.querySelector(`#${id}`)!;
      const closedEscape = new window.KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      await React.act(async () => trigger.dispatchEvent(closedEscape));
      assert.equal(
        closedEscape.defaultPrevented,
        false,
        `${id}: closed picker must not swallow Escape`,
      );
      await React.act(async () =>
        trigger.dispatchEvent(
          new window.MouseEvent("click", { bubbles: true }),
        ),
      );
      const openEscape = new window.KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      await React.act(async () => trigger.dispatchEvent(openEscape));
      assert.equal(openEscape.defaultPrevented, true);
      assert.equal(trigger.getAttribute("aria-expanded"), "false");
    }
  } finally {
    await React.act(async () => root.unmount());
    await window.happyDOM.abort();
  }
});
test("schedule exposes only a secondary request trigger and a closed optional dialog", async () => {
  const { StepDateTime } = await import(
    "../src/components/booking/StepDateTime"
  );
  const html = renderToStaticMarkup(
    React.createElement(StepDateTime, {
      formData: {
        trailerId: "trailer-004",
        date: "2027-10-10",
        time: "08:00",
        duration: "fullDay",
      } as never,
      updateForm: () => {},
      onNext: () => {},
      onBack: () => {},
    }),
  );
  assert.match(html, /Need a different pickup time\?/);
  assert.match(html, /aria-controls="pickup-request-dialog"/);
  assert.doesNotMatch(html, /<dialog/);
  assert.doesNotMatch(html, /<dialog[^>]*\sopen(?:[=>\s])/);
  assert.match(html, /Check Availability/);
  assert.equal((html.match(/id="booking-time"/g) || []).length, 1);
  assert.equal((html.match(/id="request-time"/g) || []).length, 0);
});

test("a renter can correct submitted insurance while confirmation is pending", async () => {
  const { Window } = await import("happy-dom");
  const window = new Window();
  Object.assign(globalThis, { window, document: window.document, HTMLElement: window.HTMLElement, Node: window.Node, IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import("react-dom/client");
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  const { PostPaymentChecklist } = await import("../src/components/booking/PostPaymentChecklist");
  const host = window.document.createElement("div");
  window.document.body.append(host);
  const root = createRoot(host as unknown as HTMLElement);
  const render = async (bookingStatus: "under_review" | "ready_for_pickup") => React.act(async () => root.render(React.createElement(AppRouterContext.Provider, { value: { refresh() {} } as never }, React.createElement(PostPaymentChecklist, { bookingId: "insurance-correction", customerName: "Test Renter", defaultPolicyholder: "Test Renter", agreementStatus: "signed", identityStatus: "verified", insuranceStatus: "uploaded", bookingStatus, depositStatus: "charged", depositAmount: 20000, insurancePolicyNumber: "POL-1", insurancePolicyholder: "Test Rentr", hasInsuranceFile: true }))));
  try {
    await render("under_review");
    assert.equal(host.querySelector('form'), null);
    const edit = Array.from(host.querySelectorAll("button")).find(b => b.textContent === "Update insurance")!;
    assert.ok(edit);
    await React.act(async () => edit.dispatchEvent(new window.MouseEvent("click", { bubbles: true })));
    assert.ok(host.querySelector('form input[name="policyholder"]'));
    const cancel = Array.from(host.querySelectorAll("button")).find(b => b.textContent === "Cancel changes")!;
    await React.act(async () => cancel.dispatchEvent(new window.MouseEvent("click", { bubbles: true })));
    assert.equal(host.querySelector('form'), null);
    await render("ready_for_pickup");
    assert.equal(Array.from(host.querySelectorAll("button")).some(b => b.textContent === "Update insurance"), false);
  } finally {
    await React.act(async () => root.unmount());
    await window.happyDOM.close();
  }
});
