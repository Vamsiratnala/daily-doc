"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function StatsBand({ stats }: { stats: { value: number; suffix?: string; decimals?: number; label: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.dataset.count);
        const decimals = Number(el.dataset.decimals ?? 0);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
          onUpdate: () => (el.textContent = obj.v.toFixed(decimals)),
        });
      });
      gsap.from("[data-stat]", {
        y: 30,
        opacity: 0,
        stagger: 0.12,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: ref.current, start: "top 80%", once: true },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} data-stat className="text-center">
          <p className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            <span data-count={s.value} data-decimals={s.decimals ?? 0}>0</span>
            {s.suffix}
          </p>
          <p className="mt-1 text-sm text-brand-100/80">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
