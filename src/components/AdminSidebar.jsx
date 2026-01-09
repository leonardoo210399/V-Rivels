"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
    LayoutDashboard, 
    Trophy, 
    Users, 
    Swords, 
    LogOut,
    Settings,
    MessageSquare
} from "lucide-react";

export default function AdminSidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const links = [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Tournaments", href: "/admin/tournaments", icon: Trophy },
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Support", href: "/admin/support", icon: MessageSquare },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-white/10 flex flex-col">
            {/* Logo Area */}
            <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-rose-600 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-white">V</span>
                    </div>
                    <span className="font-anton text-xl text-white tracking-wide">ADMIN</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    
                    return (
                        <Link 
                            key={link.href} 
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                isActive 
                                ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20" 
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="font-medium text-sm">{link.name}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-950/30">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                        {user?.name?.charAt(0) || "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                </div>
                
                <button 
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
