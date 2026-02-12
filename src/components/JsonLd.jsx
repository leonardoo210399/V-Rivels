export default function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "VRivals Arena",
    url: "https://www.vrivalsarena.com",
    logo: "https://www.vrivalsarena.com/vrivals_logo.png",
    sameAs: [
      "https://twitter.com/vrivalsarena",
      "https://instagram.com/vrivalsarena",
      "https://discord.gg/vrivalsarena",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@vrivalsarena.com",
      contactType: "customer support",
    },
    description:
      "Play in daily Valorant Scrims and Tournaments in India. Join free entry & prize pool tournaments, find teammates, track stats, and earn money playing Valorant on VRivals Arena.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
