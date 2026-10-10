import { Award, GraduationCap } from "lucide-react";

import profile from "@/config/profile";
import { Eyebrow } from "./shared";

export default function EducationContent() {
  return (
    <div className="@container">
      <div className="grid gap-8 @3xl:grid-cols-2">
        <div>
          <Eyebrow>Education</Eyebrow>
          <ul className="mt-3 space-y-3">
            {profile.education.map((item) => (
              <li key={item.school} className="flex gap-4 rounded-2xl border bg-card p-5">
                <GraduationCap className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <p className="font-medium">{item.degree}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {item.school} · {item.period}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Eyebrow>Certifications</Eyebrow>
          <ul className="mt-3 divide-y rounded-2xl border bg-card">
            {profile.certifications.map((name) => (
              <li key={name} className="flex items-center gap-3 px-5 py-3 text-sm">
                <Award className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
