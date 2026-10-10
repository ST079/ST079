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
import HowIWork from "@/components/sections/HowIWork";
import SidekickLoader from "@/components/sidekick/SidekickLoader";

export default function Home() {
  return (
    // The 3D town is shown on top; this classic page sits underneath it.
    <ViewModeShell>
      <NavigationDock />
      <SidekickLoader />

      <main>
        {/* On lg+ screens, scrolling down slides these two panels sideways. */}
        <HorizontalScroll>
          <HeroSection />
          <AboutSection />
        </HorizontalScroll>

        {/* Words light up as you scroll through this band. */}
        <HowIWork />

        <ExperienceSection />
        <ProjectsSection />
        <SkillsSection />
        <EducationSection />
        <ContactSection />
      </main>
    </ViewModeShell>
  );
}
