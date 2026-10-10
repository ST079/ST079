import ContactContent from "@/components/content/ContactContent";
import EducationContent from "@/components/content/EducationContent";
import ProjectsContent from "@/components/content/ProjectsContent";
import SkillsContent from "@/components/content/SkillsContent";
import Section from "./Section";
import SkillsPlayground from "./SkillsPlayground";

// The classic page's vertical sections. Their bodies are the same components
// the town shows in its panels (src/components/content), plus a few
// classic-only interactive pieces. Experience has its own sideways layout, in
// ExperienceSection.tsx.

export function ProjectsSection() {
  return (
    <Section
      id="projects"
      eyebrow="Projects"
      title="Things I've built"
      intro="Mostly backend: event-driven services, GraphQL tooling and APIs, plus a few full-stack apps."
    >
      <ProjectsContent />
    </Section>
  );
}

export function SkillsSection() {
  return (
    <Section
      id="skills"
      eyebrow="Skills"
      title="Tools of the trade"
      intro="My stack, ready to play with. The solid chips are what I use every day at work."
    >
      <SkillsPlayground />
      <div className="mt-10">
        <SkillsContent />
      </div>
    </Section>
  );
}

export function EducationSection() {
  return (
    <Section id="education" eyebrow="Education" title="Learning, formally and otherwise">
      <EducationContent />
    </Section>
  );
}

export function ContactSection() {
  return (
    <div className="pb-32">
      <Section id="contact" eyebrow="Contact" title="Let's build something reliable.">
        <ContactContent />
      </Section>
    </div>
  );
}
