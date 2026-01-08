"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "@/components/AdminSidebar";
import Loader from "@/components/Loader";

export default function AdminLayout({ children }) {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (!isAdmin) {
                router.push("/");
            }
        }
    }, [user, loading, isAdmin, router]);

    if (loading) {
        return <Loader />;
    }

    if (!user || !isAdmin) return null;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <AdminSidebar />
            <main className="pl-64">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
