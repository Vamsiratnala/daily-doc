"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const WORDS = ["fever", "back pain", "skin rash", "toothache", "anxiety", "child's cough"];

export function HeroTitle() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl"
    >
      The right doctor for your
      <br />
      <span className="relative inline-flex h-[1.15em] overflow-hidden align-bottom text-brand-600">
        <AnimatePresence mode="wait">
          <motion.span
            key={WORDS[i]}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {WORDS[i]}
            <span className="text-ink">,</span>
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="text-ink"> nearby.</span>
    </motion.h1>
  );
}
