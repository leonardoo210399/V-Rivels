"use client";
import { useEffect, useState, use } from "react";
import ProfileView from "@/components/ProfileView";
import { getAccount, getMMR, getMatches, getPlayerCard } from "@/lib/valorant";

export default function GlobalProfilePage({ params }) {
  const { name, tag } = use(params);

  // Decode parameters as they might be URI encoded
  const decodedName = decodeURIComponent(name);
  const decodedTag = decodeURIComponent(tag);

  const [profile, setProfile] = useState(null);
  const [valorantStats, setValorantStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (decodedName && decodedTag) {
      loadProfile();
    }
  }, [decodedName, decodedTag]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // 1. Fetch Account Data
      const accountRes = await getAccount(decodedName, decodedTag);
      const accountData = accountRes.data;

      if (!accountData) {
        throw new Error("Player not found");
      }

      // Construct basic profile object for the view
      setProfile({
        ingameName: accountData.name,
        tag: accountData.tag,
        region: accountData.region,
        // No Appwrite specific data for global search results
        discordTag: null,
      });

      setValorantStats({
        account: accountData,
        mmr: null,
        card: null,
      });

      // 2. Fetch parallel data
      const region = accountData.region || "ap";

      // Fetch Card
      if (accountData.card) {
        getPlayerCard(accountData.card).then((res) => {
          if (res?.data) {
            setValorantStats((prev) => ({ ...prev, card: res.data }));
          }
        });
      }

      // Fetch MMR and Matches
      const [mmrRes, matchesRes] = await Promise.allSettled([
        getMMR(accountData.puuid, region),
        getMatches(accountData.puuid, region),
      ]);

      if (mmrRes.status === "fulfilled" && mmrRes.value.data) {
        setValorantStats((prev) => ({ ...prev, mmr: mmrRes.value.data }));
      }

      if (matchesRes.status === "fulfilled" && matchesRes.value.data) {
        setMatches(matchesRes.value.data);
      }
    } catch (e) {
      // Only log unexpected errors. Account not found is a valid state for 404 page.
      if (
        !e.message?.includes("Failed to fetch account") &&
        !e.message?.includes("Player not found")
      ) {
        console.error(e);
      }
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileView
      loading={loading}
      profile={profile}
      valorantStats={valorantStats}
      dbStats={null} // No dbStats for global search
      matches={matches}
      isPublic={true}
    />
  );
}
