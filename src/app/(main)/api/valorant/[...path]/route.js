import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const path = (await params).path.join("/");
  const apiKey = process.env.VALORANT_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ message: "API Key not configured on server" }, { status: 500 });
  }

  const url = `https://api.henrikdev.xyz/valorant/${path}${searchParams.toString() ? "?" + searchParams.toString() : ""}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Authorization": apiKey,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch from Valorant API" }, { status: 500 });
  }
}
