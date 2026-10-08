import NavigationDock from "@/components/layout/NavigationDock";
import HorizontalScroll from "@/components/layout/HorizontalScroll";
import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";

export default function Home() {
  return (
    <>
      <NavigationDock />

      {/* On lg+ screens, scrolling down slides the panels sideways. */}
      <HorizontalScroll>
        <HeroSection />
        <AboutSection />
      </HorizontalScroll>
    </>
  );
}
