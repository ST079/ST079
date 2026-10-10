import NavigationDock from "@/components/layout/NavigationDock";
import ViewModeShell from "@/components/layout/ViewModeShell";
import AboutSection from "@/components/sections/AboutSection";
import {
  ContactSection,
  EducationSection,
  ProjectsSection,
  SkillsSection,
} from "@/components/sections/ContentSections";
import ExperienceSection from "@/components/sections/ExperienceSection";
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
        <HeroSection />
        <AboutSection />

        {/* Words light up as you scroll through this band. */}
        <HowIWork />

        {/* On large screens this pins while its cards slide sideways. */}
        <ExperienceSection />
        <ProjectsSection />
        <SkillsSection />
        <EducationSection />
        <ContactSection />
      </main>
    </ViewModeShell>
  );
}
