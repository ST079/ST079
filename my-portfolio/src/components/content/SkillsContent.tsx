import profile from "@/config/profile";
import { Eyebrow, Tag } from "./shared";

export default function SkillsContent() {
  return (
    <div className="@container">
      <div className="grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
        {profile.skills.map(({ group, items }) => (
          <div key={group} className="rounded-2xl border bg-card p-5">
            <Eyebrow>{group}</Eyebrow>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {items.map((item) => (
                <Tag key={item}>{item}</Tag>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
