// Site-wide configuration for the portfolio
// Centralize all configurable items here for easy maintenance
export const siteConfig = {
  // Site metadata (used in <head> and for SEO)
  siteTitle: 'Sujan Tamang | Software Developer',
  siteDescription: 'ST079 Portfolio',

  // Author information
  authorName: 'Sujan Tamang',

  // Navigation configuration
  navigation: {
    // Main navigation sections (in-page links)
    sections: [
      { id: 'home', label: 'Home' },
      { id: 'projects', label: 'Projects' },
      { id: 'about', label: 'About' },
      { id: 'contact', label: 'Contact' }
    ],
    // External links (social media, etc.)
    externalLinks: [
      {
        href: 'https://github.com/ST079',
        label: 'GitHub',
        // Icon: GithubIcon (imported separately in component)
      },
      {
        href: 'https://linkedin.com/in/sujantamang80', // Update this to your actual LinkedIn profile
        label: 'LinkedIn',
        // Icon: LinkedInIcon (imported separately in component)
      }
    ]
  },

  // Loader configuration
  loader: {
    // Whether to show text beneath the loader animation
    showText: false,
    // Text to display when showText is true
    text: 'Loading portfolio...'
  },

  // Accessibility titles
  socialLinksTitle: 'Social Media Links',

  // UI colors
  pointerColor: 'blue-500'
};

export default siteConfig;