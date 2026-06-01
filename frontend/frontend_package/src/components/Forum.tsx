/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

declare module "react";

import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Heart, 
  Sparkles, 
  User as UserIcon, 
  MessageCircle, 
  Compass, 
  AlertCircle,
  Share2,
  Trash2,
  Bookmark
} from "lucide-react";
import { User } from "../types";
import { formatIndiaDate, formatIndiaShortDate } from "../utils/indiaLocale";

interface ForumPost {
  id: string;
  authorName: string;
  authorRole: string;
  title: string;
  content: string;
  category: string;
  upvotes: number;
  replies: ForumComment[];
  pinned?: boolean;
  createdAt: string;
  anonymous: boolean;
}

interface ForumComment {
  id: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

const FORUM_CATEGORIES = ["All Discussion", "Anxiety Support", "Depression Recovery", "Mindfulness Techniques", "Daily Successes", "Therapy Preparation"];

const INITIAL_POSTS: ForumPost[] = [
  {
    id: "post-1",
    authorName: "AnxiousSerene",
    authorRole: "Patient",
    title: "How to manage social anxiety before scheduling my first trial therapy session?",
    content: "Hi everyone, I really want to schedule an appointment with Dr. Alisha on the Consult tab but my hands start sweating and my heart races just thinking about clicking booking. Any anonymous coping mechanisms or questions I should write down before starting to alleviate details?",
    category: "Anxiety Support",
    upvotes: 18,
    anonymous: true,
    createdAt: "2026-05-22T04:22:00Z",
    replies: [
      {
        id: "c-1",
        authorName: "Dr. Alisha Specialist",
        authorRole: "Therapist",
        content: "Hello! It is completely normal to feel this way. In our first session, we don't dive into trauma right away; we just chat, find a secure pacing, and establish safety. No pressure at all—you are in total control of the conversation.",
        createdAt: "2026-05-22T05:10:00Z"
      },
      {
        id: "c-2",
        authorName: "GratefulSoul99",
        authorRole: "Patient",
        content: "I felt exactly like you last month! Try doing the box breathing in the 'Meditation & Breathing' tab for 3 cycles before you login. It legitimately lowers your heart rate.",
        createdAt: "2026-05-22T05:30:00Z"
      }
    ]
  },
  {
    id: "post-2",
    authorName: "MindfulnessCoach",
    authorRole: "Therapist",
    title: "Guided journal prompt for active body grounding and relaxation",
    content: "Take 5 deep breaths, lookup from your screen and name: 5 items your eyes can see, 4 items your hands can touch, 3 items your ears can hear, 2 items your nose can smell, and 1 positive affirmation about yourself. Let's practice self-care together. Reply with your feedback below!",
    category: "Mindfulness Techniques",
    upvotes: 24,
    anonymous: false,
    createdAt: "2026-05-21T18:15:00Z",
    replies: [
      {
        id: "c-3",
        authorName: "ZenGardener",
        authorRole: "Patient",
        content: "This grounding script works instantly during sensory overloads. Thank you for this resource!",
        createdAt: "2026-05-21T20:02:00Z"
      }
    ]
  }
];

interface ForumProps {
  user: User | null;
  token: string | null;
  onRefreshUser?: (u: any) => void;
}

export default function Forum({ user, token, onRefreshUser }: ForumProps) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [activeCategory, setActiveCategory] = useState("All Discussion");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("Anxiety Support");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [errorStatus, setErrorStatus] = useState("");
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [savedPosts, setSavedPosts] = useState<string[]>([]);

  useEffect(() => {
    // Attempt local storage synchronization or fallback
    const savedForumPosts = localStorage.getItem("mindhaven-forum-posts");
    if (savedForumPosts) {
      setPosts(JSON.parse(savedForumPosts));
    } else {
      setPosts(INITIAL_POSTS);
      localStorage.setItem("mindhaven-forum-posts", JSON.stringify(INITIAL_POSTS));
    }
  }, []);

