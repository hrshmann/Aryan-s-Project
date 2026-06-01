/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserCheck, 
  Calendar, 
  Clock, 
  Shield, 
  CheckCircle, 
  XCircle, 
  FolderHeart, 
  BarChart, 
  User, 
  Smile, 
  Award,
  AlertCircle,
  Mail,
  Activity
} from "lucide-react";
import { Therapist, Appointment, Feedback, User as UserType } from "../types";
import { formatIndiaDate } from "../utils/indiaLocale";

interface AdminTherapistDashboardProps {
  user: UserType | null;
  token: string | null;
}

export default function AdminTherapistDashboard({
  user,
  token
}: AdminTherapistDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState({
    activePatients: 12,
    pendingDoctors: 1,
    avgMood: 3.5,
    upcomingConsultations: 2
  });

  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [serverMsg, setServerMsg] = useState("");
  const [serverErr, setServerErr] = useState("");

  // Blogs CMS states
  const [blogs, setBlogs] = useState<any[]>([]);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogCategory, setBlogCategory] = useState("Mindfulness");
  const [blogDuration, setBlogDuration] = useState("5 min read");
  const [blogSummary, setBlogSummary] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogImage, setBlogImage] = useState("https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400");

  const loadData = () => {
    if (!token) return;

    // 1. Fetch appointments
    fetch("/api/appointments", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAppointments(data);
        }
      })
      .catch((err) => console.log("Dashboard fetch appts crash: ", err));

    // 2. Fetch therapists
    fetch("/api/therapists")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTherapists(data);
          
          // Deduce custom stats
          const pending = data.filter((t) => !t.approved).length;
          setStats((prev) => ({
            ...prev,
            pendingDoctors: pending
          }));
        }
      })
      .catch((err) => console.log("Dashboard fetch therapists crash: ", err));

    // 3. Fetch public feedback
    fetch("/api/feedback")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFeedback(data);
        }
      })
      .catch((err) => console.log("Dashboard fetch feedback crash: ", err));

    // 4. Fetch blogs
    fetch("/api/blogs")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBlogs(data);
        }
      })
      .catch((err) => console.log("Dashboard fetch blogs crash: ", err));
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Approve therapist (Admin Role only)
  const handleApproveTherapist = (therapistId: string, approveState: boolean) => {
    setServerMsg("");
    setServerErr("");
    
    fetch(`/api/therapists/approve/${therapistId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ approved: approveState })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Approval rejected by server.");
        return res.json();
      })
      .then(() => {
        setServerMsg(`Therapist status updated to ${approveState ? 'Approved' : 'Declined'} successfully.`);
        loadData();
      })
      .catch((err) => {
        setServerErr("Approval failed: Ensure credentials hold.");
      });
  };

  // Blogs CMS actions
  const handlePublishBlog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim() || !blogContent.trim()) {
      setServerErr("Article title and full guide content are required.");
      return;
    }

    setServerMsg("");
    setServerErr("");

    fetch("/api/blogs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        title: blogTitle,
        category: blogCategory,
        summary: blogSummary || (blogContent.slice(0, 110) + "..."),
        duration: blogDuration,
        imageUrl: blogImage,
        content: blogContent
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Blog posting failed: verify active credentials.");
        return res.json();
      })
      .then(() => {
        setServerMsg("New educational resource launched and published successfully on directory dashboard! (+15 XP Activity Reward added)");
        setBlogTitle("");
        setBlogSummary("");
        setBlogContent("");
        loadData();
      })
      .catch((err) => {
        setServerErr(err.message);
      });
  };

  const handleStripBlog = (blogId: string) => {
    setServerMsg("");
    setServerErr("");

    fetch(`/api/blogs/${blogId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Strip blog failed.");
        return res.json();
      })
      .then(() => {
        setServerMsg("Resource was stripped from clinical boards.");
        loadData();
      })
      .catch((err) => {
        setServerErr(err.message);
      });
  };

  // Confirm / Cancel therapy appointments (Therapist or Admin Role only)
  const handleUpdateApptStatus = (apptId: string, newStatus: "Confirmed" | "Completed" | "Cancelled") => {
    setServerMsg("");
    setServerErr("");

    fetch(`/api/appointments/${apptId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Status update rejected.");
        return res.json();
      })
      .then(() => {
        setServerMsg(`Appointment #${apptId} has been designated as: ${newStatus}`);
        loadData();
      })
      .catch((err) => {
        setServerErr("Status update failed. Verify practitioner credentials.");
      });
  };

  if (!user || (user.role !== "Admin" && user.role !== "Therapist")) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-8 space-y-4">
        <AlertCircle className="h-12 w-12 text-[#DDB892] mx-auto" />
        <h3 className="font-serif font-semibold text-xl text-[#344E41] dark:text-[#E9EDC9]">Access Violation Path</h3>
        <p className="text-sm text-[#6B705C] dark:text-[#A3B18A] leading-relaxed font-sans">
          This dashboard requires active administrative level accounts or clinical registered doctor sessions. Please authenticate with role-based credentials.
        </p>
      </div>
    );
  }

  const isAdmin = user.role === "Admin";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-16">
      
      {/* Title */}
      <div className="text-left space-y-2 border-b pb-6 border-[#E8E4D9] dark:border-[#344E41] flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#588157] dark:text-[#A3B18A]">
            <Shield className="h-5 w-5 animate-pulse" />
            <span className="text-xs uppercase font-mono tracking-widest font-bold">
              {isAdmin ? "Superuser Command Administration" : "Licensed Practitioner Dashboard"}
            </span>
          </div>
          <h1 className="font-serif font-light text-2xl sm:text-3xl text-[#344E41] dark:text-[#E9EDC9] tracking-tight">
            Greetings, {user.name}
          </h1>
          <p className="text-sm text-[#6B705C] dark:text-[#A3B18A] font-sans">
            Review scheduler grids, moderate clinical therapist credentials, and study public feedback stats.
          </p>
        </div>
        
        {/* Connection status */}
        <div className="flex items-center space-x-2 bg-[#E9EDC9] dark:bg-[#344E41]/30 px-3 py-1.5 rounded-full text-xs text-[#344E41] dark:text-[#E9EDC9] font-mono font-bold border border-[#A3B18A]/30">
          <Activity className="h-3.5 w-3.5 animate-pulse text-[#588157]" />
          <span>Clinical Servers: Operational</span>
        </div>
      </div>

      {/* Notifications banner */}
      {(serverMsg || serverErr) && (
        <div className="max-w-4xl">
          {serverMsg && (
            <div className="p-4 rounded-xl bg-[#E9EDC9] dark:bg-[#344E41]/25 text-[#344E41] dark:text-[#E9EDC9] border border-[#A3B18A]/30 text-xs font-semibold">
              ✓ {serverMsg}
            </div>
          )}
          {serverErr && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 text-xs font-semibold">
              🚨 {serverErr}
            </div>
          )}
        </div>
      )}

      {/* --- STATS GRID --- */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] flex items-center space-x-4 shadow-sm">
          <div className="p-3 rounded-xl bg-[#E9EDC9] dark:bg-[#344E41]/50 text-[#344E41] dark:text-[#E9EDC9] shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[#6B705C] dark:text-[#A3B18A] text-[10px] font-mono tracking-wider uppercase font-bold">COMMUNITY USERS</span>
            <span className="block text-2xl font-serif font-black text-[#344E41] dark:text-[#E9EDC9]">
              {isAdmin ? stats.activePatients : "Protected"}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] flex items-center space-x-4 shadow-sm">
          <div className="p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2421] text-[#A3B18A] shrink-0">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[#6B705C] dark:text-[#A3B18A] text-[10px] font-mono tracking-wider uppercase font-bold">PENDING DOCTORS</span>
            <span className="block text-2xl font-serif font-black text-[#344E41] dark:text-[#E9EDC9]">{stats.pendingDoctors}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] flex items-center space-x-4 shadow-sm">
          <div className="p-3 rounded-xl bg-[#E9EDC9] dark:bg-[#344E41]/50 text-[#344E41] dark:text-[#E9EDC9] shrink-0">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[#6B705C] dark:text-[#A3B18A] text-[10px] font-mono tracking-wider uppercase font-bold">ACTIVE CONSULTATIONS</span>
            <span className="block text-2xl font-serif font-black text-[#344E41] dark:text-[#E9EDC9]">{appointments.length}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] flex items-center space-x-4 shadow-sm">
          <div className="p-3 rounded-xl bg-[#344E41] text-[#E9EDC9] shrink-0">
            <Smile className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[#6B705C] dark:text-[#A3B18A] text-[10px] font-mono tracking-wider uppercase font-bold">AVG HAPPINESS CHECK</span>
            <span className="block text-2xl font-serif font-black text-[#344E41] dark:text-[#E9EDC9]">4.2 / 5</span>
          </div>
        </div>
      </section>

      {/* --- TWO COLS MODULES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: ACTIVE CONSULTATION TASKS / RESERVATIONS GRIDS (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-[32px] bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] shadow-xs space-y-4">
          <div>
            <h3 className="font-serif font-semibold text-base text-[#344E41] dark:text-[#E9EDC9] flex items-center">
              <Calendar className="h-4.5 w-4.5 mr-2 text-[#588157]" />
              <span>Consultation Schedule Moderation Grid</span>
            </h3>
            <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] font-sans">
              {isAdmin 
                ? "Global monitoring ledger of patient-doctor scheduling reservations." 
                : "Active calendar slots patients registered with your profile."}
            </p>
          </div>

          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1" id="appointments-moderation-ledger">
            {appointments.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6B705C] dark:text-[#A3B18A] italic bg-[#F4F1EA]/50 dark:bg-[#1E2421]/50 rounded-2xl border border-[#E8E4D9] dark:border-[#344E41] border-dashed">
                No scheduled consultations locked to database yet.
              </div>
            ) : (
              appointments.map((appt) => (
                <div 
                  key={appt.id} 
                  className="p-4 rounded-2xl bg-[#F4F1EA]/60 dark:bg-[#1E2421]/80 border border-[#E8E4D9] dark:border-[#344E41]/50 space-y-3 relative text-left"
                >
                  <div className="flex justify-between items-center text-left">
                    <div className="space-y-0.5 text-left">
                      <span className="block text-[10px] font-mono uppercase tracking-wider text-[#A3B18A]">Patient: {appt.userName}</span>
                      <h4 className="font-serif font-semibold text-sm text-[#344E41] dark:text-[#E9EDC9]">With {appt.therapistName}</h4>
                    </div>
                    
                    <span className={`text-[10.5px] font-mono tracking-wider font-extrabold px-2.5 py-0.5 rounded-full ${
                      appt.status === "Confirmed" 
                        ? "bg-[#E9EDC9] text-[#344E41]"
                        : appt.status === "Completed"
                        ? "bg-[#588157]/20 text-[#344E41] dark:text-[#E9EDC9]"
                        : appt.status === "Cancelled"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-[#DDB892]/20 text-[#7F5539] dark:text-[#E9EDC9]"
                    }`}>
                      {appt.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-xs font-mono text-[#6B705C] dark:text-[#A3B18A]">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatIndiaDate(appt.date)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{appt.time}</span>
                    </div>
                  </div>

                  {appt.notes && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41]/40 text-xs text-[#6B705C] dark:text-[#A3B18A] font-sans italic text-left">
                      Symptom Note: "{appt.notes}"
                    </div>
                  )}

                  {/* Actions (Only Therapist who owns the appt OR admin can touch) */}
                  {(isAdmin || appt.therapistId === user.id) && (
                    <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E4D9] dark:border-[#344E41]/30 flex-wrap">
                      {appt.status === "Pending" && (
                        <button
                          onClick={() => handleUpdateApptStatus(appt.id, "Confirmed")}
                          className="px-3 py-1.5 bg-[#344E41] hover:bg-[#2A3F34] text-white font-serif font-semibold text-[10px] rounded-lg shadow cursor-pointer transition-colors"
                        >
                          Approve Slot
                        </button>
                      )}
                      
                      {appt.status !== "Cancelled" && appt.status !== "Completed" && (
                        <button
                          onClick={() => handleUpdateApptStatus(appt.id, "Cancelled")}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-sans font-semibold text-[10px] rounded-lg cursor-pointer transition-colors"
                        >
                          Decline / Cancel
                        </button>
                      )}

                      {appt.status === "Confirmed" && (
                        <button
                          onClick={() => handleUpdateApptStatus(appt.id, "Completed")}
                          className="px-3 py-1.5 bg-[#588157] hover:bg-[#476A46] text-[#FDFBF7] font-serif font-semibold text-[10px] rounded-lg shadow cursor-pointer transition-colors"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ADMIN MODERATION & FEEDBACK COLS (5 cols) */}
        <div className="lg:col-span-5 space-y-6" id="admin-moderation-sidebox">
          
          {/* Admin Therapists Approval Panel (Visible to Admins only) */}
          {isAdmin && (
            <div className="p-6 rounded-[32px] bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] shadow-xs space-y-4">
              <div>
                <h3 className="font-serif font-semibold text-base text-[#344E41] dark:text-[#E9EDC9]">Registered Doctor Approvals</h3>
                <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] font-sans">Administrative panel for vetting licenses & credentials.</p>
              </div>

              <div className="space-y-3">
                {therapists.map((therapist) => (
                  <div 
                    key={therapist.id} 
                    className="p-3.5 rounded-2xl bg-[#F4F1EA]/65 dark:bg-[#1E2421]/60 border border-[#E8E4D9] dark:border-[#344E41]/50 flex items-center justify-between gap-3 text-left"
                  >
                    <div className="space-y-1">
                      <h4 className="font-serif font-semibold text-xs text-[#344E41] dark:text-[#E9EDC9]">{therapist.name}</h4>
                      <p className="text-[10px] text-[#588157] font-mono font-bold leading-none">{therapist.specialty}</p>
                      <span className="block text-[9px] text-[#6B705C] dark:text-[#A3B18A] font-mono font-bold">Status: {therapist.approved ? "Approved Vetted" : "Pending Vetting"}</span>
                    </div>

                    <div className="shrink-0 flex space-x-1">
                      {!therapist.approved ? (
                        <button
                          onClick={() => handleApproveTherapist(therapist.id, true)}
                          className="p-1.5 bg-[#E9EDC9] text-[#344E41] rounded-lg hover:bg-[#A3B18A] font-serif font-semibold text-[9px] border border-[#E8E4D9] hover:scale-105 transition-all text-center uppercase cursor-pointer"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApproveTherapist(therapist.id, false)}
                          className="p-1.5 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 font-sans font-semibold text-[9px] border hover:scale-105 transition-all text-center uppercase cursor-pointer"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platform Feedback & Reports Review */}
          <div className="p-6 rounded-[32px] bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] shadow-xs space-y-4">
            <div>
              <h3 className="font-serif font-semibold text-base text-[#344E41] dark:text-[#E9EDC9] flex items-center">
                <FolderHeart className="h-4.5 w-4.5 mr-2 text-[#588157]" />
                <span>Patient Feedback & Reports Logs</span>
              </h3>
              <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] font-sans">Honest patient experience reviews recorded by administrative teams.</p>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {feedback.length === 0 ? (
                <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] italic font-sans text-center py-4">No patient reviews submitted yet.</p>
              ) : (
                feedback.map((feed) => {
                  const isExpanded = selectedFeedId === feed.id;
                  return (
                    <div 
                      key={feed.id} 
                      className="p-3.5 rounded-2xl bg-[#F4F1EA]/50 dark:bg-[#1E2421]/60 border border-[#E8E4D9]/80 dark:border-[#344E41]/50 space-y-2 text-left transition-all"
                    >
                      <div className="flex justify-between items-center text-left">
                        <span className="text-xs font-bold font-serif text-[#344E41] dark:text-[#E9EDC9]">{feed.name}</span>
                        <span className="text-[10px] bg-[#E9EDC9] text-[#344E41] px-1.5 py-0.5 rounded-full font-mono font-bold">★ {feed.rating}</span>
                      </div>
                      <p className={`text-xs text-[#6B705C] dark:text-[#A3B18A] leading-relaxed italic text-left ${isExpanded ? "" : "line-clamp-2"}`}>
                        "{feed.message}"
                      </p>
                      <div className="flex justify-between items-center text-[10px] text-[#A3B18A] font-mono">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3.5 w-3.5 text-[#588157]" />
                          <span>{feed.email}</span>
                        </div>
                        <button 
                          onClick={() => setSelectedFeedId(isExpanded ? null : feed.id)}
                          className="hover:text-[#588157] font-semibold font-serif cursor-pointer focus:outline-none"
                        >
                          {isExpanded ? "Collapse" : "Expand"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

      {/* --- ADMIN CMS FOR BLOGS & RESOURCES CONTENT MANAGER --- */}
      <section className="p-6 sm:p-8 rounded-[32px] bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] shadow-sm space-y-6 text-left" id="admin-cms-blogs-section">
        <div className="border-b pb-4 border-[#E8E4D9] dark:border-[#344E41] flex justify-between items-center flex-wrap gap-2">
          <div>
            <div className="flex items-center space-x-2 text-[#588157]">
              <span className="h-2 w-2 rounded-full bg-[#588157] animate-ping" />
              <h3 className="font-serif font-semibold text-lg text-[#344E41] dark:text-[#E9EDC9]">Admin CMS: Health Blogs & Self-Care Guides</h3>
            </div>
            <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] font-sans">
              Write, review, publish, and delete mental health resources dynamically served to clinical clients.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Create Blog Form (7 cols) */}
          <form onSubmit={handlePublishBlog} className="lg:col-span-7 space-y-4 bg-[#FDFBF7]/60 dark:bg-[#1E2421]/60 p-6 rounded-2xl border border-[#E8E4D9]/80 dark:border-[#344E41]/70">
            <p className="font-serif font-black text-xs text-[#344E41] dark:text-[#E9EDC9] uppercase tracking-wide">Write New Clinical Resource</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-mono font-bold uppercase text-[#6B705C] dark:text-[#A3B18A]">Article Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navigating Chronic Dysthymia"
                  value={blogTitle}
                  onChange={(e) => setBlogTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41]/70 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-mono font-bold uppercase text-[#6B705C] dark:text-[#A3B18A]">Category Tag:</label>
                <select
                  value={blogCategory}
                  onChange={(e) => setBlogCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41]/70 rounded-xl text-xs focus:outline-none"
                >
                  <option value="Mindfulness">Mindfulness</option>
                  <option value="Anxiety">Anxiety</option>
                  <option value="Sleep">Sleep</option>
                  <option value="Relationships font-sans">Relationships</option>
                  <option value="Depression">Depression</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-mono font-bold uppercase text-[#6B705C] dark:text-[#A3B18A]">Read Duration Summary:</label>
                <input
                  type="text"
                  placeholder="e.g. 5 min read"
                  value={blogDuration}
                  onChange={(e) => setBlogDuration(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41]/70 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-mono font-bold uppercase text-[#6B705C] dark:text-[#A3B18A]">Cover Photo URL:</label>
                <input
                  type="url"
                  placeholder="Unsplash URL"
                  value={blogImage}
                  onChange={(e) => setBlogImage(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41]/70 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-mono font-bold uppercase text-[#6B705C] dark:text-[#A3B18A]">Brief Summary Slogan:</label>
              <input
                type="text"
                placeholder="Give a brief summary to render on card overview feeds..."
                value={blogSummary}
                onChange={(e) => setBlogSummary(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41]/70 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-mono font-bold uppercase text-[#6B705C] dark:text-[#A3B18A]">Full Article Content Description:</label>
              <textarea
                required
                rows={4}
                placeholder="Write full CBT guides, diaphragmatic breathing methodologies, and sleep schedules..."
                value={blogContent}
                onChange={(e) => setBlogContent(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41]/70 rounded-xl text-xs resize-none"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#344E41] hover:bg-[#2A3F34] text-white text-xs font-serif font-semibold rounded-xl transition-all cursor-pointer shadow-md"
            >
              Publish Clinical Article (+15 XP Activity Reward)
            </button>
          </form>

          {/* Directory Monitoring List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <p className="font-serif font-black text-xs text-[#344E41] dark:text-[#E9EDC9] uppercase tracking-wide">Published Directory guides ({blogs.length})</p>
            
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {blogs.length === 0 ? (
                <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] italic">No custom resources published on this browser's session database.</p>
              ) : (
                blogs.map((b) => (
                  <div key={b.id} className="p-3 bg-[#F4F1EA]/45 dark:bg-[#1E2421]/60 border border-[#E8E4D9]/80 dark:border-[#344E41]/40 rounded-2xl flex items-center justify-between text-left">
                    <div className="space-y-1 overflow-hidden pr-2">
                      <h5 className="font-serif font-semibold text-xs text-[#344E41] dark:text-[#E9EDC9] truncate">{b.title}</h5>
                      <span className="inline-block px-1.5 py-0.5 bg-[#E9EDC9] text-[#344E41] text-[9px] font-mono rounded font-bold font-sans">{b.category}</span>
                      <span className="block text-[9px] text-[#A3B18A] font-mono truncate">By {b.author || "Consultant"}</span>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => handleStripBlog(b.id)}
                        className="py-1 px-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[9px] font-sans font-bold cursor-pointer transition-all border border-rose-200 select-none shrink-0"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
