"use client";
import { useEffect, useState, use } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import ProfileView from "@/components/ProfileView";
import {
  getAccount,
  getMMR,
  getMMRByName,
  getMatches,
  getPlayerCard,
} from "@/lib/valorant";

// Assuming we have these from your config:
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = "users";
const REGISTRATIONS_COLLECTION_ID = "registrations";

export default function PublicProfilePage({ params }) {
  const { id } = use(params);
  const [profile, setProfile] = useState(null);
  const [valorantStats, setValorantStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [dbStats, setDbStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      // 1. Fetch Appwrite User Document
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        id,
      );
      setProfile(userDoc);

      // 2. Fetch Appwrite Stats (Tournaments)
      const registrations = await databases.listDocuments(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        [Query.equal("userId", id)],
      );
      setDbStats({
        tournamentsPlayed: registrations.total,
        totalEarnings: userDoc.totalEarnings || 0,
        tournamentsWon: userDoc.tournamentsWon || 0,
        matchesWon: userDoc.matchesWon || 0,
        runnerUp: userDoc.runnerUp || 0,
      });

      // 3. Fetch Valorant Stats (if linked)
      if (userDoc.ingameName && userDoc.tag) {
        try {
          const accountData = await getAccount(userDoc.ingameName, userDoc.tag);

          if (accountData.data) {
            const region = userDoc.region || accountData.data.region || "ap";
            setValorantStats({
              account: accountData.data,
              mmr: null,
              card: null,
            });

            // 1. Fetch Card Data first
            if (accountData.data.card) {
              try {
                const cardRes = await getPlayerCard(accountData.data.card);
                if (cardRes?.data) {
                  setValorantStats((prev) => ({ ...prev, card: cardRes.data }));
                }
              } catch (e) {
                console.error("Card fetch failed:", e);
              }
            }

            // 2. Fetch MMR and Matches
            try {
              const fetchedMMR = await getMMR(
                accountData.data.puuid,
                region,
              ).catch(async (e) => {
                console.error(
                  "MMR fetch by PUUID failed for profile, trying Name/Tag fallback...",
                  e,
                );
                return await getMMRByName(
                  region,
                  userDoc.ingameName,
                  userDoc.tag,
                ).catch(() => null);
              });

              const fetchedMatches = await getMatches(
                accountData.data.puuid,
                region,
              ).catch(() => ({ data: [] }));

              setValorantStats((prev) => ({
                ...prev,
                mmr: fetchedMMR?.data || null,
              }));
              setMatches(fetchedMatches?.data || []);
            } catch (e) {
              console.error("MMR/Matches fetch failed:", e);
            }
          }
        } catch (apiError) {
          console.error("Valorant API Error:", apiError);
        }
      }
    } catch (e) {
      console.error(e);
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
      dbStats={dbStats}
      matches={matches}
      isPublic={false}
    />
  );
}
