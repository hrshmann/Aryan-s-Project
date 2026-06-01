/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Sun, 
  Moon, 
  LogOut, 
  LogIn, 
  Trophy, 
  Menu, 
  X, 
  Shield, 
  Heart, 
  Sparkles,
  Award,
  Cog,
  Globe,
  Bell,
  Languages,
  CheckCircle
} from "lucide-react";
import { User } from "../types";

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Header({
  user,
  onLogout,
  activeTab,
  setActiveTab,
  darkMode,
  toggleDarkMode
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Custom states for PWA simulation, push alerts, translation, and accessibility
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en"); // en, es, fr, hi
  const [activeContrast, setActiveContrast] = useState(false);
  const [localZoom, setLocalZoom] = useState("standard"); // standard, large, ultra

  // Alert toggles
  const [remindersOn, setRemindersOn] = useState(true);
  const [pushOn, setPushOn] = useState(false);

  // Multilingual dynamic translation lookup
  const TRANSLATIONS: { [key: string]: { [key: string]: string } } = {
    en: {
      "Home & Blogs": "Home & Blogs",
      "Consult Specialists": "Consult Specialists",
      "Mood Analytics": "Mood/AI Analytics",
      "Meditation & Breathing": "Core Self-Care",
    },
    es: {
      "Home & Blogs": "Inicio y Recursos",
      "Consult Specialists": "Especialistas Clínicos",
      "Mood Analytics": "Analítica de Ánimo",
      "Meditation & Breathing": "Respiración Guiada",
    },
    fr: {
      "Home & Blogs": "Accueil & Blogs",
      "Consult Specialists": "Consulter les Spécialistes",
      "Mood Analytics": "Analyse d'Humeur",
      "Meditation & Breathing": "Méditation & Respiration",
    },
    hi: {
      "Home & Blogs": "होम और ब्लॉग",
      "Consult Specialists": "विशेषज्ञों से परामर्श",
      "Mood Analytics": "मनोदशा विश्लेषण",
      "Meditation & Breathing": "ध्यान और साँस",
    }
  };

  Object.assign(TRANSLATIONS.en, {
    "Consult Specialists": "Book Indian Specialists",
  });
  TRANSLATIONS.hi = {
    "Home & Blogs": "Home aur Blogs",
    "Consult Specialists": "Visheshagya Paramarsh",
    "Mood Analytics": "Mood Vishleshan",
    "Meditation & Breathing": "Dhyan aur Saans",
  };

  const translateLabel = (txt: string) => {
    return TRANSLATIONS[currentLang]?.[txt] || txt;
  };

  const navItems = [
    { id: "home", label: translateLabel("Home & Blogs") },
    { id: "therapists", label: translateLabel("Consult Specialists") },
    { id: "mood", label: translateLabel("Mood Analytics") },
    { id: "care", label: translateLabel("Meditation & Breathing") },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  // Set accessibility body styles
  React.useEffect(() => {
    if (activeContrast) {
      document.body.style.filter = "contrast(1.22) saturate(1.1)";
    } else {
      document.body.style.filter = "";
    }
  }, [activeContrast]);

  React.useEffect(() => {
    if (localZoom === "ultra") {
      document.documentElement.style.fontSize = "17px";
    } else if (localZoom === "large") {
      document.documentElement.style.fontSize = "15.5px";
    } else {
      document.documentElement.style.fontSize = "14px";
    }
  }, [localZoom]);

  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur-md bg-[#FDFBF7]/80 dark:bg-[#1A1F1C]/80 border-[#E8E4D9] dark:border-[#344E41] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Slogan */}
          <div 
            onClick={() => handleTabChange("home")} 
            className="flex items-center space-x-2 cursor-pointer group"
            id="brand-logo"
          >
            <div className="p-2 rounded-full bg-[#A3B18A] text-white group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="font-serif font-semibold tracking-tight text-xl text-[#344E41] dark:text-[#E9EDC9]">
                Mental Health Care
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1 lg:space-x-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  activeTab === item.id
                    ? "bg-[#E9EDC9]/80 dark:bg-[#344E41]/60 text-[#344E41] dark:text-[#E9EDC9] border border-[#A3B18A]/50"
                    : "text-[#6B705C] dark:text-[#A3B18A] hover:bg-[#F4F1EA] dark:hover:bg-[#202724]"
                }`}
                id={`nav-tab-${item.id}`}
              >
                {item.label}
              </button>
            ))}
            
            {/* Conditional Roles dashboards */}
            {user && user.role === "Admin" && (
              <button
                onClick={() => handleTabChange("admin")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
                  activeTab === "admin"
                    ? "bg-[#E6E1F9] dark:bg-[#5E548E]/50 text-[#5E548E] dark:text-[#E6E1F9] border border-[#5E548E]/40"
                    : "text-[#6B705C] dark:text-[#A3B18A] hover:bg-[#F4F1EA] dark:hover:bg-[#202724]"
                }`}
                id="nav-tab-admin"
              >
                <Shield className="h-4 w-4" />
                <span>Admin Hub</span>
              </button>
            )}

            {user && user.role === "Therapist" && (
              <button
                onClick={() => handleTabChange("admin")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
                  activeTab === "admin"
                    ? "bg-[#E9EDC9] dark:bg-[#588157]/50 text-[#344E41] dark:text-[#E9EDC9] border border-[#A3B18A]/40"
                    : "text-[#6B705C] dark:text-[#A3B18A] hover:bg-[#F4F1EA] dark:hover:bg-[#202724]"
                }`}
                id="nav-tab-therapist"
              >
                <Award className="h-4 w-4" />
                <span>Practitioner Hub</span>
              </button>
            )}
          </nav>

          {/* User Gamification & controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Gamification Points Indicator */}
            {user && (
              <div 
                onClick={() => handleTabChange("care")}
                className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-[#588157] to-[#A3B18A] dark:from-[#344E41] dark:to-[#588157] text-white px-3 py-1.5 rounded-full cursor-pointer hover:shadow-lg transition-all active:scale-95 duration-200"
                title="Your Gamification Wellness Points and Level"
                id="header-gamification-pill"
              >
                <Trophy className="h-4 w-4 animate-bounce" />
                <span className="font-mono text-xs font-bold">Lvl {user.level}</span>
                <div className="h-3 w-px bg-white/40"></div>
                <span className="font-sans text-xs font-semibold">{user.points} XP</span>
              </div>
            )}
            {/* Dark Mode Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-[#6B705C] dark:text-[#A3B18A] hover:bg-[#F4F1EA] dark:hover:bg-[#202724] rounded-lg transition-colors cursor-pointer"
              title="Toggle Color Theme"
            >
              {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* System Utilities Cog */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 text-[#6B705C] dark:text-[#A3B18A] hover:bg-[#F4F1EA] dark:hover:bg-[#202724] rounded-lg transition-colors cursor-pointer"
              title="Settings & Accessibility Customization"
              id="header-config-cog"
            >
              <Cog className="h-4.5 w-4.5" />
            </button>

            {/* Auth section */}
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="hidden lg:block text-right">
                  <p className="text-xs font-semibold text-[#2D3436] dark:text-[#F4F1EA]">
                    Hi, {user.name.split(" ")[0]}
                  </p>
                  <p className="text-[10px] text-[#6B705C] dark:text-[#A3B18A] font-mono capitalize">
                    {user.role} Account
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-[#6B705C] dark:text-[#A3B18A] hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-[#F4F1EA] dark:hover:bg-[#202724] transition-colors"
                  title="Logout"
                  id="auth-logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleTabChange("auth")}
                className="bg-[#588157] hover:bg-[#344E41] text-white text-xs sm:text-sm px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full font-medium flex items-center space-x-1 hover:shadow-md transition-all active:scale-95 duration-200"
                id="auth-login-trigger"
              >
                <LogIn className="h-4 w-4" />
                <span>Join / Login</span>
              </button>
            )}

            {/* Mobile menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1 px-2 rounded-md hover:bg-[#F4F1EA] dark:hover:bg-[#202724] text-[#6B705C] dark:text-[#A3B18A]"
                id="mobile-menu-trigger"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8E4D9] dark:border-[#344E41] bg-[#FDFBF7] dark:bg-[#1A1F1C] px-4 py-3 space-y-2 animate-fadeIn">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? "bg-[#E9EDC9] dark:bg-[#344E41]/55 text-[#344E41] dark:text-[#E9EDC9]"
                  : "text-[#6B705C] dark:text-[#A3B18A] hover:bg-[#F4F1EA] dark:hover:bg-[#202724]"
              }`}
            >
              {item.label}
            </button>
          ))}
          {user && user.role === "Admin" && (
            <button
              onClick={() => handleTabChange("admin")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors ${
                activeTab === "admin"
                  ? "bg-[#E6E1F9] dark:bg-[#5E548E]/40 text-[#5E548E] dark:text-[#E6E1F9]"
                  : "text-[#6B705C] dark:text-[#A3B18A] hover:bg-[#F4F1EA] dark:hover:bg-[#202724]"
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Admin Hub</span>
            </button>
          )}

          {user && user.role === "Therapist" && (
            <button
              onClick={() => handleTabChange("admin")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors ${
                activeTab === "admin"
                  ? "bg-[#E9EDC9] dark:bg-[#588157]/40 text-[#344E41] dark:text-[#E9EDC9]"
                  : "text-[#6B705C] dark:text-[#A3B18A] hover:bg-[#F4F1EA] dark:hover:bg-[#202724]"
              }`}
            >
              <Award className="h-4 w-4" />
              <span>Practitioner Hub</span>
            </button>
          )}

          {user && (
            <div className="flex sm:hidden items-center justify-between p-2.5 bg-[#F4F1EA] dark:bg-[#202724] rounded-lg">
              <span className="text-xs text-[#6B705C] dark:text-[#A3B18A]">Wellness Badge XP:</span>
              <div className="flex items-center space-x-1.5 bg-[#588157] text-white px-2.5 py-1 rounded-full text-xs font-mono font-bold">
                <Trophy className="h-3 w-3 animate-bounce" />
                <span>Lvl {user.level} · {user.points} XP</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SYSTEM UTILITIES & WCAG ACCESSIBILITY SCALER MODAL --- */}
      {settingsOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-[32px] bg-white dark:bg-[#1E2421] border border-[#E8E4D9] dark:border-[#344E41] text-slate-800 dark:text-white shadow-2xl text-left space-y-5 relative">
            <button
              onClick={() => setSettingsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="space-y-1 block">
              <span className="inline-block px-2 py-0.5 bg-[#E9EDC9] text-[#344E41] font-mono text-[9px] font-bold rounded">Mental Health Care SUITE</span>
              <h3 className="font-serif font-semibold text-lg sm:text-xl text-[#344E41] dark:text-[#E9EDC9]">Accessibility & Language Settings</h3>
              <p className="text-[11px] text-[#6B705C] dark:text-[#A3B18A]">Configure custom client-side tools conforming with WCAG AAA recommendations.</p>
            </div>

            <div className="space-y-4">
              
              {/* Select App Language */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase font-bold text-[#6B705C] dark:text-[#A3B18A]">Primary Application Language</label>
                <div className="relative">
                  <select
                    value={currentLang}
                    onChange={(e) => setCurrentLang(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F1EA] dark:bg-[#121614] border border-[#E8E4D9] dark:border-[#344E41] rounded-xl text-xs text-[#344E41] dark:text-[#E9EDC9] focus:outline-none"
                  >
                    <option value="en">English (India)</option>
                    <option value="es">Español (ES)</option>
                    <option value="fr">Français (FR)</option>
                    <option value="hi">हिंदी (Hindi)</option>
                  </select>
                </div>
              </div>

              {/* Text Scaling Size Slider */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase font-bold text-[#6B705C] dark:text-[#A3B18A] flex justify-between">
                  <span>Accessibility Text Zoom Scaling</span>
                  <span className="text-emerald-600 font-bold">{localZoom === "ultra" ? 'Ultra Large (120%)' : localZoom === "large" ? 'Large (110%)' : 'Standard (100%)'}</span>
                </label>
                <select
                  value={localZoom}
                  onChange={(e) => setLocalZoom(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F1EA] dark:bg-[#121614] border border-[#E8E4D9] dark:border-[#344E41] rounded-xl text-xs text-[#344E41] dark:text-[#E9EDC9] focus:outline-none"
                >
                  <option value="standard">Standard Scaling (14px baseline)</option>
                  <option value="large">Large Visual Accessibility (15.5px baseline)</option>
                  <option value="ultra">Ultra Visual Accessibility (17px baseline)</option>
                </select>
              </div>

              {/* High Contrast Toggle */}
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800 pb-2">
                <div>
                  <p className="text-xs font-black text-[#344E41] dark:text-[#E9EDC9]">High Contrast Boost Mode</p>
                  <p className="text-[10px] text-[#A3B18A]">Increases saturation and luminosity bounds to assist reading.</p>
                </div>
                <input
                  type="checkbox"
                  checked={activeContrast}
                  onChange={(e) => setActiveContrast(e.target.checked)}
                  className="rounded text-[#344E41] focus:ring-[#588157] h-4.5 w-4.5 cursor-pointer"
                />
              </div>

              {/* Notification & Email Alerts Simulator */}
              <div className="space-y-2 block">
                <p className="text-[10px] font-mono uppercase font-bold text-[#6B705C] dark:text-[#A3B18A]">Clinical Alert Preferences</p>
                
                <div className="space-y-1 text-xs">
                  <label className="flex items-center space-x-2 cursor-pointer pb-1 justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#344E41] dark:text-[#E9EDC9]">Simulated Push Notifications</p>
                      <p className="text-[10px] text-[#A3B18A]">Enable web alert dispatch notifications.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={pushOn}
                      onChange={(e) => setPushOn(e.target.checked)}
                      className="rounded text-[#344E41]"
                    />
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer pt-1 justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#344E41] dark:text-[#E9EDC9]">Active Email Reminders</p>
                      <p className="text-[10px] text-[#A3B18A]">Receive appointment scheduling reminders.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={remindersOn}
                      onChange={(e) => setRemindersOn(e.target.checked)}
                      className="rounded text-[#344E41]"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    alert("🧠 Mental Health Care Push Alert Test:\n'Your diurnal hydration target can be checked off in the habits screen today!'");
                  }}
                  className="w-full mt-2 py-2 bg-[#344E41] hover:bg-[#2A3F34] text-white text-xs font-sans font-bold rounded-xl shadow cursor-pointer text-center"
                >
                  Dispatch Test Push Notification Alert
                </button>
              </div>

            </div>

            <button
              onClick={() => {
                setSettingsOpen(false);
                alert("Accessibility profiles locked and active on your current browser window.");
              }}
              className="w-full py-2.5 bg-[#E9EDC9] hover:bg-[#E2EBB4] border border-[#588157]/30 text-[#344E41] text-xs font-black rounded-xl cursor-pointer text-center font-sans tracking-wide"
            >
              Apply System Configurations
            </button>
          </div>
        </div>
      )}

    </header>
  );
}
