"use client";

// FAQ accordion — custom, no shadcn dependency
import { useState } from "react";
import { ChevronDown } from "./Icons";

export interface FaqItem {
  q: string;
  a: string;
}

export default function Faq({ items }: { items: FaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const open = openIdx === i;
        return (
          <div
            key={i}
            className={`card-base overflow-hidden transition-colors ${
              open ? "border-line2" : ""
            }`}
          >
            <button
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              onClick={() => setOpenIdx(open ? null : i)}
              aria-expanded={open}
            >
              <span className="font-medium text-[15px] text-ink">{item.q}</span>
              <ChevronDown
                className={`w-4 h-4 text-soft shrink-0 transition-transform duration-300 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className="grid transition-all duration-300 ease-out"
              style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm text-soft leading-relaxed">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
