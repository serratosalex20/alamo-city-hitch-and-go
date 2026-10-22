/** Keep booking targets clear of the fixed navbar and mobile viewport edges. */
export function revealBookingTarget(
  target: HTMLElement | null,
  block: ScrollLogicalPosition = "nearest",
) {
  if (!target) return;
  const viewport = window.visualViewport;
  const offset = viewport?.offsetTop ?? 0;
  const rect = target.getBoundingClientRect();
  if (
    block === "nearest" &&
    rect.top >= offset + 96 &&
    rect.bottom <= offset + (viewport?.height ?? window.innerHeight) - 16
  ) return;
  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
    block,
  });
}
