/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  HelpCircle, 
  Wind, 
  Phone, 
  BookOpen, 
  ShieldCheck, 
  AlertCircle,
  MoreHorizontal
} from "lucide-react";
import { ChatMessage } from "../types";

interface ChatbotProps {
  onNavigateToTab: (tabId: string) => void;
}

export default function Chatbot({ onNavigateToTab }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: "Hello! I am your **Mental Health Care AI Care Companion**. 🌸\n\nI am here to listen, support, and help guide you through stress, anxiety, or emotional hurdles. \n\nHow is your heart feeling today? Ask me anything, or try our quick wellness shortcuts below:",
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: "msg-" + Math.random().toString(36).substr(2, 9),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Call REST endpoint
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: textToSend,
        history: messages.slice(-6) // feed only matching latest logs context
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error("API call error");
        return res.json();
      })
      .then((data) => {
        const botMsg: ChatMessage = {
          id: "msg-" + Math.random().toString(36).substr(2, 9),
          sender: "bot",
          text: data.text || "I am connected with you. Feel free to speak candidly.",
          timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botMsg]);
      })
      .catch((err) => {
        const fallbackMsg: ChatMessage = {
          id: "msg-err",
          sender: "bot",
          text: "I am having minor communication hurdles reaching our cerebral systems. Take a deep breath with me: Inhale slowly for 4 seconds, and exhale stress away. You are safe in this present moment.",
          timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      })
      .finally(() => {
        setIsTyping(false);
      });
  };

  const handleShortcutClick = (query: string, actionText: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: "short-" + Math.random(),
        sender: "user",
        text: actionText,
        timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setIsTyping(true);

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: query, history: [] })
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages((prev) => [
          ...prev,
          {
            id: "short-reply-" + Math.random(),
            sender: "bot",
            text: data.text,
            timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      })
      .catch((err) => console.log(err))
      .finally(() => setIsTyping(false));
  };

  // Capture navigation links like [text](#booking) formatted in markdown replies
  const renderMessageTextWithLinks = (text: string) => {
    // Basic regex parser to capture links like [Go to Bookings](#booking)
    const linkRegex = /\[([^\]]+)\]\(#([^)]+)\)/g;
    
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={lastIndex} className="whitespace-pre-wrap">{text.substring(lastIndex, match.index)}</span>);
      }
      
      const label = match[1];
      const targetHash = match[2];

      parts.push(
        <button
          key={match.index}
          onClick={() => {
            if (targetHash === "booking") onNavigateToTab("therapists");
            else if (targetHash === "mood") onNavigateToTab("mood");
            else if (targetHash === "breathing") onNavigateToTab("care");
            else if (targetHash === "resources") onNavigateToTab("home");
            else if (targetHash === "emergency") {
              const element = document.getElementById("crisis-footer");
              element?.scrollIntoView({ behavior: "smooth" });
            }
          }}
          className="text-[#588157] hover:text-[#344E41] dark:text-[#E9EDC9] dark:hover:text-[#A3B18A] font-serif font-black underline transition-colors focus:outline-none cursor-pointer"
        >
          {label}
        </button>
      );
      
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(<span key={lastIndex} className="whitespace-pre-wrap">{text.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* 1. COLLAPSED FLOATING BUBBLE */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-tr from-[#344E41] via-[#588157] to-[#8FA887] hover:from-[#2A3F34] hover:to-[#476A46] text-[#E9EDC9] shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center transition-all duration-300 cursor-pointer animate-fadeIn group"
          id="chatbot-bubble-trigger"
          title="Open AI Companion"
        >
          <Sparkles className="h-6 w-6 animate-pulse group-hover:rotate-12 transition-transform duration-300 text-[#E9EDC9]" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E9EDC9] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#A3B18A]"></span>
          </span>
        </button>
      )}

      {/* 2. EXPANDED CONVERSATION CARD */}
      {isOpen && (
        <div 
          className="w-80 sm:w-96 h-[500px] bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-slideUp"
          id="chatbot-window"
        >
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#344E41] to-[#588157] text-[#E9EDC9] flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="h-8.5 w-8.5 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                <Sparkles className="h-4.5 w-4.5 text-[#E9EDC9] animate-spin-slow" />
              </div>
              <div className="text-left">
                <h4 className="font-serif font-semibold text-sm tracking-tight leading-snug">Mental Health Care Care AI</h4>
                <div className="flex items-center space-x-1.5 text-[10px] text-[#A3B18A]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-450 animate-ping"></span>
                  <span>Online Compassion Guide</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 px-2 rounded-lg hover:bg-white/10 text-[#A3B18A] hover:text-[#E9EDC9] transition-colors cursor-pointer animate-fadeIn"
              id="chatbot-close-button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F4F1EA]/50 dark:bg-[#1E2421]/30" ref={scrollRef}>
            {messages.map((msg) => {
              const isBot = msg.sender === "bot";
              return (
                <div 
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${!isBot ? "justify-end" : "justify-start"}`}
                >
                  {isBot && (
                    <div className="h-7 w-7 rounded-lg bg-[#E9EDC9] dark:bg-[#344E41]/35 text-[#344E41] dark:text-[#E9EDC9] flex items-center justify-center shrink-0 border border-[#A3B18A]/55 font-bold">
                      <Sparkles className="h-3.5 w-3.5 text-[#588157]" />
                    </div>
                  )}

                  <div className="space-y-1 max-w-[80%]">
                    <div 
                      className={`px-3.5 py-2.5 text-xs rounded-2xl leading-relaxed text-left font-sans ${
                        isBot 
                          ? "bg-white dark:bg-[#1E2421] text-[#344E41] dark:text-[#E9EDC9] border border-[#E8E4D9] dark:border-[#344E41]/65 rounded-tl-sm shadow-xs"
                          : "bg-[#344E41] text-white rounded-tr-sm shadow-xs font-serif font-semibold"
                      }`}
                    >
                      {renderMessageTextWithLinks(msg.text)}
                    </div>
                    <span className="block text-[9px] text-[#6B705C] dark:text-[#A3B18A] font-mono text-left px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-2.5 justify-start animate-pulse">
                <div className="h-7 w-7 rounded-lg bg-[#E9EDC9]/60 dark:bg-[#1E2421] text-[#344E41] flex items-center justify-center shrink-0 border border-[#A3B18A]/35">
                  <MoreHorizontal className="h-4 w-4 animate-bounce text-[#344E41]" />
                </div>
                <div className="bg-white dark:bg-[#1E2421] px-4 py-2.5 rounded-2xl rounded-tl-sm border border-[#E8E4D9] dark:border-[#344E41] text-[11px] text-[#6B705C] dark:text-[#A3B18A] font-semibold font-serif text-left">
                  Mental Health Care Companion is typing...
                </div>
              </div>
            )}
          </div>

          {/* Quick-click Shortcuts bar */}
          <div className="p-2 border-t border-[#E8E4D9] dark:border-[#344E41]/50 bg-[#F4F1EA] dark:bg-[#1E2421]/90 flex gap-1.5 overflow-x-auto select-none shrink-0" id="chatbot-shortcuts">
            <button
              onClick={() => handleShortcutClick("Let's do a quick breathing exercise", "🧘 Start guided breathing")}
              className="px-2.5 py-1 text-[10px] bg-white border border-[#E8E4D9] dark:bg-[#252C28] dark:border-[#344E41]/50 text-[#344E41] dark:text-[#E9EDC9] hover:bg-[#E9EDC9] dark:hover:bg-[#344E41]/35 rounded-lg font-serif font-semibold flex items-center space-x-1 shrink-0 cursor-pointer"
            >
              <Wind className="h-3 w-3 text-[#588157]" />
              <span>Breathing exercise</span>
            </button>
            <button
              onClick={() => handleShortcutClick("How do I book a session with a therapist here?", "🩺 Guide matching doctors")}
              className="px-2.5 py-1 text-[10px] bg-white border border-[#E8E4D9] dark:bg-[#252C28] dark:border-[#344E41]/50 text-[#344E41] dark:text-[#E9EDC9] hover:bg-[#E9EDC9] dark:hover:bg-[#344E41]/35 rounded-lg font-serif font-semibold flex items-center space-x-1 shrink-0 cursor-pointer"
            >
              <BookOpen className="h-3 w-3 text-[#588157]" />
              <span>Doctor Bookings</span>
            </button>
            <button
              onClick={() => handleShortcutClick("Provide immediate crisis hotline information", "🚨 Crisis emergencies")}
              className="px-2.5 py-1 text-[10px] bg-[#344E41] text-[#E9EDC9] border border-[#344E41] hover:bg-rose-700 hover:text-white rounded-lg font-serif font-semibold flex items-center space-x-10 shadow-xs shrink-0 cursor-pointer"
            >
              <Phone className="h-3 w-3 text-[#E9EDC9]" />
              <span>Crisis Helplines</span>
            </button>
          </div>

          {/* Send Area */}
          <div className="p-3 bg-white dark:bg-[#252C28] border-t border-[#E8E4D9] dark:border-[#344E41]/55 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                placeholder="Ask about sleep cycles, CBT, anxiety..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-[#F4F1EA] dark:bg-[#1E2421] border border-[#E8E4D9] dark:border-[#344E41] rounded-xl text-xs sm:text-sm text-[#344E41] dark:text-[#E9EDC9] placeholder-[#A3B18A] focus:outline-none focus:ring-1 focus:ring-[#588157]"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="p-3 bg-[#344E41] hover:bg-[#2A3F34] text-white rounded-xl shadow transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                id="chatbot-send-button"
              >
                <Send className="h-4 w-4 text-[#E9EDC9]" />
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
