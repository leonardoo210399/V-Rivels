import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const path = (await params).path.join("/");

  // Support multiple keys comma-separated, or fallback to single key
  const apiKeysString = process.env.VALORANT_API_KEYS || process.env.VALORANT_API_KEY;
  const apiKeys = apiKeysString 
    ? apiKeysString.split(",").map((key) => key.trim()).filter((key) => key.length > 0) 
    : [];

  if (apiKeys.length === 0) {
    return NextResponse.json({ message: "API Key not configured on server" }, { status: 500 });
  }

  const url = `https://api.henrikdev.xyz/valorant/${path}${searchParams.toString() ? "?" + searchParams.toString() : ""}`;

  let lastResponse;
  let lastError;

  for (const apiKey of apiKeys) {
    try {
      const response = await fetch(url, {
        headers: {
          "Authorization": apiKey,
        },
      });

      // If rate limited, capture response and try next key
      if (response.status === 429) {
        console.warn(`API Key ending in ...${apiKey.slice(-4)} hit rate limit.`);
        lastResponse = response;
        continue;
      }

      // If successful or other error (404, 403, etc), return immediately
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });

    } catch (error) {
      console.error("Error fetching from Valorant API:", error);
      lastError = error;
      // If network error, maybe try next key? 
      // Usually network errors are not key-specific, but let's be safe and try next if possible,
      // though typically we'd just want to fail specific to rate limits.
      // For now, let's treat fetch errors as "try next" just in case it's a transient connection issue specific to that request? 
      // logical fallback is good.
      continue;
    }
  }

  // If we exhaust all keys
  if (lastResponse) {
    // If we had a 429, return the last 429
    // Try to parse body if possible, otherwise generic
    try {
      const data = await lastResponse.json();
      return NextResponse.json(data, { status: 429 });
    } catch {
       return NextResponse.json({ message: "Rate limit exceeded on all keys" }, { status: 429 });
    }
  }

  // If we had only network errors
  return NextResponse.json({ message: "Failed to fetch from Valorant API" }, { status: 500 });
}
