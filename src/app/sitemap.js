import { getTournaments } from "@/lib/tournaments";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

// Hardcoded for sitemap generation to avoid circular dependencies or context issues
const DATABASE_ID = "valo-website-database";
const USERS_COLLECTION_ID = "users";

export default async function sitemap() {
  const baseUrl = "https://www.vrivalsarena.com";

  // 1. Core Pages
  const staticRoutes = [
    "",
    "/tournaments",
    "/profile",
    "/player-finder",
    "/leaderboard",
    "/about",
    "/support",
    "/login",
    "/rules",
    "/faq",
    "/cancellation-policy",
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

  let tournamentRoutes = [];
  let playerRoutes = [];

  // 2. Tournament Pages
  try {
    const tournaments = await getTournaments();
    tournamentRoutes = tournaments.map((tournament) => ({
      url: `${baseUrl}/tournaments/${tournament.$id}`,
      lastModified: new Date(tournament.$updatedAt || tournament.$createdAt),
      changeFrequency: "daily",
      priority: 0.9,
      images: tournament.banner ? [tournament.banner] : [], // Add banner image if available
    }));
  } catch (error) {
    console.warn("Failed to generate tournament sitemap users:", error);
  }

  // 3. User Profile Pages
  try {
    // Fetch all users (pagination might be needed for very large sets, keeping simple for now)
    const users = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.limit(1000)] // Adjust limit as needed
    );

    playerRoutes = users.documents.map((user) => ({
      url: `${baseUrl}/player/${user.$id}`,
      lastModified: new Date(user.$updatedAt || user.$createdAt),
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch (error) {
    console.warn("Failed to generate player sitemap:", error);
  }

  return [...staticRoutes, ...tournamentRoutes, ...playerRoutes];
}
