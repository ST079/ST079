import profile from "@/config/profile";
import { cn } from "@/lib/utils";
import { Eyebrow, Tag } from "./shared";

type Job = (typeof profile.experience)[number];

/** One role: title, company, dates, summary, highlights and stack. */
export function RoleCard({ job, className }: { job: Job; className?: string }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-5 @2xl:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h3 className="text-base font-semibold @2xl:text-lg">{job.role}</h3>
          <p className="text-sm text-muted-foreground">
            {job.company} · {job.location}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
          {job.current && <span className="size-1.5 rounded-full bg-emerald-500" />}
          {job.period}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{job.summary}</p>

      <ul className="mt-4 grid gap-x-6 gap-y-2 text-sm @3xl:grid-cols-2">
        {job.highlights.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-muted-foreground" aria-hidden>
              –
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {job.stack.map((tech) => (
          <Tag key={tech}>{tech}</Tag>
        ))}
      </div>
    </div>
  );
}

/** The earlier roles, listed under "Before that". */
export function EarlierRoles() {
  return (
    <div>
      <Eyebrow>Before that</Eyebrow>
      <ul className="mt-3 grid gap-2 @xl:grid-cols-2 @4xl:grid-cols-4">
        {profile.previously.map((job) => (
          <li key={job.org} className="rounded-xl border bg-card px-4 py-3">
            <p className="text-sm font-medium">{job.role}</p>
            <p className="text-xs text-muted-foreground">
              {job.org}
              {job.period && ` · ${job.period}`}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The experience as a vertical list. The town's panel uses this; the classic
 *  page lays the same cards out in a sideways row (see ExperienceSection). */
export default function ExperienceContent() {
  return (
    <div className="@container space-y-8">
      <ol className="space-y-4">
        {profile.experience.map((job) => (
          <li key={job.role}>
            <RoleCard job={job} />
          </li>
        ))}
      </ol>
      <EarlierRoles />
    </div>
  );
}
