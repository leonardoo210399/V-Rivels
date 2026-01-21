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
    description:
      "Join VRivals Arena for the ultimate Valorant tournament experience. Compete in daily scrims, track your stats, find teams, and climb the leaderboards.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
