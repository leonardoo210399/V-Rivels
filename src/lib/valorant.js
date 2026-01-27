const HENRIK_API_BASE = "/api/valorant";

export async function getAccount(name, tag) {
  const response = await fetch(`${HENRIK_API_BASE}/v2/account/${name}/${tag}`);
  if (!response.ok) {
     // Handle non-200 errors (e.g. user not found)
     const error = await response.json();
     throw new Error(error.message || "Failed to fetch account");
  }
  return response.json();
}

export async function getAccountByPuuid(puuid) {
    const response = await fetch(`${HENRIK_API_BASE}/v2/by-puuid/account/${puuid}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch account by PUUID");
    }
    return response.json();
}

export async function getMMR(puuid, region = "ap") {
  const response = await fetch(`${HENRIK_API_BASE}/v2/by-puuid/mmr/${region}/${puuid}`);
  if (!response.ok) {
     throw new Error("Failed to fetch MMR");
  }
  return response.json();
}

export async function getMMRByName(region, name, tag) {
  const response = await fetch(`${HENRIK_API_BASE}/v2/mmr/${region}/${name}/${tag}`);
  if (!response.ok) {
    throw new Error("Failed to fetch MMR by name");
  }
  return response.json();
}

export async function getMatches(puuid, region = "ap", size = 15, mode = "") {
  let url = `${HENRIK_API_BASE}/v3/by-puuid/matches/${region}/${puuid}?size=${size}`;
  if (mode) url += `&mode=${mode}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch matches");
  }
  return response.json();
}

export async function getMatch(matchId) {
    const response = await fetch(`${HENRIK_API_BASE}/v2/match/${matchId}`);
    if (!response.ok) {
        throw new Error("Failed to fetch match details");
    }
    return response.json();
}

export async function getPlayerCard(cardUuid) {
    if (!cardUuid) return null;
    const response = await fetch(`https://valorant-api.com/v1/playercards/${cardUuid}`);
    if (!response.ok) {
        throw new Error("Failed to fetch player card from Valorant-API");
    }
    return response.json();
}

export async function getAgents() {
    const response = await fetch("https://valorant-api.com/v1/agents?isPlayableCharacter=true");
    if (!response.ok) {
        throw new Error("Failed to fetch agents");
    }
    return response.json();
}
