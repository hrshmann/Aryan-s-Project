/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Heart, 
  Phone, 
  Send, 
  Star, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  Shield,
  Clock
} from "lucide-react";
import { Feedback, EmergencyContact } from "../types";

export default function Footer() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [errorStatus, setErrorStatus] = useState("");
  const [successStatus, setSuccessStatus] = useState("");
  const [recentFeedbacks, setRecentFeedbacks] = useState<Feedback[]>([]);
  const [helplines, setHelplines] = useState<EmergencyContact[]>([
    {
      name: "Tele-MANAS Mental Health Support",
      phone: "14416 or 1-800-891-4416",
      description: "Government of India mental health support line across states and union territories.",
      region: "India"
    },
    {
      name: "KIRAN Mental Health Rehabilitation Helpline",
      phone: "1800-599-0019",
      description: "National mental health rehabilitation helpline for emotional support and guidance.",
      region: "India"
    },
    {
      name: "National Emergency Response",
      phone: "112",
      description: "All-in-one emergency response number for immediate safety support.",
      region: "India"
    }
  ]);

  // Fetch recent feedback the public has supplied to populate 'Reports'
  const loadFeedbackReports = () => {
    fetch("/api/feedback")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRecentFeedbacks(data.slice(-3).reverse()); // Take latest 3 logs
        }
      })
      .catch((err) => console.log("Feedback reading error: ", err));
  };

  useEffect(() => {
    loadFeedbackReports();
    // Also fetch initialized emergency contacts from server seed
    fetch("/api/init")
      .then((res) => res.json())
      .then((data) => {
        if (data.emergencyContacts) {
          setHelplines(data.emergencyContacts);
        }
      })
      .catch((err) => console.log("Helper init failure: ", err));
  }, []);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus("");
    setSuccessStatus("");

    if (!name || !message) {
      setErrorStatus("Name and message fields are required.");
      return;
    }

    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message, rating })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Server rejected request");
        return res.json();
      })
      .then((data) => {
        setSuccessStatus(data.message || "Feedback logged! Thank you for raising your voice.");
        setName("");
        setEmail("");
        setMessage("");
        setRating(5);
        loadFeedbackReports(); // reload reviews list
      })
      .catch((err) => {
        setErrorStatus("Failed to record feedback. Please try again.");
      });
  };

  return (
    <footer className="w-full bg-[#F4F1EA] dark:bg-[#1C221F] border-t border-[#E8E4D9] dark:border-[#344E41] pt-16 pb-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* --- DEDICATED CRISIS SUPPORT CENTER (Emergency Section) --- */}
        <div id="emergency" className="mb-14 p-6 sm:p-8 rounded-[32px] bg-rose-500/5 dark:bg-rose-950/10 border border-rose-250/50 dark:border-rose-900/40 shadow-inner">
          <div className="flex flex-col lg:flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-rose-200/50 dark:border-rose-900/40">
            <div>
              <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-450 mb-1">
                <AlertCircle className="h-5 w-5 animate-pulse" />
                <h4 className="font-serif font-bold text-lg tracking-tight">Need Urgent Assistance? Crisis Support is 24/7</h4>
              </div>
              <p className="text-sm text-[#6B705C] dark:text-[#A3B18A] max-w-2xl font-sans">
                If you are facing thoughts of self-harm, severe emotional trauma, domestic safety concerns, or an emergency active crisis, please contact these instant lifelines. Professional counselors maintain full confidentiality.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <a 
                href="tel:14416" 
                className="inline-flex items-center space-x-2 px-5 py-3 bg-red-700 hover:bg-red-800 text-white font-sans font-bold text-sm rounded-xl shadow-lg shadow-red-500/20 transition-transform active:scale-95 duration-200"
              >
                <Phone className="h-4 w-4 animate-bounce" />
                <span>Call Tele-MANAS 14416</span>
              </a>
              <a 
                href="tel:112" 
                className="inline-flex items-center space-x-2 px-5 py-3 bg-[#344E41] hover:bg-[#2A3F34] text-white font-sans font-semibold text-sm rounded-xl shift-y transition-colors duration-200"
              >
                <span>Emergency 112</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
            {helplines.map((contact, index) => (
              <div 
                key={index} 
                className="p-4 rounded-2xl bg-white/90 dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#35483B] shadow-sm flex flex-col justify-between"
                id={`danger-card-${index}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-[#E9EDC9] text-[#588157]">
                      {contact.region}
                    </span>
                    <Clock className="h-3.5 w-3.5 text-[#6B705C]/60" />
                  </div>
                  <h5 className="font-serif font-bold text-sm text-[#344E41] dark:text-[#E9EDC9] mb-1">{contact.name}</h5>
                  <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] mb-3 font-sans">{contact.description}</p>
                </div>
                <div className="flex items-center space-x-1 text-xs font-semibold text-rose-700 dark:text-rose-400 font-mono">
                  <Phone className="h-3.5 w-3.5 animate-pulse" />
                  <span>{contact.phone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- MAIN MATRIX --- */}
        <div id="footer-main-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-12 border-b border-[#E8E4D9] dark:border-[#344E41]">
          
          {/* Brand Col */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="font-serif font-bold text-2xl tracking-tight text-[#344E41] dark:text-[#E9EDC9]">
                Mental Health Care
              </span>
            </div>
            <p className="text-sm text-[#6B705C] dark:text-[#A3B18A] leading-relaxed font-sans">
              Mental Health Care is a compassionate, AI-enabled emotional wellness and clinical scheduling directory that places mental health tools, stress reduction trackers, and direct patient-doctor therapy channels into an integrated, human-first web guide.
            </p>
            <div className="flex items-center space-x-2 text-xs text-[#6B705C] dark:text-[#A3B18A] font-sans">
              <Shield className="h-4 w-4 text-[#588157]" />
              <span>DPDP-aware · Encrypted Session Logs · Protected Data</span>
            </div>
          </div>

          {/* Feedback Submission (REST-enabled Client implementation) */}
          <div id="footer-feedback" className="lg:col-span-5 p-6 rounded-[32px] bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] flex flex-col justify-between">
            <form onSubmit={handleFeedbackSubmit} className="space-y-3">
              <div>
                <h4 className="font-serif font-bold text-sm text-[#344E41] dark:text-[#E9EDC9] flex items-center space-x-1.5 mb-1 animate-pulse">
                  <span>Share Your Experience</span>
                </h4>
                <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] font-sans">
                  Submit ratings and feedback reports directly to our clinical admin teams.
                </p>
              </div>

              {successStatus && (
                <div className="p-3 rounded-xl bg-[#E9EDC9]/65 dark:bg-[#344E41]/20 text-[#344E41] dark:text-[#E9EDC9] border border-[#A3B18A]/30 flex items-center space-x-2 text-xs font-sans">
                  <CheckCircle className="h-4 w-4 shrink-0 text-[#588157]" />
                  <span>{successStatus}</span>
                </div>
              )}

              {errorStatus && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 flex items-center space-x-2 text-xs font-sans">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorStatus}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#F4F1EA] dark:bg-[#1E2421] border border-[#E8E4D9] dark:border-[#344E41] rounded-lg text-[#2D3436] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#588157]"
                />
                <input
                  type="email"
                  placeholder="Your Email (Optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#F4F1EA] dark:bg-[#1E2421] border border-[#E8E4D9] dark:border-[#344E41] rounded-lg text-[#2D3436] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#588157]"
                />
              </div>

              <textarea
                placeholder="What did you think of the self-care tools?"
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#F4F1EA] dark:bg-[#1E2421] border border-[#E8E4D9] dark:border-[#344E41] rounded-lg text-[#2D3436] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#588157] resize-none"
              ></textarea>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1" id="star-rating-selector">
                  <span className="text-[10px] text-[#6B705C] mr-1 font-sans">Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star 
                        className={`h-4 w-4 ${
                          rating >= star ? "fill-amber-400 text-amber-400" : "text-slate-350"
                        }`} 
                      />
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1 bg-[#344E41] hover:bg-[#2A3F34] text-white font-semibold font-sans px-3.5 py-1.5 text-xs rounded-lg shadow-sm hover:shadow active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <Send className="h-3 w-3" />
                  <span>Submit Post</span>
                </button>
              </div>
            </form>
          </div>

          {/* User Feedback Reports (Latest Submissions View) */}
          <div id="footer-reports" className="lg:col-span-3 space-y-4">
            <div>
              <h4 className="font-serif font-bold text-sm text-[#344E41] dark:text-[#E9EDC9]">Patient Community Reports</h4>
              <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] font-sans">Live feed of honest feedback submitted online.</p>
            </div>
            
            <div className="space-y-2.5">
              {recentFeedbacks.length === 0 ? (
                <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] font-sans italic">Be the first to leave a feedback above!</p>
              ) : (
                recentFeedbacks.map((item, index) => (
                  <div 
                    key={index} 
                    className="p-3 rounded-xl bg-[#FDFBF7] dark:bg-[#1E2421] border border-[#E8E4D9] dark:border-[#344E41] space-y-1.5"
                    id={`feedback-report-node-${index}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-serif text-[#344E41] dark:text-[#E9EDC9] limit-name">{item.name}</span>
                      <div className="flex items-center text-amber-400">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-[10px] font-mono ml-0.5 font-bold">{item.rating}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#6B705C] dark:text-[#A3B18A] italic line-clamp-2">
                      "{item.message}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer Meta */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 text-xs text-[#6B705C] dark:text-[#A3B18A] font-sans">
          <div>
            <span>© Aryan kumar. All Rights Reserved.</span>
          </div>
          <div className="flex items-center space-x-1.5 text-[#6B705C] dark:text-[#A3B18A]">
            <Heart className="h-3.5 w-3.5 text-rose-600 fill-rose-600 animate-bounce" />
            <span>Built lovingly with clinical research.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
