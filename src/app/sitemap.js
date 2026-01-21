export default function sitemap() {
  const baseUrl = "https://www.vrivalsarena.com";

  // Core pages of the application
  const routes = [
    "",
    "/tournaments",
    "/profile",
    "/player-finder",
    "/leaderboard",
    "/about",
    "/support",
    "/login",
    "/policy/privacy",
    "/policy/terms",
    "/policy/refund",
    "/policy/shipping",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/tournaments" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));

  return routes;
}