  const saveToLocalStorage = (updatedPosts: ForumPost[]) => {
    setPosts(updatedPosts);
    localStorage.setItem("mindhaven-forum-posts", JSON.stringify(updatedPosts));
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus("");

    if (!newTitle.trim() || !newContent.trim()) {
      setErrorStatus("Post title and detailed content body are required.");
      return;
    }

    const postAuthor = isAnonymous ? "AnonymousPeer" : (user ? user.name : "GuestPeer");
    const roleLabel = isAnonymous ? "Peer" : (user ? user.role : "Guest");

    const newPost: ForumPost = {
      id: `post-${Date.now()}`,
      authorName: postAuthor,
      authorRole: roleLabel,
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      upvotes: 0,
      replies: [],
      anonymous: isAnonymous,
      createdAt: new Date().toISOString()
    };

    const updated = [newPost, ...posts];
    saveToLocalStorage(updated);

    // Clear form
    setNewTitle("");
    setNewContent("");
    setIsAnonymous(true);

    // Simulate wellness reward
    if (user && token) {
      fetch("/api/gamification/meditate", { // use generic endpoint for engagement reward
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      })
        .then(() => {
          fetch("/api/auth/me", { headers: { "Authorization": `Bearer ${token}` } })
            .then((r) => r.json())
            .then((u) => {
              if (u.id && onRefreshUser) onRefreshUser(u);
            });
        })
        .catch(() => {});
    }
  };

  const handleUpvote = (postId: string) => {
    const updated = posts.map((p) => {
      if (p.id === postId) {
        return { ...p, upvotes: p.upvotes + 1 };
      }
      return p;
    });
    saveToLocalStorage(updated);
  };

  const toggleBookmark = (postId: string) => {
    if (savedPosts.includes(postId)) {
      setSavedPosts(savedPosts.filter((id) => id !== postId));
    } else {
      setSavedPosts([...savedPosts, postId]);
    }
  };

