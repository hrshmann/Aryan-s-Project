/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Heart, 
  Wind, 
  Play, 
  Square, 
  CheckCircle, 
  Trophy, 
  Sparkles, 
  Volume2, 
  VolumeX,
  Compass,
  Smile,
  Zap,
  Info
} from "lucide-react";
import { User } from "../types";
import { namedImageDataUri } from "../utils/namedImage";
import rainAudio from "../audio/rain.mp3";
import sleepAudio from "../audio/sleep.mp3";
import stressAudio from "../audio/stress.mp3";

interface SelfCareProps {
  user: User | null;
  onRefreshUser: (updatedUser: any) => void;
  token: string | null;
}

interface MeditationTrack {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  image: string;
  imageFallback: string;
  audioSrc: string;
}

const AMBIENT_VOLUME = 0.55;

const MEDITATION_TRACKS: MeditationTrack[] = [
  {
    id: "track-1",
    title: "Guided Panic Release",
    description: "An intensive clinical mindfulness sequence to slow rapid heart flutters and quiet frantic loops.",
    duration: "5 min",
    category: "Anxiety",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=300",
    imageFallback: namedImageDataUri("Guided Panic Release", "breath pacing", ["#344E41", "#5E548E", "#E6E1F9"]),
    audioSrc: stressAudio
  },
  {
    id: "track-2",
    title: "Sylvan Rain & Singing Bowls",
    description: "Gentle natural rain patterns mixed with high-frequency Tibetan metallic frequencies to clear cerebral blockages.",
    duration: "10 min",
    category: "Sleep",
    image: "https://plus.unsplash.com/premium_photo-1661397087554-2774b7e7332f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c2xlZXB8ZW58MHx8MHx8fDA%3D",
    imageFallback: namedImageDataUri("Sylvan Rain", "singing bowls", ["#1E3A5F", "#5F8EA8", "#E9EDC9"]),
    audioSrc: rainAudio
  },
  {
    id: "track-3",
    title: "CBT Body Scanning",
    description: "Consciously release stored micro-tensions traveling in your jaw, neck, and shoulder architectures.",
    duration: "8 min",
    category: "Stress Management",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=300",
    imageFallback: namedImageDataUri("CBT Body Scanning", "jaw neck shoulders", ["#344E41", "#A3B18A", "#F4F1EA"]),
    audioSrc: sleepAudio
  }
];

