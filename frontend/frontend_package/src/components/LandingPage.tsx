/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Heart, 
  ArrowRight, 
  BookOpen, 
  ShieldCheck, 
  Users, 
  BrainCircuit, 
  CheckCircle,
  Clock,
  Sparkles,
  Search,
  Filter,
  Smile,
  Compass,
  Briefcase,
  X
} from "lucide-react";
import { ResourceItem } from "../types";
import { namedImageDataUri } from "../utils/namedImage";

// Solid curated health blogs seed
const MENTAL_BLOG_RESOURCES: ResourceItem[] = [

  {
    id: "blog-2",
    title: "CBT Guide: Identifying Cognitive Distortions",
    category: "Anxiety",
    summary: "Our thoughts guide our behaviors. Learn to recognize destructive cognitive habits like catastrophizing and mind-reading.",
    duration: "6 min read",
    imageUrl: "https://plus.unsplash.com/premium_photo-1682608388937-26eadd2ddfe9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTN8fGFueGlldHl8ZW58MHx8MHx8fDA%3D",
    content: "Cognitive Behavioral Therapy (CBT) revolves around the 'Cognitive Triad'—the understanding that our thoughts directly shape our feelings and our subsequent actions. A common hurdle in maintaining positive mental health is falling prey to 'Cognitive Distortions.' These are patterns of automatic thoughts that have no basis in reality but feel entirely true. Common distortions include: \n\n1. Catastrophizing: Assuming the absolute worst outcome is guaranteed. ('If I make one mistake on this report, I will get fired immediately.')\n2. Black-and-White Thinking: Viewing situations in extreme terms with no grey areas. ('If I don't perfect this speech, I am a total failure.')\n3. Emotional Reasoning: Believing that because you feel a certain way, it must be reality. ('I feel incredibly anxious, therefore this social gathering is deeply dangerous.')\n\nTo counter these distortions, therapists teach patients to become 'scientific observers' of their thoughts. When an automatic negative thought triggers distress, pause and ask yourself: 'What objective evidence support this thought?' and 'What objective evidence opposes it?' Restructuring your internal dialogue to be balanced and evidentiary relieves major symptoms of chronic generalized anxiety."
  },
  {
    id: "blog-3",
    title: "Mastering Sleep: Sleep Architectures & Mental Health",
    category: "Sleep",
    summary: "Deep sleep and REM cycles play an absolute role in processing daily trauma and consolidating logical long-term memories.",
    duration: "5 min read",
    imageUrl: "https://plus.unsplash.com/premium_photo-1661397087554-2774b7e7332f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c2xlZXB8ZW58MHx8MHx8fDA%3D",
    content: "Sleep is not merely a passive downtime; it is an active state of neurological restoration. During cycles of Slow-Wave Sleep (deep sleep), the brain's glymphatic system essentially 'washes' metabolic waste from the intercellular spaces. Subsequently, during Rapid Eye Movement (REM) sleep, your subconscious actively consolidates newly gathered data and processes complex emotional events from the day. If you cut your sleep short, you disproportionately starve your brain of REM sleep. This leaves you emotionally volatile, prone to higher levels of stress hormones, and with decreased cognitive reserves. To maximize sleep quality, construct a cool, completely dark evening room, avoid blue light at least 60 minutes before retiring, and maintain a strict sleep-wake schedule—even on weekends."
  },
  {
    id: "blog-4",
    title: "Anxious Attachment and Relationship Volatility",
    category: "Relationships",
    summary: "Recognize how early emotional environments construct adult attachment styles and learn strategies to build secure relationships.",
    duration: "7 min read",
    imageUrl: "https://images.unsplash.com/reserve/Af0sF2OS5S5gatqrKzVP_Silhoutte.jpg?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cmVsYXRpb25zaGlwfGVufDB8fDB8fHww",
    content: "Humans are wired for social connection. Grounded in attachment psychology, our romantic relationships in adult life often mirror the primary care bonds we developed during infancy. Those with an anxious attachment style often experience intense fear of abandonment, constantly seeking validation from their peers and partners. Conversely, avoidant attachers associate intimacy with loss of independence, retreating when conflicts arise. \n\nLearning to navigate attachment security involves identifying your triggers, practicing open vulnerable communication about your fears without accusing your partner, and utilizing personal self-soothing mechanics—such as journaling and clinical mindfulness—to quiet high emotional spikes before reacting."
  },
  {
    id: "blog-5",
    title: "Understanding High-Functioning Depression",
    category: "Depression",
    summary: "When depression hides behind a mask of high accomplishment: How to spot Dysthymia and seek appropriate self-care.",
    duration: "5 min read",
    imageUrl: "https://images.unsplash.com/photo-1587538537208-28441ca4982a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODJ8fGRlcHJlc3Npb258ZW58MHx8MHx8fDA%3D",
    content: "Many associate depression with inability to get out of bed or perform daily tasks. However, Persistent Depressive Disorder (also known as Dysthymia) presents differently. It is a long-term, dull state of sadness that allows someone to function perfectly—performing outstandingly at work, socializing with family, and maintaining responsibilities—while interiorly feeling hollow, utterly detached, and physically exhausted. \n\nConnecting with a CBT practitioner or clinical therapist is the gold standard for high-functioning depression. Breaking the silence, journaling, and utilizing gentle breathing exercises helps validate your internal experiences, showing that seeking help is a courageous strength."
  }
];

