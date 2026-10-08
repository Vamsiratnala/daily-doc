"use client";

import { useState } from "react";
import { submitReview } from "@/app/actions/booking";

export function ReviewForm({ appointmentId }: { appointmentId: string }) {
  const [rating, setRating] = useState(0);
  return (
    <form action={submitReview} className="mt-3 flex flex-col gap-2 rounded-xl bg-amber-50/60 p-3 sm:flex-row sm:items-center">
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <input type="hidden" name="rating" value={rating} />
      <span className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <button type="button" key={i} onClick={() => setRating(i)} className={`text-2xl leading-none ${i <= rating ? "text-amber-400" : "text-black/15"}`} aria-label={`${i} stars`}>★</button>
        ))}
      </span>
      <input name="comment" placeholder="How was your visit? (optional)" className="input flex-1 py-2" />
      <button className="btn-primary py-2" disabled={!rating}>Rate visit</button>
    </form>
  );
}
