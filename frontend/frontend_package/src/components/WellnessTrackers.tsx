/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from "react";
import { 
  Moon, 
  Droplet, 
  Compass, 
  Flame, 
  Sparkles, 
  CheckCircle, 
  TrendingUp, 
  Star, 
  Trophy, 
  Volume2, 
  CheckSquare, 
  Plus, 
  Calendar,
  Layers,
  Heart
} from "lucide-react";
import { User } from "../types";
import { formatIndiaShortDate } from "../utils/indiaLocale";

interface WellnessTrackersProps {
  user: User | null;
  token: string | null;
  onRefreshUser?: (u: any) => void;
}

const AFFIRMATIONS = [
  "My breathe is a solid anchor. I am safe, I am patient, and I am evolving.",
  "I release the urge to control things that are beyond my control.",
  "My mind is peaceful, and my shoulders are relaxed. I can move through this moment.",
  "I am worthy of professional support and compassionate peer connections.",
  "Slowing down is an courageous act of strength, not a sign of weakness."
];

const INITIAL_CHALLENGES = [
  { id: "ch-1", title: "Box Breathing Champion", desc: "Complete 1 single full-minute box breathing loop.", points: 25, completed: false, joined: false },
  { id: "ch-2", title: "Digital Sunset at 9 PM", desc: "Turn off all blue screen displays and read for 20 minutes.", points: 30, completed: false, joined: false },
  { id: "ch-3", title: "Hydration Milestone", desc: "Log 8 dynamic glasses of filtered water today.", points: 20, completed: false, joined: false },
  { id: "ch-4", title: "Anonymous Peer Support", desc: "Upvote or post one kind reply in the Mental Health Care forums.", points: 15, completed: false, joined: false }
];

