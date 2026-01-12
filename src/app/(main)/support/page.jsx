"use client";
import { useState, useEffect } from "react";
import { Mail, MessageSquare, HelpCircle, FileText, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SupportPage() {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
        setFormData(prev => ({
            ...prev,
            name: user.name || "",
            email: user.email || ""
        }));
    }
  }, [user]);

  // Import appwrite locally to avoid top-level SSR issues if any
  // But usually we import at top. Let's assume standard import at top.
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        const { databases } = await import("@/lib/appwrite");
        const { ID } = await import("appwrite");
        
        await databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            process.env.NEXT_PUBLIC_APPWRITE_SUPPORT_TICKETS_COLLECTION_ID, // Collection ID
            ID.unique(),
            {
                name: formData.name,
                email: formData.email,
                subject: formData.subject,
                message: formData.message,
                status: "open",
                createdAt: new Date().toISOString()
            }
        );

        setSuccess(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
        setTimeout(() => setSuccess(false), 5000); // Hide success msg after 5s

    } catch (error) {
        console.error("Failed to submit ticket", error);
        alert("Something went wrong. Please try again or email us directly.");
    } finally {
        setLoading(false);
    }
  };

  const faqs = [
    {
      question: "How do I join a tournament?",
      answer: "Create an account, navigate to the 'Tournaments' page, select an active tournament, and click 'Register'. Make sure your team roster is complete if required."
    },
    {
      question: "When are prizes distributed?",
      answer: "Prizes are usually processed within 24-48 hours after the tournament concludes. Winners will be contacted via email or Discord."
    },
    {
      question: "I encountered a bug/issue. What should I do?",
      answer: "Please assume the issue is on your end first! If it persists, join our Discord and open a ticket in the #support channel, or use the contact form on this page."
    },

  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <div className="relative bg-slate-900 py-20 px-6 text-center border-b border-white/5">
        <h1 className="font-anton text-5xl md:text-7xl uppercase text-white mb-6">
          Support <span className="text-rose-500">Center</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Need help? We're here for you. Find answers to common questions or get in touch with our team directly.
        </p>
      </div>

      <div className="container mx-auto px-6 py-16">
        
        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-slate-900/50 p-8 rounded-xl border border-white/5 hover:border-rose-500/50 transition-all group">
            <div className="bg-slate-800 w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:bg-rose-500 transition-colors">
              <Mail className="text-white" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Email Support</h3>
            <p className="text-slate-400 mb-4">For general inquiries and account issues.</p>
            <a href="mailto:aditya210399@gmail.com" className="text-rose-400 font-medium hover:text-rose-300">aditya210399@gmail.com</a>
          </div>

          <div className="bg-slate-900/50 p-8 rounded-xl border border-white/5 hover:border-rose-500/50 transition-all group">
            <div className="bg-slate-800 w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:bg-rose-500 transition-colors">
              <MessageSquare className="text-white" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Discord Community</h3>
            <p className="text-slate-400 mb-4">Get real-time help from mods and the community.</p>
            <a href="https://discord.gg/vrivals" target="_blank" rel="noopener noreferrer" className="text-rose-400 font-medium hover:text-rose-300">Join Discord Server</a>
          </div>

          <div className="bg-slate-900/50 p-8 rounded-xl border border-white/5 hover:border-rose-500/50 transition-all group">
            <div className="bg-slate-800 w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:bg-rose-500 transition-colors">
              <FileText className="text-white" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Documentation</h3>
            <p className="text-slate-400 mb-4">Read our rules, terms, and guides.</p>
            <a href="/rules" className="text-rose-400 font-medium hover:text-rose-300">View Rules & FAQ</a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div>
            <h2 className="font-anton text-3xl text-white mb-8 border-l-4 border-rose-500 pl-4">Send us a Message</h2>
            
            {success && (
                <div className="mb-6 bg-emerald-500/10 border border-emerald-500/50 p-4 rounded-lg flex items-center gap-3 text-emerald-400">
                    <div className="bg-emerald-500 rounded-full p-1"><Send size={12} className="text-slate-950" /></div>
                    <p className="font-bold text-sm">Message received! We'll get back to you shortly.</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ... fields ... */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                  <input 
                    type="email" 
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Subject</label>
                 <select 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  >
                    <option value="" disabled>Select a topic</option>
                    <option value="General">General Inquiry</option>
                    <option value="Technical">Technical Issue</option>
                    <option value="Billing">Billing / Payments</option>
                    <option value="Report">Report a Player</option>
                  </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Message</label>
                <textarea 
                  required
                  rows={5}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors resize-none"
                  placeholder="How can we help you?"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-4 px-8 rounded-lg flex items-center gap-2 transition-all hover:translate-x-1"
              >
                {loading ? "Sending..." : "Send Message"} <Send size={18} />
              </button>
            </form>
          </div>

          {/* FAQ Accordion */}
          <div>
            <h2 className="font-anton text-3xl text-white mb-8 border-l-4 border-rose-500 pl-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
                  <details className="group">
                    <summary className="flex justify-between items-center cursor-pointer p-6 font-medium text-white hover:text-rose-400 transition-colors">
                      {faq.question}
                      <span className="transform group-open:rotate-180 transition-transform">
                        <HelpCircle size={20} />
                      </span>
                    </summary>
                    <div className="px-6 pb-6 text-slate-400 leading-relaxed border-t border-slate-800/50 pt-4">
                      {faq.answer}
                    </div>
                  </details>
                </div>
              ))}
            </div>
            
            <div className="mt-10 p-6 bg-gradient-to-r from-rose-900/20 to-slate-900 rounded-xl border border-rose-500/20">
              <h4 className="text-white font-bold mb-2">Still have questions?</h4>
              <p className="text-sm text-slate-400 mb-4">Our support team is available 24/7 to assist you with any inquiries.</p>
              <a href="mailto:aditya210399@gmail.com" className="text-rose-400 text-sm font-bold hover:underline">Contact Support &rarr;</a>
            </div>
          </div>
        </div>
        {/* Business Details - Required for Payment Gateways */}
        <div className="mt-20 border-t border-slate-800 pt-10 text-center">
          <h3 className="text-white font-bold mb-6 uppercase tracking-wide text-sm">Official Business Details</h3>
          <div className="flex flex-col md:flex-row justify-center gap-10 text-slate-400 text-sm">
            <div>
              <p className="font-bold text-slate-300 mb-1">Contact Details:</p>
              <p>Email: aditya210399@gmail.com</p>
              <p>Phone: +91 90284 10543</p>
            </div>
          </div>
          <p className="mt-6 text-xs text-slate-500 max-w-2xl mx-auto">
            Note: For payment related disputes, please contact us within 24 hours of the transaction.
            Refunds are processed according to our <a href="/refund-policy" className="text-rose-500 hover:underline">Refund Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
