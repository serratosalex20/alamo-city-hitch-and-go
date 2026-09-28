"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Clock3 } from "lucide-react";
import type { PickupTimeOption } from "@/lib/booking/schedule";
import styles from "./BookingPickers.module.css";

interface Props {
  value: string;
  options: readonly PickupTimeOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function PickupTimePicker({ value, options, onChange, disabled, placeholder = "Choose a pickup time" }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const search = useRef({ text: "", time: 0 });
  const selected = options.find(option => option.value === value);
  const expanded = open && !disabled && options.length > 0;
  const activeIndex = Math.min(active, options.length - 1);

  useEffect(() => {
    if (!expanded) return;
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const option = list.current?.children[activeIndex] as HTMLElement | undefined;
    const menu = list.current;
    if (option && menu) {
      const top = option.offsetTop - menu.offsetTop;
      if (top < menu.scrollTop || top + option.offsetHeight > menu.scrollTop + menu.clientHeight) {
        menu.scrollTo({ top: top - menu.clientHeight / 2 + option.offsetHeight / 2,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      }
    }
  }, [expanded, activeIndex]);

  function show(index = Math.max(0, options.findIndex(option => option.value === value))) {
    setActive(index);
    setOpen(true);
  }

  function choose(index: number) {
    if (options[index]) onChange(options[index].value);
    setOpen(false);
    trigger.current?.focus();
  }

  function handleKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled || !options.length) return;
    const last = options.length - 1;
    if (event.key === "Escape") { setOpen(false); event.preventDefault(); return; }
    if (event.key === "Tab") { if (expanded) choose(activeIndex); return; }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (expanded) choose(activeIndex); else show();
      return;
    }
    if (["ArrowDown", "ArrowUp", "Home", "End", "PageDown", "PageUp"].includes(event.key)) {
      event.preventDefault();
      const index = event.key === "Home" ? 0 : event.key === "End" ? last
        : !expanded ? Math.max(0, options.findIndex(option => option.value === value))
        : Math.max(0, Math.min(last, activeIndex + ({ ArrowDown: 1, ArrowUp: -1, PageDown: 6, PageUp: -6 }[event.key] ?? 0)));
      show(index);
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      search.current.text = (now - search.current.time > 700 ? "" : search.current.text) + event.key.toLowerCase();
      search.current.time = now;
      const index = options.findIndex(option => option.label.toLowerCase().startsWith(search.current.text));
      if (index >= 0) { event.preventDefault(); show(index); }
    }
  }

  return (
    <div ref={root} className="relative" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
    }}>
      <button ref={trigger} id="booking-time" type="button" role="combobox" aria-label="Pickup time"
        aria-controls="pickup-time-options" aria-expanded={expanded} aria-haspopup="listbox" aria-required="true"
        aria-activedescendant={expanded ? `pickup-time-${activeIndex}` : undefined} aria-describedby="booking-time-help"
        disabled={disabled || options.length === 0} onKeyDown={handleKey}
        onClick={() => expanded ? setOpen(false) : show()}
        className="w-full min-h-[58px] flex items-center gap-3 text-left bg-surface-container-low text-on-surface font-body py-4 px-5 ghost-border cursor-pointer hover:border-primary-action focus-visible:outline-2 focus-visible:outline-primary-action disabled:opacity-50 disabled:cursor-not-allowed">
        <Clock3 size={19} className="text-primary shrink-0" aria-hidden="true" />
        <span className="flex-1">{selected?.label ?? placeholder}</span>
        <ChevronDown size={18} aria-hidden="true" className={`shrink-0 transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && <div className={`${styles.panel} absolute top-full left-0 right-0 z-50 mt-2 border border-outline-variant bg-surface-container shadow-2xl`}>
        <p className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">Pickup time · Central Time</p>
        <ul ref={list} id="pickup-time-options" role="listbox" aria-label="Pickup time" className={`${styles.scrollArea} relative max-h-[min(18rem,45dvh)] overflow-y-auto p-2 m-0 list-none`}>
          {options.map((option, index) => <li key={option.value} id={`pickup-time-${index}`} role="option"
            aria-selected={value === option.value} onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}
            className={`min-h-[48px] px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${value === option.value ? "bg-primary-action text-white" : index === activeIndex ? "bg-surface-container-highest text-on-surface" : "text-on-surface hover:bg-surface-container-high"}`}>
            {option.label}{value === option.value && <Check size={18} aria-hidden="true" />}
          </li>)}
        </ul>
      </div>}
    </div>
  );
}
