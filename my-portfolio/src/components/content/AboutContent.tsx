import { Check } from "lucide-react";

import profile from "@/config/profile";
import { Eyebrow } from "./shared";

export default function AboutContent() {
  return (
    <div className="@container">
      <div className="grid gap-8 @4xl:grid-cols-[1.15fr_1fr] @4xl:items-start">
        <div className="space-y-4">
          <p className="text-base leading-relaxed text-foreground @2xl:text-lg">
            {profile.summary}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground @2xl:text-base">
            {profile.edge}
          </p>
          <dl className="grid grid-cols-2 gap-3 pt-2">
            {profile.facts.map(({ label, value }) => (
              <div key={label} className="rounded-xl border bg-card px-4 py-3">
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <Eyebrow>What I do</Eyebrow>
          <ul className="mt-4 space-y-2.5 text-sm">
            {profile.whatIDo.map((item) => (
              <li key={item} className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
