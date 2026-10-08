const PALETTE = ["bg-brand-100 text-brand-800", "bg-amber-100 text-amber-800", "bg-sky-100 text-sky-800", "bg-rose-100 text-rose-800", "bg-violet-100 text-violet-800"];

export function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  const initials = name.replace(/^Dr\.?\s*/, "").split(" ").map((p) => p[0]).slice(0, 2).join("");
  const color = PALETTE[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % PALETTE.length];
  return (
    <span className={`grid shrink-0 place-items-center rounded-2xl font-bold ${color}`} style={{ width: size, height: size, fontSize: size / 2.6 }}>
      {initials}
    </span>
  );
}