export default function SelfCare({ user, onRefreshUser, token }: SelfCareProps) {
  // Breathing coach states
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Pause">("Inhale");
  const [secondsRemaining, setSecondsRemaining] = useState(4); // Box cycles (4, 4, 4, 4)
  const [completionProgress, setCompletionProgress] = useState(0); // Progress towards claiming 25 XP
  const [meditationAwarded, setMeditationAwarded] = useState(false);

  // Sound generator states
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [volumeMuted, setVolumeMuted] = useState(false);

  // Gamification reward details
  const [pointsCelebration, setPointsCelebration] = useState<string | null>(null);

  // Sound ref to simulate continuous audio vibes using Web Audio API
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorNodeRef = useRef<OscillatorNode | null>(null);
  const modulatorNodeRef = useRef<OscillatorNode | null>(null);
  const rainNoiseRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const stopCurrentAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.onended = null;
      audioElementRef.current.onerror = null;
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      audioElementRef.current = null;
    }
  };

  // Box Breathing cycle coordinates:
  // Inhale 4s -> Hold 4s -> Exhale 4s -> Pause 4s
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (breathingActive) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Shift box phase
            setBreathPhase((currPhase) => {
              switch (currPhase) {
                case "Inhale":
                  playWarmTone(293.66); // D4 note
                  return "Hold";
                case "Hold":
                  playWarmTone(329.63); // E4 note
                  return "Exhale";
                case "Exhale":
                  playWarmTone(261.63); // C4 note
                  return "Pause";
                case "Pause":
                  // Increment progress counter toward meditation badge
                  setCompletionProgress((prog) => {
                    const nextProg = prog + 12.5; // Needs 8 completed phases to hit 100% (roughly 1 minute)
                    if (nextProg >= 100) {
                      return 100;
                    }
                    return nextProg;
                  });
                  playWarmTone(349.23); // F4 note
                  return "Inhale";
              }
            });
            return 4; // Restart 4s countdown
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathPhase("Inhale");
      setSecondsRemaining(4);
    }

    return () => clearInterval(timer);
  }, [breathingActive]);

  // Clean ambient synthesizer shutdown
  useEffect(() => {
    return () => {
      shutdownSynthesizer();
    };
  }, []);

  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.muted = volumeMuted;
    }
  }, [volumeMuted]);

  // Soft hum synthesis to give REAL sensory audio feedback without external file links!
  const playWarmTone = (freq: number) => {
    if (volumeMuted) return;
    try {
      // Lazy init AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8); // gentle fadeout

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 2.0);
    } catch (e) {
      console.log("Audio synthesis blocked: ", e);
    }
  };

  // Start humming background ambient frequency (simulates white noise or soundscapes)
  const toggleAmbientVibe = (trackId: string) => {
    if (playingTrackId === trackId) {
      stopCurrentAudio();
      shutdownSynthesizer();
      setPlayingTrackId(null);
      return;
    }

    stopCurrentAudio();
    shutdownSynthesizer();
    setPlayingTrackId(trackId);

    const track = MEDITATION_TRACKS.find((item) => item.id === trackId);
    if (track?.audioSrc) {
      const audio = new Audio(track.audioSrc);
      audio.loop = true;
      audio.volume = AMBIENT_VOLUME;
      audio.muted = volumeMuted;
      audio.onerror = () => {
        console.log("Ambient audio file could not load. Falling back to generated sound.");
        triggerBackgroundHum(trackId);
      };
      audio.onended = () => {
        setPlayingTrackId(null);
        audioElementRef.current = null;
      };
      audioElementRef.current = audio;
      audio.play().catch((error) => {
        console.log("Ambient audio playback failed:", error);
        // Fallback to synthesized ambient hum if audio cannot play.
        triggerBackgroundHum(trackId);
      });
    } else {
      triggerBackgroundHum(trackId);
    }
  };

  const triggerBackgroundHum = (trackId: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      if (trackId === "track-1") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(110, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(165, ctx.currentTime + 4);
        filter.type = "lowpass";
        filter.frequency.value = 420;
        gain.gain.setValueAtTime(0.035, ctx.currentTime);
      } else if (trackId === "track-2") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(432, ctx.currentTime);
        filter.type = "bandpass";
        filter.frequency.value = 1200;
        gain.gain.setValueAtTime(0.024, ctx.currentTime);

        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i += 1) {
          noiseData[i] = (Math.random() * 2 - 1) * 0.22;
        }
        const rain = ctx.createBufferSource();
        const rainFilter = ctx.createBiquadFilter();
        const rainGain = ctx.createGain();
        rain.buffer = noiseBuffer;
        rain.loop = true;
        rainFilter.type = "highpass";
        rainFilter.frequency.value = 950;
        rainGain.gain.setValueAtTime(0.018, ctx.currentTime);
        rain.connect(rainFilter);
        rainFilter.connect(rainGain);
        rainGain.connect(ctx.destination);
        rain.start();
        rainNoiseRef.current = rain;
      } else {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(196, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(174.61, ctx.currentTime + 6);
        filter.type = "lowpass";
        filter.frequency.value = 560;
        gain.gain.setValueAtTime(0.032, ctx.currentTime);
      }

      const oscMod = ctx.createOscillator();
      const gainMod = ctx.createGain();
      oscMod.frequency.value = trackId === "track-2" ? 0.08 : 0.25;
      gainMod.gain.value = trackId === "track-2" ? 6 : 15;

      oscMod.connect(gainMod);
      gainMod.connect(osc.frequency);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      oscMod.start();
      osc.start();

      oscillatorNodeRef.current = osc;
      modulatorNodeRef.current = oscMod;
      gainNodeRef.current = gain;
    } catch (e) {
      console.log("Vibe simulation failure: ", e);
    }
  };

  const shutdownSynthesizer = () => {
    try {
      if (oscillatorNodeRef.current) {
        oscillatorNodeRef.current.stop();
        oscillatorNodeRef.current.disconnect();
        oscillatorNodeRef.current = null;
      }
      if (modulatorNodeRef.current) {
        modulatorNodeRef.current.stop();
        modulatorNodeRef.current.disconnect();
        modulatorNodeRef.current = null;
      }
      if (rainNoiseRef.current) {
        rainNoiseRef.current.stop();
        rainNoiseRef.current.disconnect();
        rainNoiseRef.current = null;
      }
      stopCurrentAudio();
    } catch (e) {}
  };

  const startBreathingCyle = () => {
    setBreathingActive(true);
    setMeditationAwarded(false);
    playWarmTone(261.63);
  };

  const stopBreathingCycle = () => {
    setBreathingActive(false);
  };

  const handleClaimMeditationPoints = () => {
    if (!token) {
      setPointsCelebration("You completed the session in Guest Mode! Please Sign In / Join Mental Health Care to save these achievements and stack points.");
      return;
    }

    fetch("/api/gamification/meditate", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Award error");
        return res.json();
      })
      .then((data) => {
        setPointsCelebration(data.milestoneUnlocked || `Meditation reward unlocked! +${data.pointsEarned} points.`);
        setMeditationAwarded(true);
        setCompletionProgress(0); // Reset state

        // Re-sync endpoints on navigation
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
      .catch((err) => console.log("Claim points error: ", err));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-16">
      
      {/* Head */}
      <div className="text-center space-y-3">
        <div className="inline-block px-3 py-1 bg-[#E9EDC9] dark:bg-[#344E41]/30 border border-[#A3B18A]/30 text-[#344E41] dark:text-[#E9EDC9] text-xs font-bold tracking-wider rounded-lg uppercase">
          SELF-CARE MEDITATION
        </div>
        <h1 className="font-serif font-light text-3xl sm:text-4xl text-[#344E41] dark:text-[#E9EDC9] tracking-tight">
          Somatic Guided Breathing & Ambient Audio
        </h1>
        <p className="text-sm text-[#6B705C] dark:text-[#A3B18A] max-w-2xl mx-auto font-sans">
          Lower cortisol levels immediately on demand. Regulate your nervous system with box-breathing and earn mental wellness points along the way.
        </p>
      </div>

      {/* Main Grid: Breathing on left, Music list on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* --- INTRATIVE BREATHING COACH (7 cols) --- */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-[32px] bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] shadow-sm space-y-8 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center space-x-2 text-[#344E41] dark:text-[#E9EDC9]">
                <Wind className="h-5 w-5 text-[#588157] rotate-18" />
                <h2 className="font-serif font-semibold text-base sm:text-lg">Interactive Somatic Breathing Box</h2>
              </div>
              
              <button 
                onClick={() => setVolumeMuted(!volumeMuted)}
                className="p-2 text-[#6B705C] hover:text-[#344E41] dark:hover:text-[#E9EDC9] transition-colors cursor-pointer"
                title={volumeMuted ? "Unmute bell signal" : "Mute bell signal"}
              >
                {volumeMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
            </div>
            <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] font-sans">
              Matches clinical box configurations: <b>Inhale 4s · Hold 4s · Exhale 4s · Rest 4s</b>.
            </p>
          </div>

          {/* Somatic central pulse bubble */}
          <div className="py-12 flex flex-col items-center justify-center space-y-6" id="somatic-breathing-stage">
            
            {/* Visual Pulsing circle with transition triggers */}
            <div className="relative flex items-center justify-center">
              
              {/* Expand background rings */}
              <div 
                className={`absolute rounded-full transition-all duration-[4000ms] ease-in-out bg-[#588157]/10 ${
                  breathingActive && (breathPhase === "Inhale" || breathPhase === "Hold")
                    ? "w-64 h-64 sm:w-72 sm:h-72 scale-110"
                    : "w-40 h-40 scale-90 opacity-40"
                }`}
              ></div>

              <div 
                className={`absolute rounded-full transition-all duration-[4000ms] ease-in-out bg-[#A3B18A]/10 ${
                  breathingActive && breathPhase === "Inhale"
                    ? "w-52 h-52 sm:w-60 sm:h-60 scale-125"
                    : "w-36 h-36 scale-95 opacity-50"
                }`}
              ></div>

              {/* Core interactive Circle */}
              <div 
                className={`rounded-full transition-all duration-[4500ms] cubic-bezier(0.4, 0, 0.2, 1) flex flex-col items-center justify-center text-center shadow-lg cursor-pointer ${
                  breathingActive && (breathPhase === "Inhale" || breathPhase === "Hold")
                    ? "w-44 h-44 sm:w-52 sm:h-52 bg-gradient-to-tr from-[#588157] to-[#8FA882] text-white scale-110 shadow-[#588157]/20"
                    : "w-36 h-36 bg-[#F4F1EA] dark:bg-[#1E2421] text-[#6B705C] dark:text-[#A3B18A] hover:bg-[#E9EDC9]/20 border border-[#E8E4D9] dark:border-[#344E41]"
                }`}
                onClick={breathingActive ? stopBreathingCycle : startBreathingCyle}
                id="breathing-circle-button"
              >
                {!breathingActive ? (
                  <div className="space-y-1">
                    <Play className="h-7 w-7 text-[#588157] dark:text-[#A3B18A] animate-pulse mx-auto" />
                    <span className="block text-xs font-sans font-bold">Start Breath</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="block text-xs uppercase tracking-widest font-mono font-bold animate-pulse text-white">
                      {breathPhase}
                    </span>
                    <span className="block text-3xl font-sans font-black">
                      {secondsRemaining}s
                    </span>
                    <span className="block text-[9px] uppercase tracking-wider text-[#E9EDC9] font-bold">
                      Box Breathing
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* Instruction prompts for active phase */}
            <div className="text-center h-12">
              {breathingActive ? (
                <p className="text-sm font-semibold text-[#344E41] dark:text-[#E9EDC9] italic transition-opacity">
                  {breathPhase === "Inhale" && "Breathe in deeply through your nose, expanding your stomach..."}
                  {breathPhase === "Hold" && "Hold your lungs full. Capture the positive oxygen charge..."}
                  {breathPhase === "Exhale" && "Eject all tension fully, sighing through your mouth..."}
                  {breathPhase === "Pause" && "Pause and balance before the subsequent cycle..."}
                </p>
              ) : (
                <p className="text-xs text-[#6B705C] dark:text-[#A3B18A]">
                  Tap the visual sphere above to begin your box respiration cycle.
                </p>
              )}
            </div>

          </div>

          {/* Gamification progress towards claiming meditational reward */}
          <div className="border-t border-[#E8E4D9] dark:border-[#344E41] pt-6 space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-sans font-bold text-[#6B705C]">Exercise Progress:</span>
              <span className="font-mono text-[#588157] dark:text-[#A3B18A] font-bold">{Math.round(completionProgress)}%</span>
            </div>

            <div className="relative w-full h-3 bg-[#F4F1EA] dark:bg-[#1E2421] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#A3B18A] to-[#588157] transition-all duration-500" 
                style={{ width: `${completionProgress}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center space-x-1 text-[#6B705C] dark:text-[#A3B18A] text-[11px]">
                <Info className="h-3.5 w-3.5" />
                <span>Meditate for 1 min to earn +25 XP</span>
              </div>
              
              <button
                onClick={handleClaimMeditationPoints}
                disabled={completionProgress < 100 || meditationAwarded}
                className={`py-2 px-5 font-sans font-black text-xs rounded-xl shadow-md transition-all flex items-center space-x-1 text-white bg-[#344E41] hover:bg-[#2A3F34] active:scale-95 duration-200 ${
                  completionProgress < 100 || meditationAwarded
                    ? "opacity-40 cursor-not-allowed bg-[#E8E4D9] dark:bg-[#1E2421] text-[#6B705C] dark:text-[#A3B18A] shadow-none"
                    : "cursor-pointer"
                }`}
                id="claim-meditation-points"
              >
                <Trophy className="h-4.5 w-4.5" />
                <span>{meditationAwarded ? "Claimed" : "Claim +25 XP"}</span>
              </button>
            </div>
            
            {!token && (
              <p className="text-[10px] text-center text-slate-400 italic">
                You are playing in Guest mode. Complete registration to stack these milestones!
              </p>
            )}
          </div>
        </div>

        {/* --- RIGHT COL: CHOSEN AUDIOS & EXERCISES (5 cols) --- */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-[32px] bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] shadow-sm space-y-4">
            <div>
              <h3 className="font-serif font-semibold text-base text-[#344E41] dark:text-[#E9EDC9]">Care Ambient Audio</h3>
              <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] font-sans"></p>
            </div>

            <div className="space-y-4" id="ambient-tracks-grid">
              {MEDITATION_TRACKS.map((track) => {
                const isPlaying = playingTrackId === track.id;
                return (
                  <div 
                    key={track.id} 
                    className={`p-4 rounded-2xl border transition-all flex justify-between items-center gap-4 ${
                      isPlaying 
                        ? "bg-[#E9EDC9]/35 dark:bg-[#344E41]/30 border-[#A3B18A]/50"
                        : "bg-[#F4F1EA]/45 dark:bg-[#1E2421] border-[#E8E4D9] dark:border-[#344E41]/60 hover:bg-[#E9EDC9]/10"
                    }`}
                  >
                    <div className="flex items-center space-x-3 text-left">
                      <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-slate-300 shrink-0">
                        <img 
                          src={track.image} 
                          alt={track.title}
                          onError={(event) => {
                            event.currentTarget.src = track.imageFallback;
                          }}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {isPlaying && (
                          <div className="absolute inset-0 bg-[#344E41]/75 flex items-center justify-center animate-pulse">
                            <span className="w-1.5 h-6 bg-[#E9EDC9] rounded mx-0.5"></span>
                            <span className="w-1.5 h-4 bg-[#E9EDC9] rounded mx-0.5"></span>
                            <span className="w-1.5 h-5 bg-[#E9EDC9] rounded mx-0.5"></span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 block text-left">
                        <span className="text-[9px] font-mono inline-block uppercase bg-[#E9EDC9] dark:bg-[#344E41] text-[#588157] dark:text-[#A3B18A] px-2 py-0.5 rounded-full font-bold">
                          {track.category}
                        </span>
                        <h4 className="font-serif font-bold text-xs text-[#344E41] dark:text-[#E9EDC9]">{track.title}</h4>
                        <p className="text-[10px] text-[#6B705C] dark:text-[#A3B18A] line-clamp-1 leading-snug">{track.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleAmbientVibe(track.id)}
                      className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 shadow transition-transform active:scale-90 cursor-pointer ${
                        isPlaying 
                          ? "bg-[#588157] text-[#FDFBF7]" 
                          : "bg-white dark:bg-[#1E2421] text-[#344E41] dark:text-[#E9EDC9] hover:bg-[#F4F1EA]"
                      }`}
                      id={`play-vibe-${track.id}`}
                      aria-label={isPlaying ? `Stop ${track.title}` : `Play ${track.title}`}
                    >
                      {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    </button>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Slogan card */}
          <div className="p-6 rounded-[32px] bg-[#344E41] text-[#FDFBF7] space-y-4">
            <h4 className="font-serif font-bold text-base flex items-center space-x-1.5">
              <Sparkles className="h-5 w-5 text-[#E9EDC9] animate-spin-slow" />
              <span>Solfeggio Resonance frequencies</span>
            </h4>
            <p className="text-xs text-[#A3B18A] leading-relaxed font-sans">
              These sessions use your bundled care audio files, with a soft generated fallback available when a browser blocks playback.
            </p>
          </div>
        </div>

      </div>

      {/* points reward notifications */}
      {pointsCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="p-6 sm:p-8 rounded-[32px] bg-[#FDFBF7] dark:bg-[#1A1F1C] border border-[#E8E4D9] dark:border-[#344E41] text-center space-y-4 max-w-sm w-full shadow-2xl relative">
            <div className="mx-auto h-16 w-16 bg-[#588157] text-[#FDFBF7] rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Zap className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif font-medium text-lg text-[#344E41] dark:text-[#E9EDC9]">Mindfulness Unlocked!</h3>
              <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] font-sans">You scored 25 Self-Care points for deep breathing.</p>
            </div>

            <p className="text-xs text-[#344E41] dark:text-[#E9EDC9] italic bg-[#F4F1EA] dark:bg-[#202724] p-3 rounded-xl border border-[#E8E4D9] dark:border-[#344E41]">
              "{pointsCelebration}"
            </p>

            <button
              onClick={() => setPointsCelebration(null)}
              className="w-full py-3 bg-[#344E41] hover:bg-[#2A3F34] text-white font-sans font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
            >
              Continue Breathing
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