export default function WellnessTrackers({ user, token, onRefreshUser }: WellnessTrackersProps) {
  // Tracker State Variables
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [sleepLogs, setSleepLogs] = useState<{ date: string; hours: number; quality: string }[]>([]);
  const [waterCups, setWaterCups] = useState<number>(3); // Glasses logged today
  const [habits, setHabits] = useState([
    { name: "Digital Detox", checked: false, streak: 3 },
    { name: "Somatic Breathwork", checked: true, streak: 5 },
    { name: "Journal Reflection", checked: false, streak: 1 },
    { name: "Clinical Self-Check", checked: false, streak: 0 }
  ]);
  const [challenges, setChallenges] = useState(INITIAL_CHALLENGES);
  const [affirmationIdx, setAffirmationIdx] = useState(0);
  const [pointsEarnedMsg, setPointsEarnedMsg] = useState<string | null>(null);

  // Sync state with local triggers or initial values
  useEffect(() => {
    const savedSleep = localStorage.getItem("Mental Health Care-sleep-logs");
    if (savedSleep) setSleepLogs(JSON.parse(savedSleep));

    const savedWater = localStorage.getItem("Mental Health Care-water-today");
    if (savedWater) setWaterCups(Number(savedWater));

    const savedHabits = localStorage.getItem("Mental Health Care-habits-streaks");
    if (savedHabits) setHabits(JSON.parse(savedHabits));

    const savedChallenges = localStorage.getItem("Mental Health Care-wellness-challenges");
    if (savedChallenges) setChallenges(JSON.parse(savedChallenges));
  }, []);

  const saveSleepLogs = (logs: typeof sleepLogs) => {
    setSleepLogs(logs);
    localStorage.setItem("Mental Health Care-sleep-logs", JSON.stringify(logs));
  };

  const saveHabits = (h: typeof habits) => {
    setHabits(h);
    localStorage.setItem("Mental Health Care-habits-streaks", JSON.stringify(h));
  };

  const saveChallenges = (c: typeof challenges) => {
    setChallenges(c);
    localStorage.setItem("Mental Health Care-wellness-challenges", JSON.stringify(c));
  };

  // Add Sleep entry
  const handleLogSleep = () => {
    const newLog = {
      date: formatIndiaShortDate(new Date()),
      hours: sleepHours,
      quality: sleepHours >= 7 ? "Optimal" : sleepHours >= 5 ? "Moderate" : "Restless"
    };
    const updated = [newLog, ...sleepLogs].slice(0, 7); // keep last 7 logs
    saveSleepLogs(updated);

    triggerPointsReward(15, `Log Sleep Tracker target achieved!`);
  };

  // Increment water
  const handleAddWaterCup = () => {
    const nextWater = Math.min(waterCups + 1, 12);
    setWaterCups(nextWater);
    localStorage.setItem("Mental Health Care-water-today", String(nextWater));

    if (nextWater === 8) {
      triggerPointsReward(20, `Congratulations! Hydration goal achieved (8 cups logged).`);
    } else {
      playWaterAudio();
    }
  };

  const handleResetWater = () => {
    setWaterCups(0);
    localStorage.setItem("Mental Health Care-water-today", "0");
  };

  // Sound generator simulator
  const playWaterAudio = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5 node
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // Slide upward representing bubble/splash
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {}
  };

  // Complete habit
  const toggleHabit = (idx: number) => {
    const updated = habits.map((h, i) => {
      if (i === idx) {
        const nextChecked = !h.checked;
        const nextStreak = nextChecked ? h.streak + 1 : Math.max(0, h.streak - 1);
        return { ...h, checked: nextChecked, streak: nextStreak };
      }
      return h;
    });
    saveHabits(updated);

    const targetH = updated[idx];
    if (targetH.checked) {
      triggerPointsReward(10, `Completed daily habit: ${targetH.name}`);
    }
  };

  // Affirmations rotation
  const nextAffirmation = () => {
    setAffirmationIdx((prev) => (prev + 1) % AFFIRMATIONS.length);
  };

  // Join or complete challenges
  const handleJoinChallenge = (id: string) => {
    const updated = challenges.map((ch) => {
      if (ch.id === id) return { ...ch, joined: true };
      return ch;
    });
    saveChallenges(updated);
  };

  const handleCompleteChallenge = (id: string, pts: number, title: string) => {
    const updated = challenges.map((ch) => {
      if (ch.id === id) return { ...ch, completed: true };
      return ch;
    });
    saveChallenges(updated);

    triggerPointsReward(pts, `Completed Wellness Challenge: ${title}!`);
  };

  const triggerPointsReward = (amount: number, message: string) => {
    setPointsEarnedMsg(`${message} (+${amount} XP)`);
    
    // Call server to add points
    if (user && token) {
      fetch("/api/gamification/meditate", { // use existing reward proxy
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(() => {
          fetch("/api/auth/me", { headers: { "Authorization": `Bearer ${token}` } })
            .then((res) => res.json())
            .then((userData) => {
              if (userData.id && onRefreshUser) onRefreshUser(userData);
            });
        })
        .catch(() => {});
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-16">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-block px-3 py-1 bg-[#E9EDC9] dark:bg-[#344E41]/30 border border-[#A3B18A]/30 text-[#344E41] dark:text-[#E9EDC9] text-xs font-bold tracking-wider rounded-lg uppercase">
          PHYSICAL WELLNESS INTEGRATION
        </div>
        <h1 className="font-serif font-light text-3xl sm:text-4xl text-[#344E41] dark:text-[#E9EDC9] tracking-tight">
          Wellness Trackers & Daily Routines
        </h1>
        <p className="text-sm text-[#6B705C] dark:text-[#A3B18A] max-w-2xl mx-auto font-sans">
          Sync your physiological habits. Maintain positive circadian clocks by checking off sleep cycles, water intake, daily reflections, and challenges.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (Sleep & Water) - 5 cols */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Daily Affirmations Card */}
          <div className="p-6 rounded-[32px] bg-[#344E41] text-white border border-[#588157]/40 shadow-sm relative overflow-hidden text-left space-y-4">
            <div className="flex justify-between items-center text-xs uppercase font-mono text-[#E9EDC9]">
              <span className="flex items-center gap-1"><Sparkles className="h-4 w-4 animate-pulse" /> Self-Reflection Affirmation</span>
              <span className="font-bold">Alpha Aura</span>
            </div>
            <p className="font-serif font-light italic text-base sm:text-lg leading-relaxed text-[#F4F1EA]">
              "{AFFIRMATIONS[affirmationIdx]}"
            </p>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-[#A3B18A] font-mono select-none">Daily Wisdom Generator</span>
              <button 
                onClick={nextAffirmation}
                className="py-1.5 px-3 bg-white/10 hover:bg-white/15 text-[#E9EDC9] rounded-lg text-[11px] font-sans font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Compass className="h-3.5 w-3.5" /> Next Quote
              </button>
            </div>
          </div>

          {/* Water Hydration Tracker */}
          <div className="p-6 rounded-[32px] bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] shadow-sm space-y-5 text-left">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif font-bold text-base text-[#344E41] dark:text-[#E9EDC9] flex items-center gap-1.5">
                  <Droplet className="h-5 w-5 text-sky-502 animate-bounce fill-sky-200" />
                  <span>Hydration Intake</span>
                </h3>
                <p className="text-xs text-[#6B705C] dark:text-[#A3B18A]">Goal: 8 glasses daily (about 2 litres)</p>
              </div>
              <button 
                onClick={handleResetWater} 
                className="text-[10px] text-rose-500 hover:underline font-mono"
              >
                Reset
              </button>
            </div>

            {/* Cups visual elements grid */}
            <div className="grid grid-cols-4 gap-3 bg-[#F4F1EA]/55 dark:bg-[#1E2421]/60 p-4 rounded-2xl border border-[#E8E4D9]/60 dark:border-[#344E41]/70">
              {Array.from({ length: 8 }).map((_, id) => {
                const filled = waterCups > id;
                return (
                  <button
                    key={id}
                    onClick={handleAddWaterCup}
                    className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                      filled 
                        ? "bg-sky-50 dark:bg-sky-950/25 border-sky-300 text-sky-600 scale-102"
                        : "bg-white dark:bg-[#252C28] border-slate-200 text-slate-300 dark:border-slate-800"
                    }`}
                  >
                    <Droplet className={`h-5 w-5 ${filled ? "fill-sky-400 text-sky-500" : "text-slate-300"}`} />
                    <span className="text-[9px] font-mono mt-1 font-bold">Cup {id + 1}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center bg-transparent">
              <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] font-medium font-sans">
                Status: logged <strong className="text-[#344E41] dark:text-sky-300 font-bold">{waterCups} / 8 cups</strong> today.
              </p>
              <button
                onClick={handleAddWaterCup}
                className="py-2 px-4 rounded-xl text-xs font-sans font-bold text-white bg-sky-500 hover:bg-sky-600 active:scale-95 duration-200 shadow flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Drink cup (+2 XP)
              </button>
            </div>
          </div>

          {/* Sleep Hours Log */}
          <div className="p-6 rounded-[32px] bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] shadow-sm space-y-4 text-left">
            <div>
              <h3 className="font-serif font-bold text-base text-[#344E41] dark:text-[#E9EDC9] flex items-center gap-1.5">
                <Moon className="h-5 w-5 text-indigo-500" />
                <span>Circadian Sleep Log</span>
              </h3>
              <p className="text-xs text-[#6B705C] dark:text-[#A3B18A]">Track nocturnal sleep quality and target averages.</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#6B705C] dark:text-[#A3B18A] font-mono">Rest Hours:</span>
                <span className="text-sm font-serif font-bold text-[#344E41] dark:text-[#E9EDC9] bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-md border border-indigo-250/20">{sleepHours} Hours</span>
              </div>
              <input
                type="range"
                min={3}
                max={12}
                value={sleepHours}
                onInput={(e: any) => setSleepHours(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <button
              onClick={handleLogSleep}
              className="w-full py-2 bg-[#344E41] hover:bg-[#2A3F34] text-white text-xs font-bold font-sans rounded-xl cursor-pointer"
            >
              Log Sleep Duration (+15 XP)
            </button>

            {/* Last 3 sleep logs visual list */}
            {sleepLogs.length > 0 && (
              <div className="pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <p className="font-mono text-[9px] text-[#A3B18A] uppercase font-bold">Sleep Logs History</p>
                <div className="grid grid-cols-3 gap-2">
                  {sleepLogs.slice(0, 3).map((log, i) => (
                    <div key={i} className="bg-[#F4F1EA] dark:bg-[#1E2421] p-2.5 rounded-xl border border-slate-200/50 text-center font-mono">
                      <p className="text-[10px] text-slate-400">{log.date}</p>
                      <p className="font-bold font-serif text-[#344E41] dark:text-[#E9EDC9] text-sm">{log.hours}h</p>
                      <span className="text-[8px] block text-indigo-500 font-sans font-black uppercase mt-0.5">{log.quality}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (Habits & Wellness Challenges) - 7 cols */}
        <div id="wellness-habits-column" className="lg:col-span-7 space-y-6">
          
          {/* Healthy Habits Checklist */}
          <div className="p-6 rounded-[32px] bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] shadow-sm space-y-4 text-left">
            <div>
              <h3 className="font-serif font-bold text-base text-[#344E41] dark:text-[#E9EDC9] flex items-center gap-1.5">
                <CheckSquare className="h-5 w-5 text-emerald-500" />
                <span>Healthy Daily Habits Tracker</span>
              </h3>
              <p className="text-xs text-[#6B705C] dark:text-[#A3B18A]">Consistency is key. Tap a habit to check it done and increment streak loops.</p>
            </div>

            <div className="space-y-2.5">
              {habits.map((h, i) => (
                <div 
                  key={i}
                  className={`p-4 rounded-2xl border transition-all flex justify-between items-center ${
                    h.checked 
                      ? "bg-emerald-50/40 border-emerald-300 dark:bg-emerald-950/15" 
                      : "bg-[#F4F1EA]/65 border-[#E8E4D9] dark:bg-[#1E2421] hover:bg-[#E9EDC9]/10"
                  }`}
                >
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={h.checked}
                      onChange={() => toggleHabit(i)}
                      className="rounded border-[#E8E4D9] text-emerald-500 focus:ring-emerald-450 h-4.5 w-4.5"
                    />
                    <span className={`text-xs sm:text-sm font-sans font-black ${h.checked ? "line-through text-slate-400" : "text-[#344E41] dark:text-[#E9EDC9]"}`}>
                      {h.name}
                    </span>
                  </label>
                  
                  <div className="flex items-center space-x-1.5 bg-white dark:bg-[#101412] px-2.5 py-1 rounded-full border border-slate-150">
                    <Flame className="h-3.5 w-3.5 text-orange-500 animate-pulse fill-orange-200" />
                    <span className="font-mono text-[10px] text-slate-500 font-bold">{h.streak}d Streak</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Wellness Challenges Hub */}
          <div className="p-6 rounded-[32px] bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] shadow-sm space-y-4 text-left">
            <div>
              <h3 className="font-serif font-bold text-base text-[#344E41] dark:text-[#E9EDC9] flex items-center gap-1.5">
                <Trophy className="h-5 w-5 text-[#A3B18A] animate-bounce" />
                <span>Dynamic Challenges Hub</span>
              </h3>
              <p className="text-xs text-[#6B705C] dark:text-[#A3B18A]">Commit to mini structured clinical tasks and earn direct mental profile XP.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenges.map((ch) => (
                <div 
                  key={ch.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                    ch.completed 
                      ? "bg-slate-50 dark:bg-[#1E2421] border-slate-200/60 opacity-60" 
                      : "bg-[#F4F1EA]/65 dark:bg-[#1E2421]/90 border-[#E8E4D9] dark:border-[#344E41]"
                  }`}
                >
                  <div className="space-y-1 block">
                    <div className="flex justify-between items-start">
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-[#344E41] dark:text-[#E9EDC9]">{ch.title}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black bg-[#E9EDC9] text-[#344E41]">{ch.points} XP</span>
                    </div>
                    <p className="text-[11px] text-[#6B705C] dark:text-[#A3B18A] leading-relaxed">{ch.desc}</p>
                  </div>

                  <div className="pt-2">
                    {ch.completed ? (
                      <span className="text-[10px] text-emerald-600 font-mono font-bold flex items-center justify-center gap-1 bg-emerald-55/40 p-1 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-emerald-500" /> Challenge Completed
                      </span>
                    ) : ch.joined ? (
                      <button
                        onClick={() => handleCompleteChallenge(ch.id, ch.points, ch.title)}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold font-sans rounded-lg cursor-pointer"
                      >
                        Claim complete!
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinChallenge(ch.id)}
                        className="w-full py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-[#E9EDC9] hover:text-[#344E41] text-slate-650 dark:text-[#A3B18A] text-[11px] font-bold font-sans rounded-lg cursor-pointer transition-colors"
                      >
                        Commit to Challenge
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Reward Toast */}
      {pointsEarnedMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#252C28] text-white border border-[#344E41] shadow-2xl animate-slideUp flex items-center space-x-3 font-sans max-w-sm">
          <div className="p-2 bg-[#588157] text-[#E9EDC9] rounded-xl shrink-0 animate-pulse">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Reward Cleared!</p>
            <p className="text-[10px] text-[#A3B18A]">{pointsEarnedMsg}</p>
          </div>
          <button 
            onClick={() => setPointsEarnedMsg(null)}
            className="text-[10px] text-[#6B705C] hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

    </div>
  );
}
