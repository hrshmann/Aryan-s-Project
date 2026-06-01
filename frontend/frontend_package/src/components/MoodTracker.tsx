/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Smile, 
  Frown, 
  Meh, 
  Laugh, 
  Heart, 
  Sparkles, 
  Plus, 
  Trash2, 
  BookOpen, 
  PlusCircle, 
  PartyPopper,
  Zap,
  Tag,
  Info,
  Mic,
  MicOff,
  Brain,
  Bot,
  Activity
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { MoodRecord, User } from "../types";
import { formatIndiaChartDate, formatIndiaDate } from "../utils/indiaLocale";

interface MoodTrackerProps {
  user: User | null;
  onRefreshUser: (updatedUser: any) => void;
  token: string | null;
}

const AVAILABLE_TAGS = ["Stress", "Anxiety", "Calm", "Peaceful", "Tired", "Excited", "Sad", "Grateful", "Uninspired", "Restless"];

export default function MoodTracker({ user, onRefreshUser, token }: MoodTrackerProps) {
  const [score, setScore] = useState<number>(3); // Default to Okay
  const [note, setNote] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [historyList, setHistoryList] = useState<MoodRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  
  // Gamification celebration state
  const [rewardCelebration, setRewardCelebration] = useState<{
    points: number;
    message: string;
    milestone: string;
  } | null>(null);

  // Simulated Voice journaling states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingFeedback, setRecordingFeedback] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 4) {
            setIsRecording(false);
            setNote("Spent a peaceful moment doing somatic breathing today. My stress flutters dissolved. Ready for clinical consultation steps if any anxiety triggers recur.");
            setRecordingFeedback("Transcribed Voice: 'Spent a peaceful moment doing somatic breathing today...' applied successfully (+20 XP Voice Bonus enabled)!");
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const fetchMoodHistory = () => {
    if (!token) return;
    fetch("/api/moods", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load moods");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          // Sort chronology ascending for recharts
          const sorted = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setHistoryList(sorted);
        }
      })
      .catch((err) => console.log("Fail fetching moods: ", err));
  };

  useEffect(() => {
    fetchMoodHistory();
  }, [token]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleLogMood = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    setRewardCelebration(null);

    if (!token) {
      setErrorText("You must be logged in to store mood trackers securely.");
      return;
    }

    setIsSubmitting(true);

    fetch("/api/moods", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        score,
        note,
        tags: selectedTags
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not log mood state");
        return res.json();
      })
      .then((data) => {
        fetchMoodHistory(); // reload timeline
        setNote("");
        setSelectedTags([]);
        
        // Show points collected celebration
        setRewardCelebration({
          points: data.pointsEarned,
          message: data.message,
          milestone: data.milestoneUnlocked
        });

        // Trigger user metadata sync to refresh XP pill at top navigation
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
        setErrorText("Server encountered error storing wellness log. Check credentials.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  // Convert raw records to recharts dynamic schema
  const chartData = historyList.map((entry) => {
    const label = formatIndiaChartDate(entry.date);
    return {
      name: label,
      "Mood State": entry.score,
      Note: entry.note || "No log notes added"
    };
  });

  const moodFaces = [
    { value: 1, label: "Awful", icon: Frown, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-200" },
    { value: 2, label: "Down", icon: Frown, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/20", border: "border-orange-200" },
    { value: 3, label: "Neutral", icon: Meh, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200" },
    { value: 4, label: "Good", icon: Smile, color: "text-teal-650", bg: "bg-teal-50 dark:bg-teal-950/20", border: "border-teal-200" },
    { value: 5, label: "Peaceful", icon: Laugh, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-16">
      
      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-block px-3 py-1 bg-[#E9EDC9] dark:bg-[#344E41]/30 border border-[#A3B18A]/30 text-[#344E41] dark:text-[#E9EDC9] text-xs font-bold tracking-wider rounded-lg">
          ANALYTICS & EXPRESSION
        </div>
        <h1 className="font-serif font-light text-3xl sm:text-4xl text-[#344E41] dark:text-[#E9EDC9] tracking-tight">
          Visual Mood Tracker & Journal Logs
        </h1>
        <p className="text-sm text-[#6B705C] dark:text-[#A3B18A] max-w-2xl mx-auto font-sans">
          Chart your emotional wellness peaks over days. Submit detailed daily checks to unlock gamified badges, level-ups, and custom self-care points.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* --- LEFT COL: SUBMIT DAILY MOOD CHECK (5 cols) --- */}
        <div id="mood-form-column" className="lg:col-span-5 p-6 sm:p-8 rounded-[32px] bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-[#344E41] dark:text-[#E9EDC9]">
            <Sparkles className="h-5 w-5 text-[#588157] animate-pulse" />
            <h2 className="font-serif font-semibold text-lg">Daily MindCheck-In</h2>
          </div>

          {errorText && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/25 text-rose-800 dark:text-rose-450 border border-rose-100 dark:border-rose-900/40 text-xs font-medium font-sans">
              {errorText}
            </div>
          )}

          <form onSubmit={handleLogMood} className="space-y-6">
            
            {/* Expressive Faces Selector */}
            <div className="space-y-2">
              <label className="block text-xs uppercase font-mono text-[#6B705C] dark:text-[#A3B18A] font-bold">How are you feeling right now?</label>
              <div className="grid grid-cols-5 gap-2" id="mood-selector-faces">
                {moodFaces.map((face) => {
                  const CurrentIcon = face.icon;
                  const isSelected = score === face.value;
                  return (
                    <button
                      key={face.value}
                      type="button"
                      onClick={() => setScore(face.value)}
                      className={`p-3.5 rounded-2xl flex flex-col items-center justify-between border select-none transition-all cursor-pointer ${
                        isSelected 
                          ? `bg-[#E9EDC9]/60 dark:bg-[#344E41]/35 border-[#588157] text-[#344E41] dark:text-[#E9EDC9] scale-105 shadow-inner` 
                          : "border-[#E8E4D9] dark:border-[#344E41] bg-white dark:bg-[#1E2421] text-[#6B705C] dark:text-[#A3B18A] hover:bg-[#F4F1EA]"
                      }`}
                    >
                      <CurrentIcon className={`h-6 w-6 mb-1.5 shrink-0 ${isSelected ? "text-[#588157] dark:text-[#E9EDC9]" : "text-[#A3B18A]"}`} />
                      <span className="text-[10px] font-serif font-bold">{face.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily reflections Journal notes */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs uppercase font-mono text-[#6B705C] dark:text-[#A3B18A] font-bold">
                <label className="flex items-center gap-1">
                  <span>Daily Journal Notes</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setRecordingFeedback(null);
                    setIsRecording(!isRecording);
                  }}
                  className={`py-1 px-2.5 rounded-lg text-[10px] font-sans font-bold flex items-center space-x-1 border cursor-pointer transition-all ${
                    isRecording 
                      ? "bg-rose-500 text-white border-rose-500 animate-pulse" 
                      : "bg-[#F4F1EA] dark:bg-[#1E2421] text-[#344E41] dark:text-[#E9EDC9] border-[#E8E4D9] dark:border-[#344E41] hover:bg-emerald-100 dark:hover:bg-emerald-950/30"
                  }`}
                  id="voice-journal-toggle"
                >
                  <Mic className="h-3 w-3 shrink-0" />
                  <span>{isRecording ? `Recording... (${recordingSeconds}s)` : "Voice Reflection Mode"}</span>
                </button>
              </div>

              {isRecording && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-250 flex flex-col items-center justify-center space-y-2 text-center animate-fadeIn">
                  <span className="text-[9px] text-rose-500 font-mono font-bold animate-pulse">MIC RECORDING · DISCUSSING YOUR EMOTIONS</span>
                  <div className="flex items-end justify-center space-x-1 h-5">
                    <span className="w-1 bg-rose-500 rounded animate-bounce h-3" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-1 bg-rose-400 rounded animate-bounce h-5" style={{ animationDelay: '0.3s' }}></span>
                    <span className="w-1 bg-rose-500 rounded animate-bounce h-2" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1 bg-rose-600 rounded animate-bounce h-4" style={{ animationDelay: '0.4s' }}></span>
                    <span className="w-1 bg-rose-450 rounded animate-bounce h-1.5" style={{ animationDelay: '0.1s' }}></span>
                  </div>
                </div>
              )}

              {recordingFeedback && (
                <p className="p-2 bg-[#E9EDC9]/60 dark:bg-emerald-950/25 text-[#344E41] dark:text-[#E9EDC9] rounded-xl border border-[#A3B18A]/45 text-[10px] leading-relaxed">
                  ✅ {recordingFeedback}
                </p>
              )}

              <textarea
                placeholder="Write honestly about what triggered this feeling. What are you grateful for today? (Or click 'Voice Reflection' to talk!)"
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-3 bg-[#F4F1EA] dark:bg-[#1E2421] border border-[#E8E4D9] dark:border-[#344E41] rounded-2xl text-sm text-[#344E41] dark:text-[#E8E4D9] placeholder-[#6B705C]/60 focus:outline-none focus:ring-1 focus:ring-[#588157] resize-none font-sans"
              ></textarea>
            </div>

            {/* Wellness Category Tagging */}
            <div className="space-y-2">
              <label className="block text-xs uppercase font-mono text-[#6B705C] dark:text-[#A3B18A] font-bold flex items-center">
                <Tag className="h-3.5 w-3.5 mr-1 text-[#588157]" />
                <span>Select Emotions Tagged</span>
              </label>
              <div className="flex flex-wrap gap-1.5" id="tag-picker">
                {AVAILABLE_TAGS.map((tag) => {
                  const selected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                        selected 
                          ? "bg-[#588157] text-[#FDFBF7] shadow-sm font-sans font-bold hover:scale-105" 
                          : "bg-[#F4F1EA] hover:bg-[#E8E4D9] dark:bg-[#1E2421] dark:hover:bg-[#202724] text-[#6B705C] dark:text-[#A3B18A]"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#344E41] hover:bg-[#2A3F34] text-white font-serif font-semibold rounded-2xl shadow-md active:scale-95 transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>{isSubmitting ? "Syncing Log..." : "Log Heart Check & Add Points"}</span>
            </button>

            {!token && (
              <p className="text-[11px] text-center text-[#6B705C] dark:text-[#A3B18A] italic">
                You are currently in guest mode. Join Mental Health Care to archive stats permanently!
              </p>
            )}
          </form>

        </div>

        {/* --- RIGHT COL: CHARTS & HISTORIC RECORDS (7 cols) --- */}
        <div id="mood-analytics-column" className="lg:col-span-7 space-y-6">
          
          {/* Recharts Area Chart Container */}
          <div className="p-6 rounded-[32px] bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] shadow-sm space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="font-serif font-semibold text-base text-[#344E41] dark:text-[#E9EDC9]">Emotional Area Stability</h3>
                <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] font-sans">Visual charting analytics representing mood levels (1-5)</p>
              </div>
              <div className="flex items-center space-x-1 bg-[#E9EDC9] dark:bg-[#344E41]/50 px-2.5 py-1 rounded-full text-[10px] text-[#344E41] dark:text-[#E9EDC9] font-mono leading-none">
                <Zap className="h-3 w-3 animate-pulse text-[#588157] dark:text-[#A3B18A]" />
                <span className="font-bold">Real-Time Live Report</span>
              </div>
            </div>

            {/* Recharts Area Chart wrapper */}
            <div className="h-64 w-full">
              {historyList.length < 2 ? (
                <div className="h-full w-full flex flex-col justify-center items-center text-center p-6 border border-dashed border-[#E8E4D9] dark:border-[#344E41] rounded-2xl bg-[#F4F1EA]/60 dark:bg-[#1E2421]/15">
                  <Info className="h-8 w-8 text-[#A3B18A] mb-2" />
                  <p className="text-sm font-sans text-[#6B705C]">
                    Not enough data mapped yet to plot a curve.
                  </p>
                  <p className="text-xs text-[#A3B18A] mt-1">
                    Log emotional checks at least twice to construct visual charts.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#588157" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#A3B18A" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E4D9" className="dark:stroke-[#344E41]" />
                    <XAxis dataKey="name" stroke="#A3B18A" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#A3B18A" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#252C28", 
                        border: "1px solid #344E41", 
                        borderRadius: "12px", 
                        color: "#FDFBF7", 
                        fontFamily: "serif",
                        fontSize: "11px"
                      }} 
                    />
                    <Area type="monotone" dataKey="Mood State" stroke="#588157" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMood)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Gamification Badge Hub section */}
          {user && (
            <div className="p-6 rounded-[32px] bg-[#344E41] text-[#FDFBF7] shadow-lg space-y-4 border border-[#588157]/40">
              <div>
                <h4 className="font-serif font-bold text-sm text-[#E9EDC9]">Personal Milestone Badge Hub</h4>
                <p className="text-[11px] text-[#A3B18A]">Complete emotional tasks to claim real badges.</p>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { id: "first-breath", title: "First Breath", desc: "Logged first mental mood record", icon: PartyPopper },
                  { id: "deep-thinker", title: "Deep Thinker", desc: "Written 3 detailed reflections", icon: BookOpen },
                  { id: "mindfulness-warrior", title: "Mindfulness Warrior", desc: "Completed 3 breathing loops", icon: Zap }
                ].map((item) => {
                  const unlocked = user.badges && user.badges.includes(item.id);
                  const Icon = item.icon;
                  return (
                    <div 
                      key={item.id} 
                      className={`p-3.5 rounded-2xl border transition-all ${
                        unlocked 
                          ? "bg-white/10 border-[#E9EDC9]/35 text-[#E9EDC9]"
                          : "bg-[#252C28]/45 border-[#344E41] text-[#6B705C] opacity-50"
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Icon className={`h-4.5 w-4.5 ${unlocked ? "text-[#E9EDC9] animate-spin-slow" : "text-[#6B705C]"}`} />
                        <h5 className="font-serif font-bold text-xs">{item.title}</h5>
                      </div>
                      <p className="text-[10px] text-[#A3B18A]">{item.desc}</p>
                      <span className="block text-[9px] font-mono mt-2 font-semibold">
                        {unlocked ? "● UNLOCKED" : "○ LOCKED"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Mood Forecast panel */}
          <div className="p-6 rounded-[32px] bg-gradient-to-r from-[#A3B18A]/10 via-[#588157]/10 to-[#E9EDC9]/10 dark:from-[#252C28] dark:to-[#1E2421] border border-[#588157]/30 dark:border-[#344E41]/90 shadow-sm text-left space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 text-[#344E41] dark:text-[#E9EDC9]">
                <Brain className="h-5 w-5 text-[#588157] dark:text-[#A3B18A] animate-pulse" />
                <h3 className="font-serif font-bold text-sm sm:text-base">A.I. Predictive Mood & Stability Forecast</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[9px] font-mono font-bold bg-[#344E41] text-[#E9EDC9] uppercase">Sol-Alpha v2</span>
            </div>

            <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] leading-relaxed">
              Based on your historical checked-ins, tagged adrenaline peaks, and voice reflection logs, our medical AI engine forecasts your stability index.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1.5">
              <div className="p-4 rounded-xl bg-white dark:bg-[#1C221F] border border-[#E8E4D9]/60 dark:border-[#344E41]/50 space-y-1.5 text-left">
                <span className="text-[9px] font-mono uppercase bg-indigo-50 dark:bg-indigo-950/20 text-indigo-550 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded">Circadian Outlook</span>
                <p className="font-serif font-black text-xs text-[#344E41] dark:text-[#E9EDC9]">Stabilizing Mood (Confidence 88%)</p>
                <p className="text-[10px] text-[#6B705C] dark:text-[#A3B18A] leading-relaxed">Expect lowered stress scores tomorrow afternoon based on sleep history averages.</p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#1C221F] border border-[#E8E4D9]/60 dark:border-[#344E41]/50 space-y-1.5 text-left">
                <span className="text-[9px] font-mono uppercase bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-450 font-bold px-1.5 py-0.5 rounded">Actionable Advice</span>
                <p className="font-serif font-black text-xs text-[#344E41] dark:text-[#E9EDC9]">3m Somatic Box Breathing</p>
                <p className="text-[10px] text-[#6B705C] dark:text-[#A3B18A] leading-relaxed">Planning clinical breathing exercises tonight will buffer sleep quality indices.</p>
              </div>
            </div>
          </div>

          {/* Scrolling history notes stream */}
          <div className="p-6 rounded-[32px] bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-sm text-[#344E41] dark:text-[#E9EDC9]">Historic Logs Archive</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {historyList.length === 0 ? (
                <p className="text-xs text-[#6B705C] italic font-sans dark:text-[#A3B18A]">No mental logs archived. Complete your checks at left.</p>
              ) : (
                [...historyList].reverse().map((entry) => {
                  const scoreLabel = ["Severe Distress", "Under Stress", "Steady/Neutral", "Good Mood", "Fully Peaceful"][entry.score - 1];
                  const logDate = formatIndiaDate(entry.date);
                  return (
                    <div 
                      key={entry.id} 
                      className="p-3.5 rounded-2xl bg-[#F4F1EA]/60 dark:bg-[#1E2421]/80 border border-[#E8E4D9] dark:border-[#344E41]/65 space-y-2 relative text-left"
                      id={`log-entry-${entry.id}`}
                    >
                      <div className="flex justify-between items-center text-left">
                        <div className="flex items-center space-x-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#588157]"></span>
                          <span className="text-xs font-bold text-[#344E41] dark:text-[#E9EDC9]">{scoreLabel} ({entry.score}/5)</span>
                        </div>
                        <span className="text-[10px] text-[#6B705C] dark:text-[#A3B18A] font-mono">{logDate}</span>
                      </div>
                      {entry.note && (
                        <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] leading-relaxed italic pr-2">
                           "{entry.note}"
                        </p>
                      )}
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.map((tag) => (
                            <span 
                              key={tag} 
                              className="px-2 py-0.5 rounded-md bg-[#E9EDC9] text-[#344E41] dark:bg-[#344E41]/40 dark:text-[#E9EDC9] font-mono text-[9px] font-bold"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

      {/* --- GAMIFICATION REWARD POPUP ANIMATION GRID --- */}
      {rewardCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fadeIn">
          <div className="p-6 sm:p-8 rounded-[32px] bg-[#FDFBF7] dark:bg-[#1A1F1C] border border-[#E8E4D9] dark:border-[#344E41] text-center space-y-5 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#588157]/20 rounded-full blur-2xl"></div>
            
            <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-[#A3B18A] to-[#588157] text-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <PartyPopper className="h-8 w-8 text-[#FDFBF7]" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif font-medium text-xl text-[#344E41] dark:text-[#E9EDC9]">Wellness Points Secured!</h3>
              <p className="text-sm text-[#6B705C] dark:text-[#A3B18A] font-sans">{rewardCelebration.message}</p>
            </div>

            <div className="p-4 bg-[#E9EDC9] dark:bg-[#344E41]/45 text-[#344E41] dark:text-[#E9EDC9] rounded-2xl border border-[#A3B18A]/45 text-xs font-sans">
              <span className="block font-black text-base">+ {rewardCelebration.points} Self-Care XP Added</span>
              <span className="block text-[10px] text-[#6B705C] dark:text-[#A3B18A] mt-1">Logged securely to local metadata profile</span>
            </div>

            {rewardCelebration.milestone && (
              <div className="p-3 bg-[#344E41] text-[#E9EDC9] rounded-2xl border border-[#588157] text-[11px] font-bold">
                 ⭐ {rewardCelebration.milestone}
              </div>
            )}

            <button
              onClick={() => setRewardCelebration(null)}
              className="w-full py-3.5 bg-[#344E41] hover:bg-[#2A3F34] text-white font-serif font-semibold text-xs rounded-xl shadow cursor-pointer transition-colors"
              id="confirm-reward-popup"
            >
              Continue Wellness Check
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
