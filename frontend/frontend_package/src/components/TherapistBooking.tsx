/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  IndianRupee, 
  Briefcase, 
  Star, 
  Tag, 
  Sparkles, 
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Award,
  Video,
  VideoOff,
  VolumeX,
  MicOff,
  X
} from "lucide-react";
import { Therapist, User, Appointment } from "../types";
import { formatINR, formatIndiaDate } from "../utils/indiaLocale";
import { namedImageDataUri } from "../utils/namedImage";

interface TherapistBookingProps {
  user: User | null;
  token: string | null;
  onRefreshUser: (updatedUser: any) => void;
  onNavigateToMood: () => void;
}

export default function TherapistBooking({
  user,
  token,
  onRefreshUser,
  onNavigateToMood
}: TherapistBookingProps) {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("All");

  // Booking states
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");

  // Automated video consultation and therapist rating simulator states
  const [activeCallAppointment, setActiveCallAppointment] = useState<Appointment | null>(null);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [isCastingScreen, setIsCastingScreen] = useState(false);

  // Ratings trackers
  const [ratingInput, setRatingInput] = useState<{[apptId: string]: number}>({});
  const [reviewInput, setReviewInput] = useState<{[apptId: string]: string}>({});
  const [submittedReviews, setSubmittedReviews] = useState<{[apptId: string]: { rating: number; review: string } }>({});

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCallAppointment) {
      interval = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => clearInterval(interval);
  }, [activeCallAppointment]);
  
  // Status states
  const [errorStatus, setErrorStatus] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch therapists and user scheduled appointments
  const loadDirectoryAndAppointments = () => {
    // 1. Fetch therapists list
    fetch("/api/therapists")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Display approved therapists by default; display pending registration profiles too but with notes
          setTherapists(data);
        }
      })
      .catch((err) => console.log("Failed loading therapists directory: ", err));

    // 2. Fetch user appointments
    if (token) {
      fetch("/api/appointments", {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setAppointments(data);
          }
        })
        .catch((err) => console.log("Failed loading appointments ledger: ", err));
    }
  };

  useEffect(() => {
    loadDirectoryAndAppointments();
  }, [token]);

  // Handle Search & Filter locally
  const filteredTherapists = therapists.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.bio.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Admin user gets to see unapproved/pending therapists; standard users see only approved practitioners
    const isAdmin = user && user.role === "Admin";
    const statusApproved = t.approved || isAdmin;

    if (!statusApproved) return false;

    if (filterSpecialty === "All") return matchesSearch;
    return matchesSearch && t.specialty.includes(filterSpecialty);
  });

  const specialties = ["All", "Cognitive Behavioral Therapy (CBT)", "Mindfulness-Based Stress Reduction (MBSR)", "Family & Relationship Systems", "Neuropsychiatry"];

  const handleStartBooking = (therapist: Therapist) => {
    setErrorStatus("");
    setSuccessMessage("");
    setBookingNotes("");
    
    if (!token) {
      setErrorStatus("Please register or log in/join Mental Health Care to schedule sessions with clinical doctors.");
      setTimeout(() => {
        document.getElementById("booking-error-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }
    
    setSelectedTherapist(therapist);
    setBookingDate("");
    setBookingTime(therapist.availability[0] || "Mon 10:00 AM IST");
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus("");
    setSuccessMessage("");

    if (!selectedTherapist) return;
    if (!bookingDate) {
      setErrorStatus("Please select an appointment calendar date.");
      return;
    }

    setIsLoading(true);

    fetch("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        therapistId: selectedTherapist.id,
        therapistName: selectedTherapist.name,
        date: bookingDate,
        time: bookingTime,
        notes: bookingNotes
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Scheduling rejected by server.");
        return res.json();
      })
      .then((data) => {
        setSuccessMessage(data.message || "Consultation requested! Our specialists will review schedule grids.");
        setSelectedTherapist(null);
        loadDirectoryAndAppointments(); // reload scheduling ledger

        // Re-sync XP levels
        fetch("/api/auth/me", {
          headers: { "Authorization": `Bearer ${token}` }
        })
          .then((r) => r.json())
          .then((u) => {
            if (u.id) {
              onRefreshUser(u);
            }
          });
      })
      .catch((err) => {
        setErrorStatus("Form error scheduling entry. Ensure connection holds.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-16">
      
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="inline-block px-3 py-1 bg-[#E9EDC9] dark:bg-[#344E41]/30 border border-[#A3B18A]/30 text-[#344E41] dark:text-[#E9EDC9] text-xs font-bold tracking-wider rounded-lg">
          SUPPORT NETWORK
        </div>
        <h1 className="font-serif font-light text-3xl sm:text-4xl text-[#344E41] dark:text-[#E9EDC9] tracking-tight">
          Licensed Mental Health Practitioners Directory
        </h1>
        <p className="text-sm text-[#6B705C] dark:text-[#A3B18A] max-w-2xl mx-auto font-sans">
          Explore approved Indian therapists, psychotherapists, MBSR practitioners, and neuropsychiatrists. Book a secure counselling session in IST.
        </p>
      </div>

      {errorStatus && !selectedTherapist && (
        <div 
          id="booking-error-panel"
          className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 text-xs font-medium text-center max-w-2xl mx-auto flex items-center justify-center space-x-2 scroll-mt-24"
        >
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorStatus}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 text-xs font-semibold text-center max-w-2xl mx-auto flex items-center justify-center space-x-2">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Primary Directory layout */}
      <div className="space-y-6">
        
        {/* Search controls */}
        <div className="p-4 rounded-3xl bg-[#FDFBF7] dark:bg-[#1E2421] border border-[#E8E4D9] dark:border-[#344E41] flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B705C] dark:text-[#A3B18A]" />
            <input
              type="text"
              placeholder="Search by profile bio, specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] rounded-2xl text-xs sm:text-sm text-[#344E41] dark:text-[#E9EDC9] placeholder-[#6B705C]/60 focus:outline-none focus:ring-1 focus:ring-[#588157]"
            />
          </div>

          {/* Specialty filter buttons */}
          <div className="flex flex-wrap gap-2 items-center justify-end w-full overflow-x-auto select-none">
            <Filter className="h-4.5 w-4.5 text-[#6B705C] dark:text-[#A3B18A] mr-1 hidden sm:inline" />
            {specialties.map((spec) => (
              <button
                key={spec}
                onClick={() => setFilterSpecialty(spec)}
                className={`px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                  filterSpecialty === spec
                    ? "bg-[#588157] text-[#FDFBF7] font-serif font-semibold hover:shadow-sm" 
                    : "bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] text-[#6B705C] dark:text-[#A3B18A] hover:bg-[#F4F1EA]"
                }`}
              >
                {spec === "All" ? "All Specialties" : spec.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Directory Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTherapists.map((therapist) => (
            <div 
              key={therapist.id} 
              className="rounded-[32px] bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41]/70 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300 relative"
              id={`therapist-card-${therapist.id}`}
            >
              <div>
                {/* Visual Cover bar detailing ratings */}
                <div className="p-4 bg-gradient-to-r from-[#E9EDC9]/35 via-[#A3B18A]/10 to-[#588157]/10 border-b border-[#E8E4D9] dark:border-[#344E41]/35 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-[#DDB892] dark:text-[#E9EDC9]">
                    <Star className="h-4 w-4 fill-current animate-pulse text-[#DDB892]" />
                    <span className="font-mono text-xs font-bold">{therapist.rating} feedback score</span>
                  </div>
                  {!therapist.approved && (
                    <span className="text-[9px] uppercase tracking-wider font-mono font-bold bg-[#DDB892] text-[#7F5539] px-2 py-0.5 rounded-full">
                      Awaiting Review
                    </span>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  {/* Avatar + Basic Details inline */}
                  <div className="flex items-center space-x-4 text-left">
                    <img 
                      src={therapist.imgUrl || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2"} 
                      alt={therapist.name}
                      onError={(event) => {
                        event.currentTarget.src = namedImageDataUri(therapist.name, therapist.specialty, ["#344E41", "#588157", "#E9EDC9"]);
                      }}
                      className="h-16 w-16 rounded-2xl object-cover shrink-0 border border-[#E8E4D9] dark:border-[#344E41]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-0.5 text-left">
                      <h4 className="font-serif font-semibold text-base text-[#344E41] dark:text-[#E9EDC9]">{therapist.name}</h4>
                      <p className="text-xs text-[#588157] dark:text-[#A3B18A] font-semibold leading-relaxed">{therapist.specialty}</p>
                    </div>
                  </div>

                  {/* Badges block: experience and fee */}
                  <div className="grid grid-cols-2 gap-2 bg-[#F4F1EA] dark:bg-[#1E2421] p-3 rounded-2xl border border-[#E8E4D9] dark:border-[#344E41]">
                    <div className="flex items-center space-x-1.5 text-[11px] text-[#6B705C] dark:text-[#A3B18A]">
                      <Briefcase className="h-4 w-4 text-[#A3B18A]" />
                      <span>{therapist.experience} yrs expr</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-[11px] text-[#6B705C] dark:text-[#A3B18A]">
                      <IndianRupee className="h-4 w-4 text-[#588157]" />
                      <span>{formatINR(therapist.pricePerSession)} / session</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] leading-relaxed line-clamp-4 text-left font-sans">
                    {therapist.bio}
                  </p>

                  {/* Available schedules tag elements */}
                  <div className="space-y-1.5 text-left">
                    <span className="block text-[10px] font-mono uppercase text-[#A3B18A] font-bold">Upcoming Hours:</span>
                    <div className="flex flex-wrap gap-1">
                      {therapist.availability.map((time, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-0.5 rounded-lg bg-[#E9EDC9] text-[#344E41] dark:bg-[#344E41]/30 dark:text-[#E9EDC9] font-mono text-[9px] font-bold"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Booking trigger footer */}
              <div className="p-6 pt-0">
                <button
                  onClick={() => handleStartBooking(therapist)}
                  className="w-full py-3 bg-[#F4F1EA] hover:bg-[#588157] text-[#344E41] hover:text-[#FDFBF7] dark:bg-[#1E2421] dark:hover:bg-[#588157] dark:text-[#E9EDC9] font-serif font-semibold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  id={`confirm-booking-trigger-${therapist.id}`}
                >
                  <Calendar className="h-4 w-4" />
                  <span>Choose Schedule Slot</span>
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* --- INTRATIVE APPOINTMENT SCHEDULER MATRIX (Active consultations) --- */}
      {token && (
        <div id="patient-appointment-ledger" className="p-6 sm:p-8 rounded-[32px] bg-[#FDFBF7] dark:bg-[#1E2421] border border-[#E8E4D9] dark:border-[#344E41] space-y-6">
          <div>
            <h3 className="font-serif font-semibold text-base sm:text-lg text-[#344E41] dark:text-[#E9EDC9]">Your Scheduled Therapy Consultations</h3>
            <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] font-sans">Track dates, statuses, and clinical logs associated with active therapy slots.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.length === 0 ? (
              <p className="col-span-full py-8 text-center text-xs text-[#6B705C] italic font-sans">No scheduled appointments locked yet. Use catalog grids to book slots.</p>
            ) : (
              appointments.map((appt) => {
                const userReview = submittedReviews[appt.id];
                const activeRating = ratingInput[appt.id] || 5;
                const activeText = reviewInput[appt.id] || "";

                return (
                  <div 
                    key={appt.id} 
                    className="p-5 rounded-[22px] bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41]/75 shadow-sm relative text-left flex flex-col justify-between"
                    id={`patient-appt-${appt.id}`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-[9px] font-mono tracking-wider font-bold px-2 py-0.5 rounded-full ${
                          appt.status === "Confirmed" 
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : appt.status === "Completed"
                            ? "bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400"
                            : appt.status === "Cancelled"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20"
                            : "bg-[#F4F1EA] text-[#6B705C] dark:bg-[#1E2421]"
                        }`}>
                          ● {appt.status}
                        </span>
                        <Clock className="h-4.5 w-4.5 text-[#A3B18A]" />
                      </div>

                      <div className="space-y-1.5 text-left mb-3">
                        <h5 className="font-serif font-black text-sm text-[#344E41] dark:text-[#E9EDC9]">{appt.therapistName}</h5>
                        <div className="flex items-center space-x-1 text-xs text-[#6B705C] dark:text-[#A3B18A]">
                          <Calendar className="h-3.5 w-3.5 text-[#A3B18A] shrink-0" />
                          <span>{formatIndiaDate(appt.date)} · {appt.time}</span>
                        </div>
                      </div>

                      {appt.notes && (
                        <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] italic block border-t pt-2 border-[#E8E4D9]/60 dark:border-[#344E41]/50 mb-3">
                          Notes: "{appt.notes}"
                        </p>
                      )}
                    </div>

                    {/* Integrated Interactive elements based on Status */}
                    <div className="pt-3 border-t border-dashed border-[#E8E4D9] dark:border-[#344E41]/70 mt-2 space-y-2">
                      
                      {appt.status === "Confirmed" && (
                        <button
                          onClick={() => {
                            setActiveCallAppointment(appt);
                            setCallTimer(0);
                          }}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[11px] font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <Video className="h-3.5 w-3.5" />
                          <span>Launch Secure Video Session</span>
                        </button>
                      )}

                      {appt.status === "Completed" && (
                        <div className="text-xs space-y-2">
                          {userReview ? (
                            <div className="p-3 bg-indigo-50/50 dark:bg-[#1E2421] rounded-xl border border-indigo-200/50">
                              <div className="flex items-center space-x-1 mb-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-3 w-3 ${i < userReview.rating ? "fill-current text-indigo-550" : "text-slate-300"}`} 
                                  />
                                ))}
                                <span className="font-mono text-[9px] text-[#A3B18A] ml-1">Submitted Feedback</span>
                              </div>
                              <p className="text-[11px] text-[#6B705C] dark:text-[#A3B18A] leading-relaxed italic">
                                "{userReview.review}"
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2 text-left bg-[#F4F1EA]/50 dark:bg-[#1E2421]/40 p-3 rounded-xl border border-[#E8E4D9]/50">
                              <p className="font-serif text-[10px] uppercase font-bold text-[#344E41] dark:text-[#E9EDC9]">Log Quality Review</p>
                              
                              <div className="flex items-center space-x-1">
                                {Array.from({ length: 5 }).map((_, i) => {
                                  const starVal = i + 1;
                                  return (
                                    <button
                                      key={i}
                                      onClick={() => setRatingInput({ ...ratingInput, [appt.id]: starVal })}
                                      className="p-0.5 cursor-pointer"
                                    >
                                      <Star className={`h-4.5 w-4.5 ${starVal <= activeRating ? "fill-current text-orange-400" : "text-slate-300"}`} />
                                    </button>
                                  );
                                })}
                              </div>

                              <input
                                placeholder="Write service experience feedback..."
                                value={activeText}
                                onChange={(e) => setReviewInput({ ...reviewInput, [appt.id]: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-[#252C28] border border-slate-205 rounded-lg text-[11px]"
                              />

                              <button
                                onClick={() => {
                                  if (!activeText.trim()) return;
                                  setSubmittedReviews({
                                    ...submittedReviews,
                                    [appt.id]: { rating: activeRating, review: activeText }
                                  });
                                  
                                  // Call API logic for reward
                                  if (token) {
                                    fetch("/api/gamification/meditate", {
                                      method: "POST",
                                      headers: { "Authorization": `Bearer ${token}` }
                                    }).then(() => {
                                      fetch("/api/auth/me", { headers: { "Authorization": `Bearer ${token}` } })
                                        .then(r => r.json())
                                        .then(u => { if (u.id) onRefreshUser(u); });
                                    });
                                  }
                                  alert("Therapist rating published successfully! Thank you for active feedback (+15 XP Activity Reward added)!");
                                }}
                                className="w-full py-1.5 bg-[#344E41] text-white text-[10px] font-sans font-bold rounded-lg cursor-pointer hover:bg-[#2A3F34]"
                              >
                                Submit Rating & Claim Points
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* --- SCHEDULER BOOKING POPUP MODAL --- */}
      {selectedTherapist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="p-6 sm:p-8 rounded-[32px] bg-[#FDFBF7] dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] shadow-2xl max-w-md w-full relative">
            <button 
              onClick={() => setSelectedTherapist(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#F4F1EA] dark:hover:bg-[#1E2421] text-[#6B705C] hover:text-[#344E41] dark:hover:text-[#E9EDC9] transition-all focus:outline-none"
            >
              <XIcon className="h-4.5 w-4.5" />
            </button>

            <form onSubmit={handleSubmitBooking} className="space-y-5 text-left">
              
              <div className="space-y-0.5 text-left">
                <div className="inline-flex items-center space-x-1.5 bg-[#E9EDC9] dark:bg-[#344E41]/35 text-[#344E41] dark:text-[#E9EDC9] px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold">
                  <Award className="h-3 w-3" />
                  <span>Clinical Direct Scheduler</span>
                </div>
                <h3 className="font-serif font-semibold text-lg text-[#344E41] dark:text-[#E9EDC9]">Coordinate Consultations</h3>
                <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] font-sans">Locking schedule details with <b>{selectedTherapist.name}</b></p>
              </div>

              {errorStatus && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-[11px] text-rose-600 dark:text-rose-455 border border-rose-100 dark:border-rose-900/40 font-bold flex items-center space-x-2">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{errorStatus}</span>
                </div>
              )}

              {/* Calendar Date Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-mono text-[#6B705C] dark:text-[#A3B18A] font-bold">Pick Consultation Date:</label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F4F1EA] dark:bg-[#1E2421] border border-[#E8E4D9] dark:border-[#344E41] rounded-xl text-xs sm:text-sm text-[#344E41] dark:text-[#E9EDC9] focus:outline-none focus:ring-1 focus:ring-[#588157]"
                />
              </div>

              {/* Dynamic Availability Hour Slots grid */}
              <div className="space-y-2">
                <label className="block text-xs uppercase font-mono text-[#6B705C] dark:text-[#A3B18A] font-bold">Select Active Slot Hours:</label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedTherapist.availability.map((time, key) => {
                    const isSelected = bookingTime === time;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setBookingTime(time)}
                        className={`py-3 px-4 rounded-xl border text-center transition-all duration-200 cursor-pointer text-xs font-mono font-bold flex flex-row items-center justify-center space-x-2 ${
                          isSelected
                            ? "bg-[#344E41] text-white border-[#344E41] shadow-md scale-[1.02]"
                            : "bg-[#F4F1EA] text-[#344E41] border-[#E8E4D9] dark:bg-[#1E2421] dark:text-[#E9EDC9] dark:border-[#344E41]/70 hover:bg-[#E9EDC9]/50 dark:hover:bg-[#344E41]/20"
                        }`}
                      >
                        <Clock className={`h-3.5 w-3.5 ${isSelected ? "text-[#E9EDC9]" : "text-[#588157] dark:text-[#A3B18A]"}`} />
                        <span>{time}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Consultation Notes */}
              <div className="space-y-1.5 font-sans">
                <label className="block text-xs uppercase font-mono text-[#6B705C] dark:text-[#A3B18A] font-bold">Detail Personal Symptoms notes:</label>
                <textarea
                  placeholder="Tell us what you are coping with (e.g. chronic insomnia, relationships struggles, anxiety curves)."
                  rows={3}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F4F1EA] dark:bg-[#1E2421] border border-[#E8E4D9] dark:border-[#344E41] rounded-xl text-xs sm:text-sm placeholder-[#6B705C]/50 text-[#344E41] dark:text-[#E9EDC9] focus:outline-none focus:ring-1 focus:ring-[#588157] resize-none"
                ></textarea>
              </div>

              <div className="border-t pt-4 border-[#E8E4D9] dark:border-[#344E41] flex justify-between items-center bg-[#F4F1EA] dark:bg-[#1E2421] -mx-6 -mb-6 p-6 rounded-b-[32px]">
                <button
                  type="button"
                  onClick={() => setSelectedTherapist(null)}
                  className="px-4 py-2 bg-[#E8E4D9] dark:bg-[#344E41]/60 text-[#6B705C] dark:text-[#E9EDC9] text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-[#344E41] hover:bg-[#2A3F34] text-white font-serif font-semibold text-xs rounded-xl shadow-lg cursor-pointer flex items-center space-x-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{isLoading ? "Locking..." : "Lock Booking Slot"}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- TELETHERAPY ACTIVE VIDEO CALLING MODAL --- */}
      {activeCallAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="max-w-4xl w-full bg-[#1A1F1C] border border-[#344E41]/70 rounded-[32px] overflow-hidden text-white flex flex-col h-[600px] shadow-2xl relative">
            
            {/* Top Bar detailing Secure Encrypted Call Room */}
            <div className="p-4 bg-emerald-950/45 border-b border-[#344E41]/50 flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                DPDP-ALIGNED SECURE TELEHEALTH CALL
              </span>
              <span className="font-mono text-[#A3B18A] font-bold bg-white/10 px-2.5 py-1 rounded">Duration: {Math.floor(callTimer / 60)}:{(callTimer % 60).toString().padStart(2, '0')}</span>
            </div>

            {/* Video Streams Container Row */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 bg-[#121614] p-4 gap-4 overflow-y-auto">
              {/* Doctor Streaming Camera view */}
              <div className="bg-slate-900 rounded-2xl relative overflow-hidden flex items-center justify-center border border-[#344E41]/40 h-full">
                {!isVideoMuted ? (
                  <img
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2"
                    alt="Doctor"
                    onError={(event) => {
                      event.currentTarget.src = namedImageDataUri(activeCallAppointment.therapistName, "video consultation", ["#1A1F1C", "#344E41", "#A3B18A"]);
                    }}
                    className="w-full h-full object-cover rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center font-serif text-slate-500">Therapist Video Suspended</div>
                )}
                <div className="absolute bottom-3 left-3 bg-black/65 px-3 py-1 rounded-lg text-[10px] font-mono font-bold">
                  {activeCallAppointment.therapistName} (Verified Practitioner)
                </div>
              </div>

              {/* Patient Camera overlay / Shared Screen */}
              <div className="bg-slate-950 rounded-2xl relative overflow-hidden flex items-center justify-center border border-[#344E41]/35 h-full">
                {isCastingScreen ? (
                  <div className="p-6 text-center space-y-2">
                    <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto animate-pulse" />
                    <p className="font-serif text-sm font-bold">Casting Mental Health Care client workspace screen...</p>
                    <p className="text-[10px] text-slate-500 font-mono">Live virtual display synchronization active</p>
                  </div>
                ) : (
                  <div className="relative w-full h-full bg-slate-950 flex flex-col justify-center items-center">
                    <span className="h-10 w-10 bg-[#E9EDC9] text-[#344E41] rounded-full flex items-center justify-center text-sm font-black animate-pulse">YOU</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-2 animate-pulse">Local secure client camera active</span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-black/65 px-3 py-1 rounded-lg text-[10px] font-mono font-bold">
                  Client: {user ? user.name : "Guest Session"}
                </div>
              </div>
            </div>

            {/* Active Clinical Dialogue Captions Banner */}
            <div className="bg-[#1C221F] p-4 text-center border-t border-[#344E41]/40">
              <p className="text-[10px] text-emerald-400 font-bold font-mono uppercase tracking-wider">Verified Real-Time AI Interpreter Call Captioning</p>
              <p className="text-xs text-slate-300 italic mt-1 max-w-xl mx-auto font-serif">
                "{activeCallAppointment.therapistName}: Welcome back to Mental Health Care. Take a nice gradual breath and hold. We are here to talk, find a supportive coping rhythm, and analyze your emotional patterns."
              </p>
            </div>

            {/* Stream Controller buttons */}
            <div className="p-4 bg-[#121614] border-t border-[#344E41]/50 flex justify-center items-center gap-3.5 flex-wrap">
              <button
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isAudioMuted ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                title={isAudioMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isAudioMuted ? "Muted" : "Mute Microphone"}
              </button>

              <button
                onClick={() => setIsVideoMuted(!isVideoMuted)}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isVideoMuted ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                title={isVideoMuted ? "Start Camera" : "Stop Camera"}
              >
                {isVideoMuted ? "Video Stopped" : "Stop My Camera"}
              </button>

              <button
                onClick={() => setIsCastingScreen(!isCastingScreen)}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isCastingScreen ? 'bg-emerald-600 border-[#588157]' : 'bg-slate-800 text-slate-300'}`}
              >
                {isCastingScreen ? "Stop Share My Screen" : "Share Workspace Screen"}
              </button>

              <button
                onClick={() => {
                  setAppointments(prev => prev.map(a => a.id === activeCallAppointment.id ? { ...a, status: "Completed" } : a));
                  setActiveCallAppointment(null);
                  alert(`Therapy consultation ended. Please log rating feedback comments for ${activeCallAppointment.therapistName}.`);
                }}
                className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg transition-transform cursor-pointer"
              >
                End Clinical Consultation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Inline fallback Close Icon to ensure compliance with minimal imports
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
