/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LandingPage from "./components/LandingPage";
import TherapistBooking from "./components/TherapistBooking";
import MoodTracker from "./components/MoodTracker";
import SelfCare from "./components/SelfCare";
import AuthPage from "./components/AuthPage";
import AdminTherapistDashboard from "./components/AdminTherapistDashboard";
import Chatbot from "./components/Chatbot";
import { User } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // 1. Theme Configuration Toggling
  useEffect(() => {
    // Check local preservation first
    const savedTheme = localStorage.getItem("mindhaven-theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleToggleTheme = () => {
    setIsDarkMode((prevMode) => {
      const nextMode = !prevMode;
      if (nextMode) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("mindhaven-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("mindhaven-theme", "light");
      }
      return nextMode;
    });
  };

  // 2. Local Session Restoration
  useEffect(() => {
    const cachedToken = localStorage.getItem("mindhaven-token");
    if (cachedToken) {
      setToken(cachedToken);
      // Fetch user profile stats
      fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${cachedToken}` }
      })
        .then((res) => {
          if (!res.ok) throw new Error("Stale token");
          return res.json();
        })
        .then((userData) => {
          if (userData && userData.id) {
            setUser(userData);
          }
        })
        .catch(() => {
          handleLogout();
        });
    }
  }, []);

  const handleLoginSuccess = (newToken: string, loggedUser: User) => {
    setToken(newToken);
    setUser(loggedUser);
    localStorage.setItem("mindhaven-token", newToken);
    
    // Auto route to mood tracker on successful login to log current mood!
    setActiveTab("mood");
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("mindhaven-token");
    setActiveTab("home");
  };

  const handleRefreshUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FDFBF7] dark:bg-[#1A1F1C] text-[#2D3436] dark:text-[#F4F1EA] transition-colors duration-300">
      
      {/* Dynamic Header */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout} 
        darkMode={isDarkMode}
        toggleDarkMode={handleToggleTheme}
      />

      {/* Main Container Content */}
      <main className="flex-1 mt-20">
        
        {activeTab === "home" && (
          <LandingPage 
            onExploreTherapists={() => setActiveTab("therapists")}
            onExploreSelfCare={() => setActiveTab("care")}
            onExploreMood={() => setActiveTab("mood")}
          />
        )}

        {activeTab === "therapists" && (
          <TherapistBooking 
            user={user} 
            token={token} 
            onRefreshUser={handleRefreshUser}
            onNavigateToMood={() => setActiveTab("mood")}
          />
        )}

        {activeTab === "mood" && (
          <MoodTracker 
            user={user} 
            token={token} 
            onRefreshUser={handleRefreshUser}
          />
        )}

        {activeTab === "care" && (
          <SelfCare 
            user={user} 
            token={token} 
            onRefreshUser={handleRefreshUser}
          />
        )}

        {activeTab === "auth" && (
          <AuthPage onLoginSuccess={handleLoginSuccess} />
        )}

        {activeTab === "admin" && (
          <AdminTherapistDashboard user={user} token={token} />
        )}

      </main>

      {/* Floating Sparkly AI Support Chatbot */}
      <Chatbot onNavigateToTab={setActiveTab} />

      {/* Global Clinical Crisis Footer */}
      <Footer />

    </div>
  );
}