interface LandingPageProps {
  onExploreTherapists: () => void;
  onExploreSelfCare: () => void;
  onExploreMood: () => void;
}

export default function LandingPage({
  onExploreTherapists,
  onExploreSelfCare,
  onExploreMood
}: LandingPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeBlog, setActiveBlog] = useState<ResourceItem | null>(null);
  const [dbBlogs, setDbBlogs] = useState<ResourceItem[]>([]);

  React.useEffect(() => {
    fetch("/api/blogs")
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setDbBlogs(data);
        }
      })
      .catch((err) => console.log("Fetch main feed blogs failed: ", err));
  }, []);

  const combinedBlogs = [...dbBlogs, ...MENTAL_BLOG_RESOURCES];

  // Filter Blogs based on Search or Click Category
  const filteredBlogs = combinedBlogs.filter((b) => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || b.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["All", "Anxiety", "Depression", "Mindfulness", "Relationships", "Sleep"];

  const handleHeroScroll = () => {
    document.getElementById("about-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full space-y-20 pb-16 bg-transparent transition-colors duration-300">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pb-28">
        {/* Soft background light blooms */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[400px] bg-gradient-to-tr from-[#E9EDC9]/30 via-transparent to-[#A3B18A]/25 dark:from-[#344E41]/20 dark:via-transparent dark:to-[#588157]/15 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center space-y-8">
          <div className="inline-flex items-center space-x-2 bg-[#E9EDC9] dark:bg-[#344E41]/45 border border-[#A3B18A]/30 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#588157] dark:text-[#A3B18A]">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>India-ready mental wellness support</span>
          </div>

          <h1 className="font-serif font-light tracking-tight text-4xl sm:text-5xl md:text-6xl text-[#344E41] dark:text-[#E9EDC9] max-w-4xl mx-auto leading-tight text-balance">
            Your Mental Wellness, <br />
            <span className="italic text-[#588157] dark:text-[#A3B18A]">guided by human care & AI support.</span>
          </h1>

          <p className="font-sans text-base sm:text-lg text-[#6B705C] dark:text-[#A3B18A] max-w-2xl mx-auto leading-relaxed">
            Connect with vetted Indian mental health practitioners, track daily emotional patterns, earn wellness milestones, and chat instantly with our supportive AI companion.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button
              onClick={onExploreTherapists}
              className="w-full sm:w-auto px-8 py-4 bg-[#344E41] hover:bg-[#2A3F34] text-white font-sans font-semibold rounded-2xl shadow-lg shadow-[#344e4120] hover:shadow-xl hover:shadow-[#344e4135] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
              id="hero-cta-booking"
            >
              <span>Consult Clinical Specialists</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onExploreSelfCare}
              className="w-full sm:w-auto px-8 py-4 border border-[#A3B18A] text-[#344E41] dark:text-[#E9EDC9] hover:bg-[#E9EDC9]/25 hover:border-[#588157] font-sans font-semibold rounded-2xl shadow-sm hover:shadow active:scale-95 transition-all duration-200 cursor-pointer"
              id="hero-cta-breathing"
            >
              <span>Practice Self-Care & Breathing</span>
            </button>
          </div>

          <div className="pt-8">
            <button 
              onClick={handleHeroScroll}
              className="text-xs text-[#6B705C] hover:text-[#344E41] dark:hover:text-[#E9EDC9] uppercase tracking-widest font-semibold flex flex-col items-center mx-auto space-y-2 focus:outline-none"
            >
              <span>Learn About Our System</span>
              <div className="h-5 w-px bg-[#A3B18A] dark:bg-[#344E41] animate-bounce"></div>
            </button>
          </div>
        </div>
      </section>

      {/* 2. ABOUT SECTION */}
      <section id="about-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Card Layout Visual representation */}
          <div className="space-y-4 relative">
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-[#588157]/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="p-6 sm:p-8 rounded-[32px] bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] shadow-sm space-y-6">
              <div className="flex items-center space-x-3 text-[#344E41] dark:text-[#E9EDC9]">
                <BrainCircuit className="h-6 w-6 animate-pulse" />
                <h3 className="font-serif font-semibold text-xl tracking-tight">Our Scientific Pillars</h3>
              </div>
              <p className="text-sm sm:text-base text-[#6B705C] dark:text-[#A3B18A] leading-relaxed font-sans">
                Mental Health Care couples emotional care models with direct modern psychology. By implementing behavioral milestones, patients earn gamified levels, converting standard therapy checklists into beautiful achievements.
              </p>
              
              <ul className="space-y-3">
                {[
                  "Cognitive Behavioral Therapy (CBT) Frameworks", 
                  "Mindfulness-Based Stress Reduction (MBSR) Methods",
                  "IST-based Doctor Availability Filtering & Scheduling",
                  "DPDP-aware encrypted records and protected session logs"
                ].map((item, id) => (
                  <li key={id} className="flex items-center space-x-2.5 text-xs sm:text-sm text-[#2D3436] dark:text-[#F4F1EA] font-sans">
                    <CheckCircle className="h-4 w-4 text-[#588157] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Slogan details and CTAs */}
          <div className="space-y-6 text-left">
            <div className="inline-block px-3 py-1 bg-[#E9EDC9] dark:bg-[#344E41]/30 border border-[#A3B18A]/30 text-[#344E41] dark:text-[#E9EDC9] text-xs font-mono tracking-wider rounded-lg font-bold uppercase">
              ABOUT Mental Health Care
            </div>
            
            <h2 className="font-serif font-light tracking-tight text-3xl sm:text-4xl text-[#344E41] dark:text-[#E9EDC9] leading-tight text-balance">
              A holistic platform that tracks daily curves, and triggers positive healing loops.
            </h2>

            <p className="text-[#6B705C] dark:text-[#A3B18A] text-sm sm:text-base leading-relaxed font-sans">
              We understand mental wellness is not a straight upward line. There are peaks, valleys, and steady state plateaus. Mental Health Care provides the core infrastructure to chart this journey objectively. By using our Mood Recorder, patients express daily journals and log mood, generating visual area graphs of emotional stability.
            </p>

            <div className="grid grid-cols-3 gap-4 border-t border-[#E8E4D9] dark:border-[#344E41] pt-6">
              <div>
                <span className="block text-2xl font-serif font-bold text-[#588157] dark:text-[#E9EDC9]">100%</span>
                <span className="block text-[10px] sm:text-xs text-[#6B705C] dark:text-[#A3B18A] font-mono">Confidential Storage</span>
              </div>
              <div>
                <span className="block text-2xl font-serif font-bold text-[#344E41] dark:text-[#E9EDC9]">24/7</span>
                <span className="block text-[10px] sm:text-xs text-[#6B705C] dark:text-[#A3B18A] font-mono">AI Care Chatbot</span>
              </div>
              <div>
                <span className="block text-2xl font-serif font-bold text-[#588157] dark:text-[#E9EDC9]">15+</span>
                <span className="block text-[10px] sm:text-xs text-[#6B705C] dark:text-[#A3B18A] font-mono">India-based Doctors</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. MENTAL HEALTH RESOURCES (Filterable Blogs / Tips Section) */}
      <section id="resources" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-block px-3 py-1 bg-[#E9EDC9] dark:bg-[#344E41]/30 border border-[#A3B18A]/30 text-[#344E41] dark:text-[#E9EDC9] text-xs font-bold tracking-wider rounded-lg uppercase">
              KNOWLEDGE DIRECTORY
            </div>
            <h2 className="font-serif font-light text-3xl text-[#344E41] dark:text-[#E9EDC9] tracking-tight">
              Clinically Vetted Mental Health Resources & Blogs
            </h2>
            <p className="text-sm text-[#6B705C] dark:text-[#A3B18A] max-w-2xl mx-auto font-sans">
              Read up on peer-reviewed mental health guides covering sleep hygeine, cognitive distortions, relationship styles, anxiety coping mechanisms, and meditation techniques.
            </p>
          </div>

          {/* Search & Category Filter bar */}
          <div className="p-4 rounded-3xl bg-[#F4F1EA] dark:bg-[#202724] border border-[#E8E4D9] dark:border-[#344E41] shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-center">
              
              {/* Search input */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A3B18A]" />
                <input
                  type="text"
                  placeholder="Search articles & guides..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#2A332F] border border-[#E8E4D9] dark:border-[#344E41] rounded-2xl text-sm placeholder-[#6B705C] dark:placeholder-[#A3B18A] text-[#2D3436] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#588157]"
                />
              </div>

              {/* Filters list for category */}
              <div className="flex flex-wrap gap-1.5 items-center justify-start w-full overflow-x-auto">
                <Filter className="h-4 w-4 text-[#6B705C] mr-1 hidden sm:inline" />
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      selectedCategory === cat
                        ? "bg-[#588157] text-[#FDFBF7] font-sans font-bold hover:scale-105"
                        : "bg-white dark:bg-[#2A332F] border border-[#E8E4D9] dark:border-[#344E41] text-[#6B705C] dark:text-[#A3B18A] hover:bg-[#F4F1EA] dark:hover:bg-[#1E2421]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* Blogs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.length === 0 ? (
              <div className="col-span-full text-center py-12 p-8 rounded-2xl border border-dashed border-[#A3B18A] bg-[#FDFBF7]/50 dark:bg-[#1A1F1C]/20">
                <p className="text-sm text-[#6B705C] dark:text-[#A3B18A] font-sans">No wellness articles matched your phrase or category filters. Reset searches above.</p>
              </div>
            ) : (
              filteredBlogs.map((blog) => (
                <div 
                  key={blog.id}
                  className="group rounded-[32px] bg-white dark:bg-[#252C28] border border-[#E8E4D9] dark:border-[#344E41] shadow-sm hover:shadow-md hover:border-[#A3B18A] dark:hover:border-[#588157] overflow-hidden flex flex-col justify-between transition-all duration-300"
                  id={`resource-blog-${blog.id}`}
                >
                  <div>
                    {/* Visual Photo header */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                      <img 
                        src={blog.imageUrl} 
                        alt={blog.title}
                        onError={(event) => {
                          event.currentTarget.src = namedImageDataUri(blog.title, blog.category);
                        }}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider uppercase rounded-full bg-[#E9EDC9] text-[#588157] shadow-sm">
                        {blog.category}
                      </span>
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex items-center space-x-1.5 text-xs text-[#6B705C] dark:text-[#A3B18A] font-mono">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{blog.duration || "5 min read"}</span>
                        <span>·</span>
                        <span>Peer Reviewed</span>
                      </div>
                      
                      <h3 className="font-serif font-bold text-base text-[#344E41] dark:text-[#E9EDC9] group-hover:text-[#588157] transition-colors line-clamp-2">
                        {blog.title}
                      </h3>
                      
                      <p className="text-xs text-[#6B705C] dark:text-[#A3B18A] line-clamp-3 leading-relaxed font-sans">
                        {blog.summary}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <button
                      onClick={() => setActiveBlog(blog)}
                      className="w-full py-2 bg-[#F4F1EA] hover:bg-[#E9EDC9] dark:bg-[#1E2421] dark:hover:bg-[#344E41]/40 text-[#344E41] hover:text-[#588157] dark:text-[#A3B18A] text-xs font-semibold font-sans rounded-xl border border-[#E8E4D9] dark:border-[#344E41] flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Read Full Article</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </section>

      {/* --- ARTICLE MODAL --- */}
      {activeBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#FDFBF7] dark:bg-[#1A1F1C] border border-[#E8E4D9] dark:border-[#344E41] rounded-[32px] shadow-2xl flex flex-col overflow-hidden">
            
            {/* Header image */}
            <div className="relative h-56 w-full shrink-0">
              <img 
                src={activeBlog.imageUrl} 
                alt={activeBlog.title}
                onError={(event) => {
                  event.currentTarget.src = namedImageDataUri(activeBlog.title, activeBlog.category);
                }}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1F1C]/90 via-transparent to-transparent"></div>
              <span className="absolute top-4 left-4 px-3 py-1 text-xs font-mono font-black tracking-widest uppercase rounded-full bg-[#E9EDC9] text-[#588157]">
                {activeBlog.category}
              </span>
              <button 
                onClick={() => setActiveBlog(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white transition-colors"
                id="close-article"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="font-serif font-bold text-lg sm:text-xl text-white tracking-tight leading-snug">
                  {activeBlog.title}
                </h3>
              </div>
            </div>

            {/* Scrolling reading area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between text-xs text-[#6B705C] dark:text-[#A3B18A] font-mono border-b pb-3 border-[#E8E4D9] dark:border-[#344E41]">
                <span className="flex items-center space-x-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Estimated: {activeBlog.duration}</span>
                </span>
                <span>Reviewed: Medical Board Approved</span>
              </div>

              <div className="space-y-4">
                <p className="font-serif text-sm sm:text-base text-[#2D3436] dark:text-[#F4F1EA] font-medium leading-relaxed italic border-l-4 border-[#588157] pl-4 py-1">
                  {activeBlog.summary}
                </p>
                <div className="text-sm text-[#6B705C] dark:text-[#A3B18A] leading-relaxed font-sans space-y-3 whitespace-pre-wrap">
                  {activeBlog.content}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#F4F1EA] dark:bg-[#202724] border-t border-[#E8E4D9] dark:border-[#344E41] shrink-0 text-center flex justify-between items-center">
              <div className="flex items-center space-x-1 text-[11px] text-[#6B705C] dark:text-[#A3B18A]">
                <ShieldCheck className="h-4 w-4 text-[#588157]" />
                <span>Verified Patient Resource</span>
              </div>
              <button
                onClick={() => setActiveBlog(null)}
                className="px-4 py-2 bg-[#588157] hover:bg-[#344E41] text-white font-sans font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                I Understand
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
