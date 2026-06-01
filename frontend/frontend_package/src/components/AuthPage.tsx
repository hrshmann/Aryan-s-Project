/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Lock, 
  Mail, 
  UserPlus, 
  LogIn, 
  User, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle,
  HelpCircle,
  Clock,
  ArrowRight
} from "lucide-react";

interface AuthPageProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"User" | "Therapist" | "Admin">("User");
  const [age, setAge] = useState<number>(25);

  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");
    
    if (!email || !password) {
      setErrorText("Email and password fields are required.");
      return;
    }

    if (!isLogin && !name) {
      setErrorText("Please state your name to register.");
      return;
    }

    setIsLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin 
      ? { email, password }
      : { name, email, password, role, age };

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.error || "Authentication request rejected.");
          });
        }
        return res.json();
      })
      .then((data) => {
        if (data.token && data.user) {
          setSuccessText(isLogin ? "Login approved! Rebuilding session..." : "Registration secure! Syncing profile details...");
          setTimeout(() => {
            onLoginSuccess(data.token, data.user);
          }, 600);
        } else {
          throw new Error("Invalid server token exchange format.");
        }
      })
      .catch((err: any) => {
        setErrorText(err.message || "Connection failure. Verify credentials.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* LEFT COLUMN: Peaceful mental motivation */}
        <div className="lg:col-span-6 space-y-6 text-left hidden lg:block">
          <div className="inline-flex items-center space-x-2 bg-[#E9EDC9] dark:bg-[#344E41]/35 border border-[#A3B18A]/50 text-[#344E41] dark:text-[#E9EDC9] px-3 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles className="h-4 w-4 animate-pulse text-[#588157]" />
            <span>Secure Clinical Gateways</span>
          </div>

          <h2 className="font-serif font-light tracking-tight text-3xl sm:text-4xl text-[#344E41] dark:text-[#E9EDC9] leading-tight">
            Claim Your Sanctuary Space inside Mental Health Care
          </h2>

          <p className="text-[#6B705C] dark:text-[#A3B18A] leading-relaxed font-sans text-sm sm:text-base">
            Establishing a complimentary Mental Health Care account unlocks real-time clinical mood metrics, aggregates therapeutic self-care achievements, archives doctor bookings, and securely retains session history protected in sandboxed datastores.
          </p>

          <div className="space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className="h-10 w-10 shrink-0 bg-[#E9EDC9] dark:bg-[#344E41]/35 text-[#344E41] dark:text-[#E9EDC9] rounded-xl flex items-center justify-center border border-[#A3B18A]/50">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="space-y-0.5 text-left">
                <h4 className="font-serif font-semibold text-sm text-[#344E41] dark:text-[#E9EDC9]">Gamified Wellness Achievements</h4>
                <p className="text-xs text-[#6B705C] leading-relaxed dark:text-[#A3B18A]">Awarded points (+15, +20, +25) for checking-in daily and meditating.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="h-10 w-10 shrink-0 bg-[#F4F1EA] dark:bg-[#1E2421] text-[#6B705C] dark:text-[#A3B18A] rounded-xl flex items-center justify-center border border-[#E8E4D9]">
                <Clock className="h-5 w-5 animate-pulse" />
              </div>
              <div className="space-y-0.5 text-left">
                <h4 className="font-serif font-semibold text-sm text-[#344E41] dark:text-[#E9EDC9] font-sans">Active Scheduler Archives</h4>
                <p className="text-xs text-[#6B705C] leading-relaxed dark:text-[#A3B18A]">Lock, review, and confirm direct therapy slots with licensed practitioners.</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Form module */}
        <div className="lg:col-span-6 max-w-md w-full mx-auto" id="auth-form-card">
          <div className="p-6 sm:p-8 rounded-[32px] bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] shadow-sm space-y-6">
            
            {/* Header Switcher */}
            <div className="text-center space-y-2">
              <h3 className="font-serif font-semibold text-xl text-[#344E41] dark:text-[#E9EDC9] tracking-tight">
                {isLogin ? "Log In to Your Haven" : "Register Wellness Account"}
              </h3>
              <p className="text-xs text-[#6B705C] dark:text-[#A3B18A]">
                {isLogin ? "Ready to track those wellness gains? Log in!" : "Enter details below to create your secure clinical schemas."}
              </p>
            </div>

            {/* Notifications panel */}
            {errorText && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-xs text-rose-750 dark:text-rose-450 border border-rose-100 dark:border-rose-900/40 font-bold flex items-center space-x-2">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                <span>{errorText}</span>
              </div>
            )}

            {successText && (
              <div className="p-3.5 rounded-xl bg-[#E9EDC9] dark:bg-[#344E41]/35 text-xs text-[#344E41] dark:text-[#E9EDC9] border border-[#A3B18A]/30 font-bold flex items-center space-x-2">
                <CheckCircle className="h-4.5 w-4.5 shrink-0 animate-bounce text-[#588157]" />
                <span>{successText}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name field (Signup only) */}
              {!isLogin && (
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs uppercase font-mono text-[#6B705C] dark:text-[#A3B18A] font-bold">Your Full Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Alex Rivers"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F4F1EA] dark:bg-[#1E2421] border border-[#E8E4D9] dark:border-[#344E41] rounded-xl text-xs sm:text-sm text-[#344E41] dark:text-[#E9EDC9] focus:outline-none focus:ring-1 focus:ring-[#588157]"
                    id="auth-register-name"
                  />
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs uppercase font-mono text-[#6B705C] dark:text-[#A3B18A] font-bold">Clinical Email Address:</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A3B18A]" />
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F4F1EA] dark:bg-[#1E2421] border border-[#E8E4D9] dark:border-[#344E41] rounded-xl text-xs sm:text-sm text-[#344E41] dark:text-[#E9EDC9] focus:outline-none focus:ring-1 focus:ring-[#588157] font-mono"
                    id="auth-email-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs uppercase font-mono text-[#6B705C] dark:text-[#A3B18A] font-bold">Master Password:</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A3B18A]" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F4F1EA] dark:bg-[#1E2421] border border-[#E8E4D9] dark:border-[#344E41] rounded-xl text-xs sm:text-sm text-[#344E41] dark:text-[#E9EDC9] focus:outline-none focus:ring-1 focus:ring-[#588157]"
                    id="auth-password-input"
                  />
                </div>
              </div>

              {/* Role & Age selectors (Signup only) */}
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Role Selector dropdown */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs uppercase font-mono text-[#6B705C] dark:text-[#A3B18A] font-bold">Schema Role:</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-[#F4F1EA] dark:bg-[#1E2421] border border-[#E8E4D9] dark:border-[#344E41] rounded-xl text-xs sm:text-sm text-[#344E41] dark:text-[#E9EDC9] focus:outline-none"
                      id="auth-role-select"
                    >
                      <option value="User">User / Patient</option>
                      <option value="Therapist">Licensed Therapist</option>
                      <option value="Admin">Clinical Admin</option>
                    </select>
                  </div>

                  {/* Age Input */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs uppercase font-mono text-[#6B705C] dark:text-[#A3B18A] font-bold">Your Age:</label>
                    <input
                      type="number"
                      required
                      min={16}
                      max={110}
                      value={age}
                      onChange={(e) => setAge(parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 bg-[#F4F1EA] dark:bg-[#1E2421] border border-[#E8E4D9] dark:border-[#344E41] rounded-xl text-xs sm:text-sm text-[#344E41] dark:text-[#E9EDC9] focus:outline-none"
                      id="auth-age-select"
                    />
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#344E41] hover:bg-[#2A3F34] text-white font-serif font-semibold text-xs rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all text-center flex items-center justify-center space-x-1.5 cursor-pointer"
                id="auth-form-submit"
              >
                {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                <span>{isLoading ? "Vetting..." : isLogin ? "Secure Login" : "Vet Account"}</span>
              </button>

              {/* Quick toggle link */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrorText("");
                    setSuccessText("");
                  }}
                  className="text-xs text-[#6B705C] hover:text-[#588157] dark:text-[#A3B18A] dark:hover:text-[#E9EDC9] font-serif font-semibold underline focus:outline-none focus:ring-0 cursor-pointer"
                  id="auth-toggle-state"
                >
                  {isLogin 
                    ? "New to Mental Health Care? Create an account here →" 
                    : "Already registered with us? Log in here →"}
                </button>
              </div>

              {/* Secure Testing Credentials Assistant */}
              <div className="mt-6 pt-5 border-t border-[#E8E4D9]/60 dark:border-[#344E41]/45 text-left space-y-3">
                <div className="flex items-center space-x-2 text-[#588157] dark:text-[#E9EDC9]">
                  <Sparkles className="h-4 w-4 animate-spin-slow" />
                  <span className="text-[11px] font-sans font-bold uppercase tracking-wider">Demo / Sandbox Admin & Doctor Keys</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  {/* Admin profile */}
                  <div className="p-2.5 rounded-xl bg-[#F4F1EA]/70 dark:bg-[#1E2421]/60 border border-[#E8E4D9] dark:border-[#344E41] space-y-1">
                    <p className="font-serif font-bold text-[#344E41] dark:text-[#E9EDC9] flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-violet-500"></span> Clinical Admin
                    </p>
                    <div className="font-mono text-[10px] text-[#6B705C] dark:text-[#A3B18A] space-y-0.5">
                      <p className="select-all">Email: admin@Mental Health Care.org</p>
                      <p>Pass: admin123</p>
                    </div>
                  </div>

                  {/* Doctor/Therapist profile */}
                  <div className="p-2.5 rounded-xl bg-[#F4F1EA]/70 dark:bg-[#1E2421]/60 border border-[#E8E4D9] dark:border-[#344E41] space-y-1">
                    <p className="font-serif font-bold text-[#344E41] dark:text-[#E9EDC9] flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Therapist Doctor
                    </p>
                    <div className="font-mono text-[10px] text-[#6B705C] dark:text-[#A3B18A] space-y-0.5">
                      <p className="select-all">Email: alisha.specialist@Mental Health Care.org</p>
                      <p>Pass: therapist123</p>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-[#6B705C] dark:text-[#A3B18A] italic">
                  Note: Patient accounts are generated dynamically. Choose <strong>User / Patient</strong> from the register dropdown to track your own wellness stats!
                </p>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