  const handleAddComment = (postId: string) => {
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;

    const commentAuthor = user ? user.name : "GuestPeer";
    const commentRole = user ? user.role : "Guest";

    const newComment: ForumComment = {
      id: `comment-${Date.now()}`,
      authorName: commentAuthor,
      authorRole: commentRole,
      content: commentText.trim(),
      createdAt: new Date().toISOString()
    };

    const updated = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          replies: [...p.replies, newComment]
        };
      }
      return p;
    });

    saveToLocalStorage(updated);
    setCommentInputs({ ...commentInputs, [postId]: "" });
  };

  const handleDeletePost = (postId: string) => {
    const updated = posts.filter((p) => p.id !== postId);
    saveToLocalStorage(updated);
  };

  const filteredPosts = activeCategory === "All Discussion" 
    ? posts 
    : posts.filter((p) => p.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-16">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-block px-3 py-1 bg-[#E9EDC9] dark:bg-[#344E41]/30 border border-[#A3B18A]/30 text-[#344E41] dark:text-[#E9EDC9] text-xs font-bold tracking-wider rounded-lg uppercase">
          COMMUNITY & ANONYMOUS SUPPORT
        </div>
        <h1 className="font-serif font-light text-3xl sm:text-4xl text-[#344E41] dark:text-[#E9EDC9] tracking-tight">
          Anonymous Peer Support Thread Discussions
        </h1>
        <p className="text-sm text-[#6B705C] dark:text-[#A3B18A] max-w-2xl mx-auto font-sans">
          Share your mental triumphs, copy helpful coping mechanisms, or seek advice anonymously. Our peer board is clinical-monitored for support safety.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Col: Filters & Compose Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick Stats / Community Slogan */}
          <div className="p-5 rounded-3xl bg-[#344E41] text-white space-y-3">
            <h4 className="font-serif font-bold text-sm text-[#E9EDC9] flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-[#E9EDC9] animate-spin-slow" />
              <span>Safe space protocol active</span>
            </h4>
            <p className="text-xs text-[#A3B18A] leading-relaxed">
              Every peer poster can choose complete anonymity. Avoid sharing private phone numbers or credit codes. Be compassionate to each other.
            </p>
          </div>

          {/* Quick Tag filter list */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] shadow-sm space-y-3">
            <h3 className="font-serif font-bold text-sm text-[#344E41] dark:text-[#E9EDC9] flex items-center gap-1.5">
              <Compass className="h-4.5 w-4.5 text-[#588157]" />
              <span>Filter Community Streams</span>
            </h3>
            <div className="flex flex-col space-y-1.5">
              {FORUM_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors flex justify-between items-center ${
                      isActive 
                        ? "bg-[#E9EDC9] dark:bg-[#344E41]/50 text-[#344E41] dark:text-[#E9EDC9] font-bold"
                        : "text-[#6B705C] dark:text-[#A3B18A] hover:bg-[#F4F1EA] dark:hover:bg-[#1E2421]"
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="font-mono text-[10px] bg-white/40 px-1.5 py-0.5 rounded text-slate-500">
                      {cat === "All Discussion" ? posts.length : posts.filter((p) => p.category === cat).length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Create New Thread form */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-sm text-[#344E41] dark:text-[#E9EDC9] flex items-center gap-1.5">
              <MessageSquare className="h-4.5 w-4.5 text-[#588157]" />
              <span>Post New Peer Discussion</span>
            </h3>

            {errorStatus && (
              <p className="p-2 bg-red-50 text-red-500 rounded-lg text-xs leading-relaxed">{errorStatus}</p>
            )}

            <form onSubmit={handleCreatePost} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-[#6B705C] dark:text-[#A3B18A] uppercase font-bold">Topic Theme Title</label>
                <input
                  type="text"
                  placeholder="Summarize your question or insight..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F1EA] dark:bg-[#1E2421] border border-[#E8E4D9] dark:border-[#344E41] rounded-xl text-xs text-[#344E41] dark:text-[#E9EDC9]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-[#6B705C] dark:text-[#A3B18A] uppercase font-bold">Category Group</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F1EA] dark:bg-[#1E2421] border border-[#E8E4D9] dark:border-[#344E41] rounded-xl text-xs text-[#344E41] dark:text-[#E9EDC9]"
                >
                  {FORUM_CATEGORIES.slice(1).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-[#6B705C] dark:text-[#A3B18A] uppercase font-bold">Topic content description</label>
                <textarea
                  rows={4}
                  placeholder="Share details safely. Express feelings, coping tools, or review support suggestions."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F1EA] dark:bg-[#1E2421] border border-[#E8E4D9] dark:border-[#344E41] rounded-xl text-xs text-[#344E41] dark:text-[#E9EDC9] resize-none"
                />
              </div>

              {/* Anonymity Toggling */}
              <div className="flex md:flex-row flex-col justify-between items-start md:items-center gap-2 py-1">
                <label className="flex items-center space-x-2 text-[11px] text-[#6B705C] dark:text-[#A3B18A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-[#E8E4D9] text-[#344E41] focus:ring-[#588157]"
                  />
                  <span>Post Anonymously (Hide Name)</span>
                </label>
                <span className="text-[9px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded font-bold font-mono">+10 XP Activity!</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#344E41] hover:bg-[#2A3F34] text-white font-sans text-xs font-bold rounded-xl cursor-pointer shadow active:scale-95 transition-all text-center"
              >
                Publish Peer Topic
              </button>
            </form>
          </div>

        </div>

        {/* Right Col: Feed discussion (7 cols) */}
        <div id="posts-stream-feed" className="lg:col-span-7 space-y-6">
          
          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] space-y-2">
              <AlertCircle className="h-8 w-8 text-[#A3B18A] mx-auto animate-pulse" />
              <h4 className="font-serif font-semibold text-sm text-[#344E41] dark:text-[#E9EDC9]">No topics in {activeCategory} yet</h4>
              <p className="text-xs text-[#6B705C] dark:text-[#A3B18A]">Be the very first peer to compose a thread!</p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const d = new Date(post.createdAt);
              const formattedDate = formatIndiaDate(d, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
              const isCreator = user && (user.name === post.authorName || user.role === "Admin");
              const commentText = commentInputs[post.id] || "";
              
              return (
                <div 
                  key={post.id}
                  className="p-6 rounded-3xl bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] shadow-sm space-y-4 text-left relative"
                >
                  {/* Header metadata */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-1.5 rounded-full ${post.anonymous ? "bg-slate-100 text-slate-505" : "bg-[#E9EDC9] text-[#344E41]"} shrink-0`}>
                        <UserIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-serif font-bold text-[#344E41] dark:text-[#E9EDC9]">
                            {post.authorName}
                          </span>
                          <span className="text-[9px] font-mono bg-[#F4F1EA] dark:bg-[#1E2421] text-[#6B705C] dark:text-[#A3B18A] px-1.5 py-0.5 rounded-md font-bold">
                            {post.authorRole}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#A3B18A] font-mono">{formattedDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-[#E9EDC9] dark:bg-[#344E41] text-[#344E41] dark:text-[#E9EDC9] rounded-full">
                        {post.category}
                      </span>
                      {isCreator && (
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Delete Thread"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Body */}
                  <div className="space-y-2">
                    <h4 className="font-serif font-bold text-sm sm:text-base text-[#344E41] dark:text-[#E9EDC9] tracking-tight">
                      {post.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-[#6B705C] dark:text-[#A3B18A] leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>
                  </div>

                  {/* Actions (Upvote, Save, Share) */}
                  <div className="flex items-center justify-between pt-2 border-t border-dashed border-[#E8E4D9] dark:border-[#344E41]/50">
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => handleUpvote(post.id)}
                        className="flex items-center space-x-1.5 text-xs text-[#588157] font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer bg-[#F4F1EA] dark:bg-[#1E2421] py-1 px-2.5 rounded-lg"
                      >
                        <Heart className="h-3.5 w-3.5 fill-[#588157]" />
                        <span>Upvote · {post.upvotes}</span>
                      </button>
                      
                      <button 
                        onClick={() => toggleBookmark(post.id)}
                        className={`flex items-center space-x-1.5 text-xs font-serif transition-colors cursor-pointer py-1 px-2.5 rounded-lg ${
                          savedPosts.includes(post.id) 
                            ? "text-[#588157] font-bold bg-[#E9EDC9]/40" 
                            : "text-[#6B705C] dark:text-[#A3B18A] hover:bg-[#F4F1EA]"
                        }`}
                      >
                        <Bookmark className="h-3.5 w-3.5" />
                        <span>{savedPosts.includes(post.id) ? "Saved" : "Save"}</span>
                      </button>
                    </div>

                    <span className="text-[10px] text-[#6B705C] dark:text-[#A3B18A] font-medium flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>{post.replies.length} replies</span>
                    </span>
                  </div>

                  {/* Replies Archive */}
                  {post.replies.length > 0 && (
                    <div className="p-4 bg-[#F4F1EA]/60 dark:bg-[#1C221F] rounded-2xl space-y-3.5 max-h-52 overflow-y-auto border border-[#E8E4D9]/50 dark:border-[#344E41]/30">
                      {post.replies.map((comment) => {
                        const isTherapist = comment.authorRole === "Therapist";
                        const isDocAdmin = comment.authorRole === "Admin" || isTherapist;
                        return (
                          <div 
                            key={comment.id}
                            className={`p-3 rounded-xl space-y-1 relative text-left text-xs ${
                              isDocAdmin 
                                ? "bg-emerald-50/70 border-l-[3px] border-emerald-500 dark:bg-emerald-950/25" 
                                : "bg-white dark:bg-[#252C28]"
                            }`}
                          >
                            <div className="flex justify-between items-center bg-transparent">
                              <span className="font-sans font-bold text-[#344E41] dark:text-[#E9EDC9] flex items-center gap-1">
                                {comment.authorName}
                                {isDocAdmin && <span className="text-[8px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 px-1 py-0.2 rounded font-bold uppercase">Practitioner Verified</span>}
                              </span>
                              <span className="text-[9px] text-[#A3B18A] font-mono">{formatIndiaShortDate(comment.createdAt)}</span>
                            </div>
                            <p className="text-[#6B705C] dark:text-[#A3B18A] leading-relaxed italic">
                              "{comment.content}"
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Write Reply container */}
                  <div className="flex gap-2 items-center">
                    <input
                      placeholder="Post a compassionate reply..."
                      value={commentText}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddComment(post.id);
                      }}
                      className="flex-1 px-4 py-2 bg-[#F4F1EA] dark:bg-[#1E2421] border border-[#E8E4D9] dark:border-[#344E41]/70 rounded-xl text-xs sm:text-sm text-[#344E41] dark:text-[#E9EDC9]"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="py-2 px-4 bg-[#344E41] hover:bg-[#2A3F34] text-white font-sans text-xs font-bold rounded-xl shadow cursor-pointer active:scale-95 transition-transform"
                    >
                      Reply
                    </button>
                  </div>

                </div>
              );
            })
          )}

        </div>

      </div>

    </div>
  );
}
