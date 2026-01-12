"use client";
import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import Loader from "@/components/Loader";
import { Mail, Clock, CheckCircle, AlertCircle, Trash2 } from "lucide-react";

export default function SupportTicketsPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_SUPPORT_TICKETS_COLLECTION_ID;

    useEffect(() => {
        loadTickets();
    }, []);

    async function loadTickets() {
        try {
            const data = await databases.listDocuments(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                COLLECTION_ID,
                [Query.orderDesc("createdAt")]
            );
            setTickets(data.documents);
        } catch (error) {
            console.error("Failed to load tickets", error);
            // If collection doesn't exist yet, it will error here. 
            // We'll handle visual feedback in the UI for empty state or error.
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (id) => {
        if(!confirm("Are you sure you want to delete this ticket?")) return;
        try {
            await databases.deleteDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                COLLECTION_ID,
                id
            );
            setTickets(tickets.filter(t => t.$id !== id));
        } catch (error) {
            alert("Failed to delete ticket");
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-anton text-white uppercase tracking-wide">Support Tickets</h1>
                <p className="text-slate-400">View and respond to user inquiries.</p>
            </header>

            <div className="space-y-4">
                {tickets.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-white/5">
                        <Mail className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                        <h3 className="text-xl text-slate-400">No tickets found</h3>
                        <p className="text-slate-500 text-sm mt-2">Maybe you haven't created the 'support_tickets' collection yet?</p>
                    </div>
                ) : (
                    tickets.map((ticket) => (
                        <div key={ticket.$id} className="bg-slate-900 border border-white/5 rounded-xl p-6 hover:border-white/10 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-bold text-white">{ticket.subject}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                            ticket.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                                        }`}>
                                            {ticket.status || 'OPEN'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 flex items-center gap-2">
                                        <span className="text-slate-300 font-medium">{ticket.name}</span>
                                        &bull;
                                        <span className="font-mono text-slate-500">{ticket.email}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a 
                                        href={`mailto:${ticket.email}?subject=Re: ${ticket.subject}`}
                                        className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
                                    >
                                        <Mail size={14} /> Reply
                                    </a>
                                    <button 
                                        onClick={() => handleDelete(ticket.$id)}
                                        className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                                        title="Delete Ticket"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="bg-slate-950/50 p-4 rounded-lg text-slate-300 text-sm leading-relaxed border border-white/5">
                                {ticket.message}
                            </div>

                            <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Clock size={12} /> {new Date(ticket.createdAt || ticket.$createdAt).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
