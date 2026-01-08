"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MatchesRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.push("/admin/tournaments");
    }, [router]);

    return null;
}
