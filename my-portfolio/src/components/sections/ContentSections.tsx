import ContactContent from "@/components/content/ContactContent";
import EducationContent from "@/components/content/EducationContent";
import ExperienceContent from "@/components/content/ExperienceContent";
import ProjectsContent from "@/components/content/ProjectsContent";
import SkillsContent from "@/components/content/SkillsContent";
import Section from "./Section";

// The classic page's vertical sections. Their bodies are the same components
// the town shows in its panels (src/components/content).

export function ExperienceSection() {
  return (
    <Section id="experience" eyebrow="Experience" title="Where I've been building">
      <ExperienceContent />
    </Section>
  );
}

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
    <Section id="skills" eyebrow="Skills" title="Tools of the trade">
      <SkillsContent />
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
