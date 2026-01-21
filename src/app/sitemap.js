import { getTournaments } from "@/lib/tournaments";

export default async function sitemap() {
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
    changeFrequency:
      route === "" || route === "/tournaments" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));

  try {
    const tournaments = await getTournaments();
    const tournamentRoutes = tournaments.map((tournament) => ({
      url: `${baseUrl}/tournaments/${tournament.$id}`,
      lastModified: new Date(tournament.$updatedAt || tournament.$createdAt), // Use database timestamp
      changeFrequency: "daily",
      priority: 0.9, // High priority for individual tournaments
    }));

    return [...routes, ...tournamentRoutes];
  } catch (error) {
    console.error("Failed to generate tournament sitemap:", error);
    return routes;
  }
}
