"use client";
import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { User, Mail, Shield, ShieldAlert, BadgeCheck } from "lucide-react";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = "users";

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadUsers() {
            try {
                const data = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID);
                setUsers(data.documents);
            } catch (error) {
                console.error("Failed to load users", error);
            } finally {
                setLoading(false);
            }
        }
        loadUsers();
    }, []);

    return (
        <div className="space-y-8">
             <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">User Management</h1>
                <p className="text-slate-400 mt-1">View and manage all registered accounts</p>
            </div>

            <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/50 border-b border-white/5 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Valorant Account</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="4" className="px-6 py-4">
                                            <div className="h-8 bg-white/5 rounded w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500 font-medium">
                                        No users registered yet.
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => {
                                    const isAdmin = u.email === 'adityafulzele1122@gmail.com';
                                    return (
                                        <tr key={u.$id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 border border-white/5">
                                                        <User className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white flex items-center gap-2">
                                                            {u.name || "Unknown User"}
                                                            {isAdmin && <Shield className="h-3 w-3 text-rose-500" title="Admin" />}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                            <Mail className="h-3 w-3" />
                                                            {u.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {u.ingameName ? (
                                                    <div className="flex items-center gap-2">
                                                        <BadgeCheck className="h-4 w-4 text-rose-500" />
                                                        <div>
                                                            <p className="text-sm font-bold text-white tracking-wide">{u.ingameName} <span className="text-slate-500">#{u.tag}</span></p>
                                                            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">{u.puuid?.substring(0, 8)}...</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-600 italic">No account linked</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500`}>
                                                    Active
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {new Date(u.$createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
