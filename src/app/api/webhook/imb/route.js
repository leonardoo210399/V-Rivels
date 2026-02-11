import { NextResponse } from "next/server";

// Webhook deactivated in favor of check-status API polling
export async function POST() {
    return NextResponse.json({ message: "Webhook deactivated. Use check-status API." });
}
