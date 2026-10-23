import { useEffect, useRef, type FocusEvent, type RefObject } from "react";

// Safari may blur with no relatedTarget after pointerup, before touch click.
// Keep its target mounted; neither pointerdown nor scrolling selects a value.
export function usePickerDismissal(root: RefObject<HTMLDivElement | null>, open: boolean, dismiss: (open: boolean) => void) {
  const pointerInside = useRef(false);
  useEffect(() => {
    if (!open) return;
    const down = (event: PointerEvent) => {
      pointerInside.current = Boolean(root.current?.contains(event.target as Node));
      if (!pointerInside.current) dismiss(false);
    };
    const end = () => { pointerInside.current = false; };
    document.addEventListener("pointerdown", down);
    document.addEventListener("click", end);
    document.addEventListener("pointercancel", end);
    document.addEventListener("keydown", end, true);
    return () => {
      pointerInside.current = false;
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("click", end);
      document.removeEventListener("pointercancel", end);
      document.removeEventListener("keydown", end, true);
    };
  }, [root, open, dismiss]);
  return (event: FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget === null && pointerInside.current) return;
    if (!event.currentTarget.contains(event.relatedTarget as Node)) dismiss(false);
  };
}
