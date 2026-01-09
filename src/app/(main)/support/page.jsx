"use client";
import { useState } from "react";
import { Mail, MessageSquare, HelpCircle, FileText, Send } from "lucide-react";

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you would send this to your backend
    alert("Support request sent! We will get back to you shortly.");
    setFormData({ name: "", email: "", subject: "", message: "" });
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
    {
      question: "How can I withdraw my winnings?",
      answer: "Go to your Profile and select 'Withdraw'. We currently support bank transfers and UPI. Minimum withdrawal amount applies."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <div className="relative bg-slate-900 py-20 px-6 text-center border-b border-white/5">
        <h1 className="font-anton text-5xl md:text-7xl uppercase text-white mb-6">
          Support <span className="text-teal-500">Center</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Need help? We're here for you. Find answers to common questions or get in touch with our team directly.
        </p>
      </div>

      <div className="container mx-auto px-6 py-16">
        
        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-slate-900/50 p-8 rounded-xl border border-white/5 hover:border-teal-500/50 transition-all group">
            <div className="bg-slate-800 w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:bg-teal-500 transition-colors">
              <Mail className="text-white" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Email Support</h3>
            <p className="text-slate-400 mb-4">For general inquiries and account issues.</p>
            <a href="mailto:support@valolant.com" className="text-teal-400 font-medium hover:text-teal-300">support@valolant.com</a>
          </div>

          <div className="bg-slate-900/50 p-8 rounded-xl border border-white/5 hover:border-teal-500/50 transition-all group">
            <div className="bg-slate-800 w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:bg-teal-500 transition-colors">
              <MessageSquare className="text-white" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Discord Community</h3>
            <p className="text-slate-400 mb-4">Get real-time help from mods and the community.</p>
            <a href="https://discord.gg/valolant" target="_blank" rel="noopener noreferrer" className="text-teal-400 font-medium hover:text-teal-300">Join Discord Server</a>
          </div>

          <div className="bg-slate-900/50 p-8 rounded-xl border border-white/5 hover:border-teal-500/50 transition-all group">
            <div className="bg-slate-800 w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:bg-teal-500 transition-colors">
              <FileText className="text-white" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Documentation</h3>
            <p className="text-slate-400 mb-4">Read our rules, terms, and guides.</p>
            <a href="/rules" className="text-teal-400 font-medium hover:text-teal-300">View Rules & FAQ</a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div>
            <h2 className="font-anton text-3xl text-white mb-8 border-l-4 border-teal-500 pl-4">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
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
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Subject</label>
                 <select 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors resize-none"
                  placeholder="How can we help you?"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                ></textarea>
              </div>

              <button type="submit" className="bg-teal-500 hover:bg-teal-600 text-slate-900 font-bold py-4 px-8 rounded-lg flex items-center gap-2 transition-all hover:translate-x-1">
                Send Message <Send size={18} />
              </button>
            </form>
          </div>

          {/* FAQ Accordion */}
          <div>
            <h2 className="font-anton text-3xl text-white mb-8 border-l-4 border-teal-500 pl-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
                  <details className="group">
                    <summary className="flex justify-between items-center cursor-pointer p-6 font-medium text-white hover:text-teal-400 transition-colors">
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
            
            <div className="mt-10 p-6 bg-gradient-to-r from-teal-900/20 to-slate-900 rounded-xl border border-teal-500/20">
              <h4 className="text-white font-bold mb-2">Still have questions?</h4>
              <p className="text-sm text-slate-400 mb-4">Our support team is available 24/7 to assist you with any inquiries.</p>
              <a href="mailto:support@valolant.com" className="text-teal-400 text-sm font-bold hover:underline">Contact Support &rarr;</a>
            </div>
          </div>
        </div>
        {/* Business Details - Required for Payment Gateways */}
        <div className="mt-20 border-t border-slate-800 pt-10 text-center">
          <h3 className="text-white font-bold mb-6 uppercase tracking-wide text-sm">Official Business Details</h3>
          <div className="flex flex-col md:flex-row justify-center gap-10 text-slate-400 text-sm">
            <div>
              <p className="font-bold text-slate-300 mb-1">Registered Office:</p>
              <p>123 Gaming Street, Tech Park</p>
              <p>Mumbai, Maharashtra, 400001</p>
              <p>India</p>
            </div>
            <div>
              <p className="font-bold text-slate-300 mb-1">Contact Details:</p>
              <p>Email: business@valolant.com</p>
              <p>Phone: +91 98765 43210 (Mon-Fri, 9AM-6PM)</p>
            </div>
          </div>
          <p className="mt-6 text-xs text-slate-500 max-w-2xl mx-auto">
            Note: For payment related disputes, please contact us within 24 hours of the transaction.
            Refunds are processed according to our <a href="/refund-policy" className="text-teal-500 hover:underline">Refund Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
