import HorizontalScroll from "@/components/layout/HorizontalScroll";
import NavigationDock from "@/components/layout/NavigationDock";
import ViewModeShell from "@/components/layout/ViewModeShell";
import AboutSection from "@/components/sections/AboutSection";
import {
  ContactSection,
  EducationSection,
  ExperienceSection,
  ProjectsSection,
  SkillsSection,
} from "@/components/sections/ContentSections";
import HeroSection from "@/components/sections/HeroSection";

export default function Home() {
  return (
    // The 3D town is shown on top; this classic page sits underneath it.
    <ViewModeShell>
      <NavigationDock />

      <main>
        {/* On lg+ screens, scrolling down slides these two panels sideways. */}
        <HorizontalScroll>
          <HeroSection />
          <AboutSection />
        </HorizontalScroll>

        <ExperienceSection />
        <ProjectsSection />
        <SkillsSection />
        <EducationSection />
        <ContactSection />
      </main>
    </ViewModeShell>
  );
}
