/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  BookOpen, 
  Trophy, 
  LayoutDashboard, 
  ChevronRight, 
  X, 
  RotateCcw,
  Star,
  Zap,
  Filter,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  User as UserIcon,
  Book,
  Sparkles,
  Bot,
  MessageSquare,
  Send,
  Loader2,
  Moon,
  Sun,
  Heart
} from 'lucide-react';
import { Question, UserStats, ExamType, SubjectType } from './types';
import { QUESTIONS } from './data/questions';
import { SYLLABUS_DATA, SyllabusTopic, Lesson } from './data/resources';
import { 
  auth, 
  loginWithGoogle, 
  logout, 
  signUpManual,
  loginManual,
  getUserProgress, 
  saveUserProgress 
} from './lib/firebase';
import { askTutor } from './lib/gemini';
import { onAuthStateChanged, User } from 'firebase/auth';
import ReactMarkdown from 'react-markdown';

// --- Sub-components (Simplified for brevity) ---

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
  <div className="bg-surface p-4 rounded-2xl shadow-sm border border-slate-border flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-sm text-stone-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-ink">{value}</p>
    </div>
  </div>
);

// --- Content Components ---

export default function App() {
  const [view, setView] = useState<'home' | 'dashboard' | 'study' | 'quiz' | 'resources' | 'stats' | 'auth' | 'community' | 'courseDetail'>('home');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('ace_exams_theme') as 'light' | 'dark') || 'light');
  const [aiModal, setAIModal] = useState<{ open: boolean, context: string }>({ open: false, context: '' });
  const [selectedCourse, setSelectedCourse] = useState<SyllabusTopic | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // --- New Student Centered Componets ---

  const LandingPage = () => (
    <div className="min-h-screen bg-bg-light overflow-x-hidden">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center p-2 shadow-lg shadow-brand-primary/20">
            <Sparkles className="w-full h-full text-white" />
          </div>
          <span className="text-2xl font-display font-extrabold text-ink tracking-tight">AceExams</span>
        </div>
        <div className="hidden md:flex items-center gap-8 font-semibold text-stone-600">
          <a href="#features" className="hover:text-brand-primary transition-colors">Features</a>
          <a href="#about" className="hover:text-brand-primary transition-colors">About</a>
          <a href="#community" className="hover:text-brand-primary transition-colors">Community</a>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('auth')}
            className="text-stone-600 font-bold hover:text-brand-primary"
          >
            Sign In
          </button>
          <button 
            onClick={() => { setIsSignUp(true); setView('auth'); }}
            className="btn-primary py-2 px-6"
          >
            Start Learning
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-brand-primary/10 rounded-full border border-brand-primary/10">
            <Bot className="w-4 h-4 text-brand-primary" />
            <span className="text-sm font-bold text-brand-primary uppercase tracking-wider">AI-Powered Learning Support</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-display font-extrabold leading-[1.1] text-ink">
            Master Your Exams <span className="text-gradient">With Confidence</span> & Joy
          </h1>
          <p className="text-xl text-stone-500 leading-relaxed max-w-lg">
            Join thousands of African students preparing for BECE, WASSCE, and modern digital skills. Learning has never felt this human.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={() => { setIsSignUp(true); setView('auth'); }}
              className="btn-primary w-full sm:w-auto px-10 py-5 text-lg"
            >
              Get Started for Free
            </button>
            <button 
              onClick={() => setView('resources')}
              className="btn-secondary w-full sm:w-auto px-10 py-5 text-lg flex items-center justify-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              Practice Exams
            </button>
          </div>
          <div className="flex items-center gap-6 pt-4">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-bg-light overflow-hidden shadow-sm bg-stone-200">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=student${i}`} 
                    alt="Student" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
            <p className="text-sm font-bold text-stone-400">
              <span className="text-brand-primary">12k+</span> students are studying right now
            </p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative"
        >
          <div className="relative z-10 w-full aspect-square rounded-[3rem] overflow-hidden shadow-2xl shadow-brand-primary/20 border-8 border-white">
            <img 
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop" 
              alt="Students smiling" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8">
              <div className="bg-white/90 backdrop-blur p-4 rounded-2xl flex items-center gap-4 border border-white/50">
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white">
                  <Zap className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">New Achievement</p>
                  <p className="text-sm font-bold text-ink">Kwame just mastered Core Maths!</p>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-brand-warm/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-24">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl font-display font-extrabold text-ink">Built for the Real Student Experience</h2>
            <p className="text-stone-500">Every feature is designed to make learning feel like a conversation with a mentor, not just another app.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { 
                title: "Practice Like a Pro", 
                desc: "Thousands of past questions from BECE and WAEC exams with detailed explanations.",
                icon: "📝",
                color: "bg-blue-50"
              },
              { 
                title: "Build True Confidence", 
                desc: "Our mock exams recreate the real atmosphere to reduce pressure and anxiety.",
                icon: "🛡️",
                color: "bg-purple-50"
              },
              { 
                title: "AI Study Buddy", 
                desc: "Get instant help from our AI Tutor whenever you're stuck on a difficult topic.",
                icon: "🤖",
                color: "bg-amber-50"
              },
              { 
                title: "Learn Digital Skills", 
                desc: "Go beyond exams with lessons in Frontend Dev, Computer Science, and more.",
                icon: "💻",
                color: "bg-green-50"
              },
              { 
                title: "Community Spirit", 
                desc: "Compete friendly on leaderboards and study together with students across Africa.",
                icon: "🤝",
                color: "bg-rose-50"
              },
              { 
                title: "See Your Growth", 
                desc: "Detailed visual progress tracking so you know exactly where you stand.",
                icon: "📈",
                color: "bg-indigo-50"
              }
            ].map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className={`${f.color} p-10 rounded-[2.5rem] border border-stone-50 transition-all`}
              >
                <div className="text-5xl mb-6">{f.icon}</div>
                <h3 className="text-xl font-bold text-ink mb-3">{f.title}</h3>
                <p className="text-stone-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-bg-light">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-md space-y-6">
            <h2 className="text-3xl font-display font-extrabold text-ink leading-tight text-center md:text-left">
              "It feels like I have a personal coach in my pocket."
            </h2>
            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="w-12 h-12 rounded-full bg-brand-primary overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=ama" alt="User" referrerPolicy="no-referrer"/>
              </div>
              <div>
                <p className="font-bold text-ink">Ama Serwaa</p>
                <p className="text-sm text-stone-500">BECE Candiate, Accra</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-12 grayscale opacity-40">
            <span className="text-2xl font-display font-black">GES OFFICIAL</span>
            <span className="text-2xl font-display font-black">WAEC PREP</span>
            <span className="text-2xl font-display font-black">BECE HUB</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="bg-ink rounded-[4rem] p-12 md:p-24 text-center space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary opacity-20 blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="space-y-4 max-w-2xl mx-auto relative z-10"
          >
            <h2 className="text-4xl md:text-6xl font-display font-extrabold text-white">Your Future <span className="text-gradient">Starts Today</span></h2>
            <p className="text-stone-400 text-lg">
              Don't wait for exam day to be ready. Join AceExams and start building your future with confidence.
            </p>
          </motion.div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <button 
              onClick={() => { setIsSignUp(true); setView('auth'); }}
              className="btn-primary px-12 py-5 text-lg"
            >
              Sign Up for Free
            </button>
            <button 
              onClick={() => setView('resources')}
              className="btn-secondary bg-transparent border-white/20 text-white hover:bg-white/5 px-12 py-5 text-lg leading-none"
            >
              View Courses
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-stone-200">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 text-stone-400 text-sm font-semibold">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-primary" />
            <span className="text-ink font-display font-bold text-lg">AceExams</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#" className="hover:text-brand-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-brand-primary transition-colors">Contact</a>
          </div>
          <p>© 2026 AceExams. For African Students everywhere.</p>
        </div>
      </footer>
    </div>
  );
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    examType: '' as ExamType | '',
    subjectType: '' as SubjectType | '',
    year: '' as string
  });

  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('ace_exams_stats');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...parsed, 
        points: parsed.points || 0,
        subjectStats: parsed.subjectStats || {},
        subjectScores: parsed.subjectScores || {},
        badges: parsed.badges || [],
        history: parsed.history || []
      };
    }
    return {
      totalAttempted: 0,
      totalCorrect: 0,
      streak: 0,
      points: 0,
      lastActive: new Date().toISOString(),
      subjectScores: {},
      subjectStats: {},
      badges: [],
      history: []
    };
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('ace_exams_theme', theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (currentUser) {
        try {
          const cloudStats = await getUserProgress(currentUser.uid);
          if (cloudStats) {
            setStats(cloudStats);
          } else {
            await saveUserProgress(currentUser.uid, stats);
          }
        } catch (error) {
          console.error("Firebase sync error:", error);
          setAuthError("Failed to sync progress with cloud. You are working offline.");
        }
      } else {
        const saved = localStorage.getItem('ace_exams_stats');
        if (saved) {
          setStats(JSON.parse(saved));
        } else {
          setStats({
            totalAttempted: 0,
            totalCorrect: 0,
            streak: 0,
            points: 0,
            lastActive: new Date().toISOString(),
            subjectScores: {},
            subjectStats: {},
            badges: [],
            history: []
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('ace_exams_stats', JSON.stringify(stats));
    if (user) {
      saveUserProgress(user.uid, stats);
    }
  }, [stats, user]);

  const filteredQuestions = useMemo(() => {
    return QUESTIONS.filter(q => {
      const matchSearch = q.question.toLowerCase().includes(filters.search.toLowerCase()) || 
                          q.subject.toLowerCase().includes(filters.search.toLowerCase());
      const matchExam = !filters.examType || q.exam_type === filters.examType;
      const matchType = !filters.subjectType || q.subject_type === filters.subjectType;
      const matchYear = !filters.year || q.year.toString() === filters.year;
      return matchSearch && matchExam && matchType && matchYear;
    });
  }, [filters]);

  const handleResetStats = async () => {
    const freshStats: UserStats = {
      totalAttempted: 0,
      totalCorrect: 0,
      streak: 0,
      points: 0,
      lastActive: new Date().toISOString(),
      subjectScores: {},
      subjectStats: {},
      badges: [],
      history: []
    };
    
    setStats(freshStats);
    localStorage.setItem('ace_exams_stats', JSON.stringify(freshStats));
    if (user) {
      await saveUserProgress(user.uid, freshStats);
    }
  };

  const handleLogout = async () => {
    await logout();
    setView('home');
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'resources', icon: Book, label: 'Courses' },
    { id: 'study', icon: BookOpen, label: 'Flash Cards' },
    { id: 'quiz', icon: Zap, label: 'Quizzes' },
    { id: 'community', icon: MessageSquare, label: 'Community' },
    { id: 'stats', icon: Trophy, label: 'Performance' },
  ];

  if (authLoading) return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
    </div>
  );

  if (view === 'home' && !user) return <LandingPage />;

  const renderDashboard = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header with Motivation */}
      <header className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-brand-primary p-1 shadow-2xl shadow-brand-primary/30">
                <img 
                  src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'guest'}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-[1.4rem] bg-white" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-accent rounded-xl flex items-center justify-center text-white border-4 border-bg-light shadow-lg">
                <Star className="w-4 h-4 fill-current" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-extrabold text-ink">
                Welcome back, <span className="text-gradient">{user?.displayName?.split(' ')[0] || 'Learner'}</span> ✨
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm font-bold text-stone-400 flex items-center gap-1">
                  <Zap className="w-4 h-4 text-brand-accent fill-current" />
                  {stats.streak} Day Study Streak
                </span>
                <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                <span className="text-sm font-bold text-stone-400">Master Level 4</span>
              </div>
            </div>
          </div>
          <div className="bg-surface p-4 rounded-3xl border border-slate-border flex items-center gap-6 shadow-sm">
            <div className="text-center">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">XP Points</p>
              <p className="text-xl font-display font-black text-brand-primary">{stats.points.toLocaleString()}</p>
            </div>
            <div className="w-px h-10 bg-slate-border"></div>
            <div className="text-center">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Rank</p>
              <p className="text-xl font-display font-black text-brand-accent">Top 5%</p>
            </div>
          </div>
        </div>

        {/* Motivation Card */}
        <div className="bg-warm-gradient border border-brand-warm/10 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-sm">
          <div className="w-20 h-20 bg-brand-warm/20 rounded-full flex items-center justify-center text-4xl shadow-inner">
            💡
          </div>
          <div className="flex-1 space-y-2 text-center md:text-left">
            <h3 className="text-lg font-bold text-ink">Today's Focus: Master Modern Science</h3>
            <p className="text-stone-500 italic">"Education is the most powerful weapon which you can use to change the world." — Nelson Mandela</p>
          </div>
          <button className="btn-accent px-8 py-4 whitespace-nowrap">Start Session</button>
        </div>
      </header>

      {/* Grid: Recommended & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-display font-extrabold text-ink">Recommended for You</h3>
            <button className="text-brand-primary font-bold text-sm hover:underline">View All</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: "Past Questions 2024", subject: "Mathematics", duration: "15 mins", color: "bg-blue-500" },
              { title: "Photosynthesis Explained", subject: "Science", duration: "10 mins", color: "bg-emerald-500" },
            ].map((course, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ scale: 1.02 }}
                className="interactive-card flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 ${course.color} rounded-2xl flex items-center justify-center text-white p-2 shadow-lg`}>
                    <BookOpen className="w-full h-full" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-ink leading-tight">{course.title}</h4>
                    <p className="text-stone-400 font-semibold text-sm">{course.subject}</p>
                  </div>
                </div>
                <div className="pt-6 flex items-center justify-between border-t border-stone-50 mt-6">
                  <span className="text-xs font-bold text-stone-500">{course.duration}</span>
                  <button className="text-brand-primary font-black uppercase text-[10px] tracking-widest hover:translate-x-1 transition-transform flex items-center gap-1">
                    Play Now <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Side Progress */}
        <div className="space-y-8">
          <h3 className="text-2xl font-display font-extrabold text-ink">Your Progress</h3>
          <div className="bg-surface rounded-[2.5rem] border border-slate-border p-8 shadow-sm space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-sm font-bold text-stone-500 uppercase tracking-widest">Mathematics</p>
                <p className="text-lg font-display font-black text-ink">85%</p>
              </div>
              <div className="h-3 bg-bg-light rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  className="h-full bg-brand-primary rounded-full shadow-lg shadow-brand-primary/30"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-sm font-bold text-stone-500 uppercase tracking-widest">General Science</p>
                <p className="text-lg font-display font-black text-ink">62%</p>
              </div>
              <div className="h-3 bg-bg-light rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '62%' }}
                  className="h-full bg-brand-secondary rounded-full shadow-lg shadow-brand-secondary/30"
                />
              </div>
            </div>
            <div className="pt-4 text-center">
              <p className="text-sm text-stone-500 leading-relaxed">
                You're doing great! You mastered <span className="font-bold text-brand-primary">Algebra</span> this week.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Community Teaser */}
      <div className="bg-stone-900 dark:bg-stone-800 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <MessageSquare className="w-48 h-48" />
        </div>
        <div className="space-y-4 relative z-10 text-center md:text-left">
          <h3 className="text-3xl font-display font-black">Learn together, succeed together!</h3>
          <p className="text-stone-400 max-w-md">Join the study group for tomorrow's WAEC Prep simulation. 240 students joined today.</p>
        </div>
        <button 
          onClick={() => setView('community')}
          className="btn-primary bg-white text-ink hover:bg-stone-100 dark:hover:bg-stone-200 relative z-10 px-10 py-5"
        >
          Join Study Group
        </button>
      </div>
    </div>
  );

  const renderCommunity = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <header className="space-y-4">
        <h2 className="text-5xl font-display font-extrabold text-ink leading-tight">Student Community</h2>
        <p className="text-stone-500 text-lg max-w-2xl">Connect with millions of students. Ask questions, share your growth, and find study partners for your exams.</p>
      </header>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-surface p-8 rounded-[2.5rem] border border-slate-border flex items-center gap-4 shadow-sm">
             <div className="w-14 h-14 rounded-2xl bg-bg-light flex items-center justify-center">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="User" className="w-10 h-10" />
             </div>
             <input 
               type="text" 
               placeholder="What's on your mind today?" 
               className="flex-1 bg-bg-light py-4 px-8 rounded-3xl outline-none focus:ring-4 ring-brand-primary/10 transition-all font-medium text-ink"
             />
             <button className="btn-primary py-4 px-10">Share</button>
          </div>

          {[
            { user: "Kwesi Appiah", role: "WASSCE Candidate", content: "Does anyone have a simplified explanation for the Nitrogen Cycle? The textbook definitions are a bit hard for me.", time: "2h ago", likes: 24, replies: 12, seed: "kwesi" },
            { user: "Fatima Jallow", role: "Computer Science Student", content: "Just finished the React basics course! If anyone is starting out, let's form a study group for the final project. 🚀", time: "5h ago", likes: 45, replies: 8, seed: "fatima" },
          ].map((post, idx) => (
            <motion.div 
              key={idx}
              className="bg-surface p-10 rounded-[3rem] border border-slate-border space-y-6 shadow-sm hover:border-brand-primary/10 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl border border-slate-border overflow-hidden shrink-0 bg-bg-light">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.seed}`} alt="User" />
                </div>
                <div>
                  <p className="font-display font-black text-ink">{post.user}</p>
                  <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">{post.role}</p>
                </div>
                <span className="ml-auto text-xs font-bold text-stone-300">{post.time}</span>
              </div>
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-xl font-medium">{post.content}</p>
              <div className="flex items-center gap-8 pt-6 border-t border-slate-border">
                <button className="flex items-center gap-2 text-stone-400 hover:text-brand-primary font-bold transition-colors">
                  <Heart className="w-5 h-5" /> {post.likes}
                </button>
                <button className="flex items-center gap-2 text-stone-400 hover:text-brand-secondary font-bold transition-colors">
                  <MessageSquare className="w-5 h-5" /> {post.replies}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-ink rounded-[2.5rem] p-10 text-white space-y-8 relative overflow-hidden">
              <Bot className="absolute -right-10 -top-10 w-40 h-40 opacity-5" />
              <h3 className="text-2xl font-display font-black relative z-10">Top Mentors</h3>
              <div className="space-y-6 relative z-10">
                {[
                  { name: "Dr. Ben", subject: "Mathematics Expert", xp: "15.2k", seed: "ben" },
                  { name: "Sarah A.", subject: "Science Guru", xp: "12.8k", seed: "sarah" },
                  { name: "Musa T.", subject: "Code Wizard", xp: "10.1k", seed: "musa" },
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-4 group cursor-pointer">
                    <div className="w-12 h-12 rounded-2xl border border-white/10 overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.seed}`} alt="Mentor" />
                    </div>
                    <div>
                      <p className="font-display font-black text-white text-sm">{m.name}</p>
                      <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">{m.subject}</p>
                    </div>
                    <div className="ml-auto text-brand-primary font-black text-xs">{m.xp}</div>
                  </div>
                ))}
              </div>
              <button className="w-full bg-white/5 border border-white/10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white text-white hover:text-ink transition-all">Become a Mentor</button>
           </div>
        </div>
      </div>
    </div>
  );

  const renderStudy = () => (
    <StudyMode 
      onBack={() => setView('dashboard')} 
      questions={filteredQuestions} 
      onAskAI={(ctx) => setAIModal({ open: true, context: ctx })} 
      onCardAction={(subject, isCorrect) => {
        setStats(prev => {
          const newSubjectStats = { ...prev.subjectStats };
          const newSubjectScores = { ...prev.subjectScores };

          const existing = newSubjectStats[subject] || { attempted: 0, correct: 0 };
          const updated = {
            attempted: existing.attempted + 1,
            correct: existing.correct + (isCorrect ? 1 : 0)
          };
          
          newSubjectStats[subject] = updated;
          newSubjectScores[subject] = Math.round((updated.correct / updated.attempted) * 100);

          return {
            ...prev,
            totalAttempted: prev.totalAttempted + 1,
            totalCorrect: prev.totalCorrect + (isCorrect ? 1 : 0),
            points: prev.points + (isCorrect ? 15 : 5), 
            lastActive: new Date().toISOString(),
            subjectStats: newSubjectStats,
            subjectScores: newSubjectScores
          };
        });
      }} 
    />
  );

  const renderQuiz = () => (
    <QuizModeView 
      onBack={() => setView('dashboard')} 
      questions={filteredQuestions} 
      onAskAI={(ctx) => setAIModal({ open: true, context: ctx })} 
      onFinish={(correct, subjectSummary, xpEarned, timeSpent) => {
        setStats(prev => {
          const newSubjectStats = { ...prev.subjectStats };
          const newSubjectScores = { ...prev.subjectScores };
          const newHistory = [...(prev.history || [])];

          Object.entries(subjectSummary).forEach(([subject, data]) => {
            const existing = newSubjectStats[subject] || { attempted: 0, correct: 0 };
            const updated = {
              attempted: existing.attempted + data.attempted,
              correct: existing.correct + data.correct
            };
            newSubjectStats[subject] = updated;
            newSubjectScores[subject] = Math.round((updated.correct / updated.attempted) * 100);
          });

          // Add to history
          newHistory.unshift({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            subject: 'Mixed Quiz',
            score: correct,
            total: Object.values(subjectSummary).reduce((acc, curr) => acc + curr.attempted, 0),
            xpEarned: xpEarned,
            duration: timeSpent
          });

          // Limit history to last 20
          if (newHistory.length > 20) newHistory.pop();

          // Badge logic
          const newBadges = [...(prev.badges || [])];
          const hasBadge = (id: string) => newBadges.some(b => b.id === id);

          if (!hasBadge('first_quiz')) {
            newBadges.push({ id: 'first_quiz', name: 'Quiz Veteran', description: 'Completed your first quiz session!', icon: '🏆', earnedAt: new Date().toISOString() });
          }
          if (correct >= 50 && !hasBadge('50_master')) {
            newBadges.push({ id: '50_master', name: 'Exam Master', description: 'Correctly answered 50 questions in one session.', icon: '👑', earnedAt: new Date().toISOString() });
          }

          return {
            ...prev,
            totalAttempted: prev.totalAttempted + Object.values(subjectSummary).reduce((acc, curr) => acc + curr.attempted, 0),
            totalCorrect: prev.totalCorrect + correct,
            points: prev.points + xpEarned,
            streak: prev.streak + 1,
            lastActive: new Date().toISOString(),
            subjectStats: newSubjectStats,
            subjectScores: newSubjectScores,
            history: newHistory,
            badges: newBadges
          };
        });
      }} 
    />
  );

  const renderCourseDetail = () => {
    if (!selectedCourse) return null;

    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <button 
              onClick={() => setView('resources')}
              className="flex items-center gap-2 text-stone-400 font-bold text-xs uppercase tracking-widest hover:text-brand-primary transition-colors mb-4"
            >
              <RotateCcw className="w-4 h-4" /> Back to Library
            </button>
            <h2 className="text-5xl font-display font-extrabold text-ink leading-tight">{selectedCourse.title}</h2>
            <p className="text-stone-500 text-lg max-w-2xl">{selectedCourse.description}</p>
          </div>
          <div className="flex gap-3">
             <div className="bg-surface px-6 py-4 rounded-2xl border border-slate-border text-center shadow-sm">
                <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest mb-1">Duration</p>
                <p className="text-lg font-display font-black text-ink">45m Total</p>
             </div>
             <div className="bg-surface px-6 py-4 rounded-2xl border border-slate-border text-center shadow-sm">
                <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest mb-1">Level</p>
                <p className="text-lg font-display font-black text-brand-primary">Intermediate</p>
             </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-10">
          {/* Sidebar: Lesson List */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xl font-display font-black text-ink">Syllabus</h3>
            <div className="space-y-3">
              {selectedCourse.lessons.map((lesson, idx) => (
                <button
                  key={lesson.id}
                  onClick={() => setSelectedLesson(lesson)}
                  className={`w-full text-left p-6 rounded-3xl border transition-all flex items-center justify-between group ${
                    selectedLesson?.id === lesson.id 
                      ? 'bg-brand-primary border-brand-primary text-white shadow-xl shadow-brand-primary/20' 
                      : 'bg-surface border-slate-border text-ink hover:border-brand-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-black text-sm ${
                      selectedLesson?.id === lesson.id ? 'bg-white/20' : 'bg-bg-light text-stone-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight">{lesson.title}</p>
                      <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                        selectedLesson?.id === lesson.id ? 'text-white/60' : 'text-stone-300'
                      }`}>
                        {lesson.duration || '10 mins'}
                      </p>
                    </div>
                  </div>
                  {selectedLesson?.id === lesson.id && (
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 fill-current" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="bg-ink rounded-[2.5rem] p-8 text-white space-y-6 mt-8">
               <Bot className="w-12 h-12 text-brand-primary" />
               <p className="font-medium text-sm leading-relaxed text-white/80">Need help with this topic? Ask your AI tutor for a simpler explanation.</p>
               <button 
                 onClick={() => setAIModal({ open: true, context: `Explain more about ${selectedLesson?.title || selectedCourse.title}` })}
                 className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
               >
                 Ask AI Tutor
               </button>
            </div>
          </div>

          {/* Main Content: Lesson Player */}
          <div className="lg:col-span-8">
            {selectedLesson ? (
              <motion.div 
                key={selectedLesson.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-surface rounded-[4rem] border border-slate-border p-12 md:p-16 shadow-sm min-h-[600px] flex flex-col"
              >
                <div className="mb-10 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Active Study Room</span>
                   </div>
                   <div className="flex items-center gap-4">
                      <button className="text-stone-300 hover:text-brand-primary transition-colors"><Star className="w-5 h-5" /></button>
                      <button className="text-stone-300 hover:text-brand-primary transition-colors"><Send className="w-5 h-5" /></button>
                   </div>
                </div>

                <div className="markdown-body prose prose-stone lg:prose-xl dark:prose-invert max-w-none flex-1">
                  <ReactMarkdown>{selectedLesson.content}</ReactMarkdown>
                </div>

                <div className="mt-16 pt-8 border-t border-slate-border flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="flex -space-x-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-surface bg-bg-light overflow-hidden shadow-sm">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`} alt="Student" />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs font-bold text-stone-400">12 students studying this now</p>
                   </div>
                   <button 
                     onClick={() => {
                        const currentIndex = selectedCourse.lessons.findIndex(l => l.id === selectedLesson.id);
                        if (currentIndex < selectedCourse.lessons.length - 1) {
                          setSelectedLesson(selectedCourse.lessons[currentIndex + 1]);
                        } else {
                          // Finish course?
                          setView('quiz');
                        }
                     }}
                     className="btn-primary px-10 py-4 flex items-center gap-2"
                   >
                     {selectedCourse.lessons.findIndex(l => l.id === selectedLesson.id) === selectedCourse.lessons.length - 1 ? 'Start Practice Quiz' : 'Next Lesson'}
                     <ChevronRight className="w-4 h-4" />
                   </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-20 text-center bg-bg-light rounded-[4rem] border-4 border-dashed border-slate-border">
                 <div className="space-y-4">
                    <Book className="w-16 h-16 text-stone-200 mx-auto" />
                    <p className="text-stone-400 font-bold">Select a lesson from the sidebar to start studying.</p>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResources = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full text-emerald-600 font-bold text-xs uppercase tracking-widest border border-emerald-100">
          <Book className="w-3 h-3" />
          Verified Learning Path
        </div>
        <h2 className="text-5xl font-display font-extrabold text-ink leading-tight">Your Course Library</h2>
        <p className="text-stone-500 text-lg max-w-2xl">Find everything you need to succeed, organized by experts. Practical, relatable, and easy to follow.</p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {SYLLABUS_DATA.map((subject, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ y: -8 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-brand-primary/5 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 bg-surface p-8 rounded-[2.5rem] border border-slate-border shadow-sm space-y-6 hover:border-brand-primary/20 transition-all cursor-pointer"
            onClick={() => {
              setSelectedCourse(subject);
              setSelectedLesson(subject.lessons[0] || null);
              setView('courseDetail');
            }}
          >
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 bg-bg-light rounded-2xl flex items-center justify-center text-3xl group-hover:bg-brand-primary group-hover:text-white transition-colors duration-500">
                {subject.subject.toLowerCase().includes('math') ? '🧮' : subject.subject.toLowerCase().includes('science') ? '🧬' : '🌍'}
              </div>
              <div className="flex -space-x-2">
                 {[1, 2, 3].map(i => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-surface bg-bg-light overflow-hidden shadow-sm">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=resource${i}${idx}`} alt="Mentor" referrerPolicy="no-referrer" />
                   </div>
                 ))}
              </div>
            </div>
              
              <div>
                <h3 className="text-2xl font-display font-black text-ink mb-2">{subject.title}</h3>
                <p className="text-stone-400 font-bold text-xs uppercase tracking-[0.2em]">{subject.lessons.length} Lessons Available</p>
              </div>

              <div className="space-y-3">
                {subject.subtopics.slice(0, 3).map((topic, tidx) => (
                  <div key={tidx} className="flex items-center gap-3 text-stone-500 font-medium">
                    <div className="w-1.5 h-1.5 bg-brand-primary rounded-full"></div>
                    {topic}
                  </div>
                ))}
              </div>

              <div className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-2 group-hover:bg-ink group-hover:ring-4 group-hover:ring-brand-primary/10 transition-all">
                View Lessons
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-brand-primary rounded-[3rem] p-12 text-white flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
        <Bot className="absolute -left-10 -bottom-10 w-48 h-48 opacity-10" />
        <div className="space-y-4 relative z-10 max-w-xl text-center md:text-left">
           <h3 className="text-3xl font-display font-black">Missing something? Ask your Mentor.</h3>
           <p className="text-white/80 font-medium leading-relaxed">Our AI Mentor has access to the full GES and WAEC archives. Ask anything about science, maths, or computer studies!</p>
        </div>
        <button 
          onClick={() => setAIModal({ open: true, context: 'Help me find a learning topic.' })}
          className="bg-white text-brand-primary px-12 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl relative z-10 shadow-brand-primary/40 whitespace-nowrap"
        >
          Open AI Chat
        </button>
      </div>
    </div>
  );

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isSignUp) {
        const newUser = await signUpManual(email, password, authDisplayName);
        const freshStats: UserStats = {
          totalAttempted: 0,
          totalCorrect: 0,
          streak: 0,
          points: 0,
          lastActive: new Date().toISOString(),
          subjectScores: {},
          subjectStats: {},
          badges: [],
          history: []
        };
        await saveUserProgress(newUser.uid, freshStats);
        setStats(freshStats);
      } else {
        await loginManual(email, password);
      }
      setView('dashboard');
    } catch (err: any) {
      let message = err.message || "Authentication failed";
      if (err.code === 'auth/operation-not-allowed') {
        message = "Email/Password sign-in is not enabled in Firebase Console. Please enable it under Authentication > Sign-in method.";
      }
      setAuthError(message);
    }
  };

  const renderAuth = () => (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="max-w-md w-full bg-surface p-10 rounded-[3rem] border border-slate-border shadow-2xl text-center space-y-8 relative overflow-hidden">
        {/* Background Geometric Decor */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl opacity-50"></div>

        <div className="relative space-y-6">
          <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-brand-primary/20 rotate-12">
            <UserIcon className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              {isSignUp ? 'Start your journey to BECE excellence today.' : 'Sign in to continue your mastery journey.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4 relative">
          {authError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {authError}
            </div>
          )}
          
          <div className="space-y-3">
            {isSignUp && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={authDisplayName}
                  onChange={(e) => setAuthDisplayName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-bg-light border-2 border-slate-border rounded-2xl focus:border-brand-primary focus:bg-surface transition-all outline-none text-ink font-medium placeholder:text-slate-500"
                />
              </div>
            )}
            <div className="relative">
              <input
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-bg-light border-2 border-slate-border rounded-2xl focus:border-brand-primary focus:bg-surface transition-all outline-none text-ink font-medium placeholder:text-slate-500"
              />
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-bg-light border-2 border-slate-border rounded-2xl focus:border-brand-primary focus:bg-surface transition-all outline-none text-ink font-medium placeholder:text-slate-500"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full btn-primary py-4 rounded-2xl text-lg shadow-xl shadow-brand-primary/20 active:scale-[0.98] transition-transform"
          >
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>

          <div className="pt-2">
            <button 
              type="button" 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm font-bold text-slate-400 hover:text-brand-primary transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-border/50"></div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Or Continue With</span>
            <div className="h-px flex-1 bg-slate-border/50"></div>
          </div>

          <button 
            type="button"
            onClick={async () => {
              try {
                await loginWithGoogle();
                setView('dashboard');
              } catch (e) {
                console.error(e);
              }
            }}
            className="w-full flex items-center justify-center gap-3 py-3 bg-surface border-2 border-slate-border rounded-2xl font-bold text-slate-400 hover:border-brand-primary transition-all active:scale-95 text-sm"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            Google
          </button>
        </div>

        <button 
          onClick={() => setView('dashboard')}
          className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hover:text-slate-600 transition-colors"
        >
          Skip and Browse
        </button>
      </div>
    </div>
  );

  if (authLoading) return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center text-brand-primary">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 bg-brand-primary/10 rounded-[2rem] blur-xl absolute -inset-2"></div>
          <Loader2 className="w-16 h-16 animate-spin relative z-10" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">Synchronizing your progress...</p>
      </div>
    </div>
  );

  if (view === 'home' && !user) return <LandingPage />;

  return (
    <div className="min-h-screen bg-bg-light flex overflow-hidden">
      {/* --- Desktop Sidebar --- */}
      <aside className="hidden md:flex w-72 bg-surface border-r border-slate-border flex-col py-10 px-6 gap-10 shrink-0">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary rounded-2xl flex items-center justify-center p-2 shadow-lg shadow-brand-primary/20">
              <Sparkles className="w-full h-full text-white" />
            </div>
            <span className="text-2xl font-display font-extrabold text-ink tracking-tight">AceExams</span>
          </div>
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="w-10 h-10 rounded-xl bg-bg-light flex items-center justify-center text-stone-400 hover:text-brand-primary transition-all border border-slate-border hover:shadow-lg"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as any)}
              className={`w-full group ${view === item.id ? 'nav-item-active' : 'nav-item'}`}
            >
              <item.icon className={`w-5 h-5 ${view === item.id ? 'text-brand-primary' : 'text-stone-400 group-hover:text-brand-primary'}`} />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="space-y-4">
          <div className="bg-warm-gradient p-6 rounded-3xl border border-brand-warm/10 relative overflow-hidden">
            <Bot className="absolute -right-4 -bottom-4 w-16 h-16 text-brand-warm/20" />
            <p className="text-xs font-bold text-brand-warm uppercase tracking-widest mb-1">Mentor Tip</p>
            <p className="text-xs text-stone-600 font-medium leading-relaxed">Try the Science flashcards for 5 mins today to maintain your streak!</p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-3 text-stone-400 hover:text-rose-500 font-bold transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col relative h-screen overflow-y-auto no-scrollbar pb-24 md:pb-0">
        {/* Mobile Nav Top Bar */}
        <div className="md:hidden flex items-center justify-between p-6 bg-surface border-b border-slate-border sticky top-0 z-40">
           <div className="flex items-center gap-2">
             <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center p-2">
               <Sparkles className="w-full h-full text-white" />
             </div>
             <span className="font-display font-black text-2xl text-ink">AceExams</span>
           </div>
           <div className="flex items-center gap-4">
             <button 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="w-10 h-10 rounded-xl bg-bg-light flex items-center justify-center text-stone-400"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
             <div 
               className="w-10 h-10 rounded-xl overflow-hidden border border-slate-border"
               onClick={() => setView('auth')}
             >
                <img 
                  src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'guest'}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
             </div>
           </div>
        </div>

        <div className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {view === 'dashboard' && renderDashboard()}
              {view === 'study' && renderStudy()}
              {view === 'quiz' && renderQuiz()}
              {view === 'resources' && renderResources()}
              {view === 'courseDetail' && renderCourseDetail()}
              {view === 'stats' && <StatsView user={user} stats={stats} onBack={() => setView('dashboard')} onReset={handleResetStats} />}
              {view === 'auth' && renderAuth()}
              {view === 'community' && renderCommunity()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden fixed bottom-6 left-6 right-6 bg-stone-900 dark:bg-stone-800 shadow-2xl shadow-stone-900/40 rounded-[2.5rem] p-3 flex items-center justify-around z-50">
           {[
             { id: 'dashboard', icon: LayoutDashboard },
             { id: 'resources', icon: Book },
             { id: 'quiz', icon: Zap },
             { id: 'community', icon: MessageSquare },
           ].map(item => (
             <button 
               key={item.id} 
               onClick={() => setView(item.id as any)}
               className={`p-4 rounded-3xl transition-all ${view === item.id ? 'bg-brand-primary text-white scale-110 shadow-lg' : 'text-stone-400 hover:bg-white/5'}`}
             >
               <item.icon className="w-6 h-6" />
             </button>
           ))}
        </div>
      </main>

      {/* --- Persistent AI Tutor Button --- */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setAIModal({ open: true, context: 'General Support' })}
        className="fixed bottom-32 md:bottom-12 right-6 md:right-12 w-20 h-20 bg-brand-primary text-white rounded-3xl shadow-2xl shadow-brand-primary/40 flex items-center justify-center z-50 group border-4 border-white dark:border-stone-800"
      >
        <Bot className="w-10 h-10 group-hover:hidden" />
        <Sparkles className="w-10 h-10 hidden group-hover:block animate-pulse" />
        <div className="absolute right-full mr-6 px-5 py-3 bg-stone-900 text-white text-sm font-bold rounded-2xl opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 whitespace-nowrap pointer-events-none shadow-2xl">
           Stuck? Ask your AI Tutor! ✨
        </div>
      </motion.button>

      {/* Modals */}
      <AITutorModal 
        isOpen={aiModal.open} 
        onClose={() => setAIModal({ ...aiModal, open: false })} 
        initialContext={aiModal.context} 
      />
    </div>
  );
}

// --- Study Mode ---

function StudyMode({ 
  onBack, 
  questions, 
  onAskAI,
  onCardAction 
}: { 
  onBack: () => void, 
  questions: Question[], 
  onAskAI: (context: string) => void,
  onCardAction: (subject: string, isCorrect: boolean) => void 
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionFinished, setSessionFinished] = useState<Set<string>>(new Set());

  const current = questions[index];

  const handleAction = (isCorrect: boolean) => {
    if (!sessionFinished.has(current.id)) {
      onCardAction(current.subject, isCorrect);
      setSessionFinished(prev => new Set(prev).add(current.id));
    }
    
    if (index < questions.length - 1) {
      setIndex(i => i + 1);
      setFlipped(false);
    } else {
      onBack();
    }
  };

  if (!current) return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
      <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center text-stone-300">
        <BookOpen className="w-10 h-10" />
      </div>
      <p className="text-xl font-bold text-stone-500">No questions found. Try adjusting filters.</p>
      <button onClick={onBack} className="btn-secondary px-8">Go Back</button>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="group flex items-center gap-3 text-stone-400 hover:text-ink font-bold transition-all">
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center group-hover:bg-stone-200">
            <X className="w-5 h-5" />
          </div>
          Exit Session
        </button>
        <div className="bg-white px-6 py-2 rounded-full border border-stone-100 font-display font-black text-ink shadow-sm">
           {index + 1} <span className="text-stone-300 mx-2">/</span> {questions.length}
        </div>
      </div>

      <div className="relative group perspective-1000">
        <div 
          className={`flip-card w-full h-[450px] cursor-pointer ${flipped ? 'flipped' : ''}`}
          onClick={() => setFlipped(!flipped)}
        >
          <div className="flip-card-inner">
            {/* Front */}
            <div className="flip-card-front bg-surface border border-slate-border shadow-2xl rounded-[3rem] p-12 flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-brand-primary/5 rounded-br-[100%]"></div>
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-xs font-black text-brand-primary uppercase tracking-[0.2em]">{current.subject}</span>
                <span className="text-2xl font-display font-black text-stone-300 dark:text-stone-700 italic">#{current.year}</span>
              </div>
              
              <div className="relative z-10 space-y-6">
                {current.passage && (
                  <div className="bg-bg-light p-6 rounded-2xl border border-slate-border text-sm italic text-stone-500 leading-relaxed text-left max-h-32 overflow-y-auto">
                    {current.passage}
                  </div>
                )}
                <h2 className="text-4xl md:text-5xl font-display font-extrabold leading-[1.1] text-ink text-center">
                  {current.question}
                </h2>
              </div>
              
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-bg-light rounded-full flex items-center justify-center text-brand-primary animate-bounce">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Tap to flip card</p>
              </div>
            </div>

            {/* Back */}
            <div className="flip-card-back bg-brand-primary shadow-2xl rounded-[3rem] p-12 flex flex-col justify-between text-white text-center">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Suggested Answer</p>
                <h3 className="text-5xl font-display font-black drop-shadow-xl">{current.correct_answer}</h3>
                <div className="w-16 h-1 w-white/20 mx-auto rounded-full"></div>
              </div>

              <div className="bg-white/10 p-8 rounded-[2rem] border border-white/10 text-left space-y-4">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Deep Explanation</p>
                   <button 
                     onClick={(e) => { e.stopPropagation(); onAskAI(`Explain this: ${current.question}. Answer: ${current.correct_answer}`); }}
                     className="bg-white text-brand-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                   >
                     AI Tutor Help
                   </button>
                </div>
                <p className="text-sm font-medium leading-relaxed text-white/90">{current.explanation}</p>
              </div>

              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tap to flip back</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {flipped ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="grid grid-cols-2 gap-6 max-w-2xl mx-auto"
          >
            <button 
              onClick={(e) => { e.stopPropagation(); handleAction(true); }}
              className="group p-8 bg-emerald-500 text-white rounded-[2rem] font-display font-black text-xl hover:bg-emerald-600 transition-all flex flex-col items-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95"
            >
              <CheckCircle2 className="w-10 h-10 group-hover:scale-110 transition-transform" />
              I Know This!
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleAction(false); }}
              className="group p-8 bg-stone-900 text-white rounded-[2rem] font-display font-black text-xl hover:bg-black transition-all flex flex-col items-center gap-3 shadow-xl shadow-black/20 active:scale-95"
            >
              <AlertCircle className="w-10 h-10 group-hover:scale-110 transition-transform text-rose-500" />
              Study Again
            </button>
          </motion.div>
        ) : (
          <div className="flex items-center justify-center gap-6">
            <button 
              disabled={index === 0}
              onClick={() => setIndex(i => i - 1)}
              className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-ink disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronRight className="w-8 h-8 rotate-180" />
            </button>
            <button 
              onClick={() => setIndex(i => i + 1)}
              disabled={index === questions.length - 1}
              className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-ink disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Quiz Mode ---

function QuizModeView({ onBack, questions, onAskAI, onFinish }: { 
  onBack: () => void, 
  questions: Question[], 
  onAskAI: (context: string) => void,
  onFinish: (correct: number, subjectSummary: Record<string, { attempted: number, correct: number }>, xp: number, time: number) => void 
}) {
  const [step, setStep] = useState<'config' | 'running' | 'results'>('config');
  const [quizConfig, setQuizConfig] = useState<{ limit: number, subject: string }>({ limit: 0, subject: 'Mixed' });
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [motivation, setMotivation] = useState('');

  const MOTIVATIONS = [
    "You're on fire! Keep it up! 🔥",
    "Brilliant thinking! 🧠",
    "You're becoming a master! ✨",
    " Ghanaian Excellence in action! 🇬🇭",
    "Keep pushing, you're doing great! 💪",
    "Knowledge is power, and you have it! ⚡",
    "Success is just a few questions away! 🎓"
  ];

  useEffect(() => {
    let interval: any;
    if (step === 'running' && !isPaused && !showExplanation) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, isPaused, showExplanation]);

  const startQuiz = (limit: number) => {
    const shuffled = [...questions].sort(() => 0.5 - Math.random()).slice(0, limit).map(q => ({
      ...q,
      options: [...q.options].sort(() => 0.5 - Math.random())
    }));
    setQuizQuestions(shuffled);
    setQuizConfig({ ...quizConfig, limit });
    setTimer(0);
    setStep('running');
  };

  const handleSelect = (option: string) => {
    if (showExplanation || isPaused) return;
    setAnswers(prev => ({ ...prev, [quizQuestions[currentIndex].id]: option }));
    setMotivation(MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)]);
    setShowExplanation(true);
  };

  const next = () => {
    if (currentIndex === quizQuestions.length - 1) {
      const correct = quizQuestions.filter(q => answers[q.id] === q.correct_answer).length;
      
      const subjectSummary: Record<string, { attempted: number, correct: number }> = {};
      quizQuestions.forEach(q => {
        if (!subjectSummary[q.subject]) {
          subjectSummary[q.subject] = { attempted: 0, correct: 0 };
        }
        subjectSummary[q.subject].attempted += 1;
        if (answers[q.id] === q.correct_answer) {
          subjectSummary[q.subject].correct += 1;
        }
      });

      const xpEarned = correct * 25 + (quizConfig.limit >= 50 ? 500 : quizConfig.limit >= 35 ? 250 : 100);
      onFinish(correct, subjectSummary, xpEarned, timer);
      setStep('results');
    } else {
      setCurrentIndex(i => i + 1);
      setShowExplanation(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (step === 'config') return (
    <div className="space-y-12 py-10 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-5xl mx-auto">
      <header className="text-center space-y-6">
        <div className="w-24 h-24 bg-brand-primary rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-brand-primary/40 rotate-12">
          <Zap className="w-12 h-12 text-white fill-current" />
        </div>
        <h2 className="text-5xl font-display font-extrabold text-ink">Quiz Arena</h2>
        <p className="text-stone-500 font-medium text-lg leading-relaxed max-w-2xl mx-auto">
          Challenge yourself, earn XP, and master your subjects. Choose a mode to begin your training session.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            id: 'quick', 
            name: 'Quick Practice', 
            limit: 20, 
            time: '15m', 
            difficulty: 'Easy', 
            xp: '100+ Bonus XP', 
            desc: 'Ideal for a quick study break or refresher.', 
            color: 'bg-emerald-500',
            icon: Zap 
          },
          { 
            id: 'standard', 
            name: 'Standard Challenge', 
            limit: 35, 
            time: '30m', 
            difficulty: 'Medium', 
            xp: '250+ Bonus XP', 
            desc: 'Test your endurance with a balanced set.', 
            color: 'bg-brand-primary',
            icon: Trophy 
          },
          { 
            id: 'full', 
            name: 'Full Exam Mode', 
            limit: 50, 
            time: '45m+', 
            difficulty: 'Hard', 
            xp: '500+ Bonus XP', 
            desc: 'The ultimate prep. Simulates real exam depth.', 
            color: 'bg-ink',
            icon: Star 
          },
        ].map(mode => (
          <button 
            key={mode.id}
            onClick={() => startQuiz(mode.limit)}
            className="group relative bg-surface p-10 rounded-[3rem] border border-slate-border hover:border-brand-primary transition-all active:scale-95 shadow-sm hover:shadow-2xl text-left flex flex-col justify-between h-full"
          >
            <div className="space-y-6">
              <div className={`w-16 h-16 ${mode.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                <mode.icon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-black text-ink">{mode.name}</h3>
                <p className="text-stone-400 font-medium mt-2 leading-relaxed">{mode.desc}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-bg-light rounded-full text-[10px] font-black uppercase tracking-widest text-stone-400 border border-slate-border">{mode.limit} Qs</span>
                <span className="px-3 py-1 bg-bg-light rounded-full text-[10px] font-black uppercase tracking-widest text-stone-400 border border-slate-border">{mode.time}</span>
                <span className="px-3 py-1 bg-bg-light rounded-full text-[10px] font-black uppercase tracking-widest text-stone-400 border border-slate-border">{mode.difficulty}</span>
              </div>
            </div>
            
            <div className="mt-10 pt-6 border-t border-slate-border flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Rewards</p>
                <p className="text-brand-primary font-black text-sm">{mode.xp}</p>
              </div>
              <ChevronRight className="w-6 h-6 text-stone-200 group-hover:translate-x-1 group-hover:text-brand-primary transition-all" />
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-6">
          <button onClick={onBack} className="flex items-center gap-2 text-stone-400 font-bold hover:text-ink transition-colors py-4 uppercase tracking-widest text-xs">
            <X className="w-4 h-4" /> Maybe Later
          </button>
          <div className="p-6 bg-brand-primary/5 rounded-[2rem] border border-brand-primary/10 flex items-center gap-4 max-w-lg">
             <Sparkles className="w-6 h-6 text-brand-primary shrink-0" />
             <p className="text-sm text-stone-600 font-medium">Daily Challenge Active: Complete a 50Q exam today for a unique badge! 🎖️</p>
          </div>
      </div>
    </div>
  );

  if (step === 'results') {
    const score = quizQuestions.filter(q => answers[q.id] === q.correct_answer).length;
    const percentage = Math.round((score / quizQuestions.length) * 100);
    const xpEarned = score * 25 + (quizConfig.limit >= 50 ? 500 : quizConfig.limit >= 35 ? 250 : 100);

    return (
      <div className="space-y-16 py-10 text-center animate-in fade-in zoom-in-95 duration-1000 max-w-4xl mx-auto">
        <div className="relative inline-block">
          <motion.div 
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="w-72 h-72 rounded-full border-[2rem] border-slate-border flex flex-col items-center justify-center mx-auto relative bg-surface shadow-2xl"
          >
            <span className="text-7xl font-display font-black text-ink">{percentage}%</span>
            <span className="text-xs font-black text-stone-400 uppercase tracking-widest mt-2">{score} / {quizQuestions.length} Correct</span>
          </motion.div>
          <motion.div 
            initial={{ rotate: -20, opacity: 0 }}
            animate={{ rotate: 12, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -top-6 -right-6 w-24 h-24 bg-brand-accent rounded-[2.5rem] shadow-2xl shadow-brand-accent/40 flex items-center justify-center border-4 border-white"
          >
            <Trophy className="w-12 h-12 text-white" />
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
           <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100">
              <p className="text-stone-400 font-black uppercase text-[10px] tracking-widest mb-1">Time Spent</p>
              <p className="text-3xl font-display font-black text-ink">{formatTime(timer)}</p>
           </div>
           <div className="bg-ink p-8 rounded-[2.5rem] text-white">
              <p className="text-white/40 font-black uppercase text-[10px] tracking-widest mb-1">XP Earned</p>
              <p className="text-3xl font-display font-black text-brand-primary">+{xpEarned}</p>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100">
              <p className="text-stone-400 font-black uppercase text-[10px] tracking-widest mb-1">Accuracy</p>
              <p className="text-3xl font-display font-black text-emerald-500">{percentage}%</p>
           </div>
        </div>

        <div className="space-y-6 max-w-2xl mx-auto">
          <h2 className="text-5xl font-display font-black text-ink">You're Getting Stronger!</h2>
          <p className="text-stone-500 font-medium text-lg leading-relaxed">
            {percentage >= 80 
              ? "Incredible work! You've shown true mastery today. Keep this momentum going!"
              : "Great effort. Every mistake is a lesson learned. Review your weak areas and try again."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
             <div className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-100">Consistency King</div>
             <div className="px-5 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest border border-blue-100">Maths Wizard</div>
             <div className="px-5 py-2 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-black uppercase tracking-widest border border-brand-primary/10">Quiz Veteran</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <button onClick={() => setStep('config')} className="btn-primary py-6 px-12 rounded-[2.5rem] flex items-center justify-center gap-3 w-full sm:w-auto shadow-2xl">
            <RotateCcw className="w-6 h-6" /> Try New Challenge
          </button>
          <button onClick={onBack} className="btn-secondary py-6 px-12 rounded-[2.5rem] text-ink font-black uppercase text-sm tracking-[0.2em] w-full sm:w-auto border-stone-100">Complete Session</button>
        </div>
      </div>
    );
  }

  const current = quizQuestions[currentIndex];
  const selected = answers[current.id];
  const isCorrect = selected === current.correct_answer;
  const currentScore = quizQuestions.filter(q => answers[q.id] === q.correct_answer).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-5xl mx-auto pb-20">
      {/* HUD Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1 space-y-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <button onClick={() => setIsPaused(!isPaused)} className="w-12 h-12 bg-white rounded-2xl border border-stone-100 flex items-center justify-center text-stone-400 hover:text-ink transition-colors shadow-sm">
                    {isPaused ? <Zap className="w-5 h-5 fill-current" /> : <X className="w-5 h-5" />}
                 </button>
                 <div>
                    <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Question</p>
                    <p className="text-xl font-display font-black text-ink">{currentIndex + 1} <span className="text-stone-300">/</span> {quizQuestions.length}</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Live Score</p>
                 <p className="text-xl font-display font-black text-brand-primary">{currentScore} Correct</p>
              </div>
           </div>
           <div className="h-4 bg-stone-100 rounded-full overflow-hidden border-4 border-white shadow-inner relative">
              <motion.div 
                className="bg-brand-primary h-full rounded-full shadow-lg"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / quizQuestions.length) * 100}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                 <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">{Math.round(((currentIndex + 1) / quizQuestions.length) * 100)}% Complete</span>
              </div>
           </div>
        </div>
        <div className="bg-ink rounded-[2rem] p-6 text-white text-center md:w-40 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest relative z-10 mb-1">Time</p>
           <p className="text-3xl font-display font-black relative z-10">{formatTime(timer)}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isPaused ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            key="paused"
            className="bg-white p-20 rounded-[4rem] text-center border-4 border-stone-100 shadow-2xl space-y-8"
          >
             <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto text-brand-primary">
                <Zap className="w-12 h-12" />
             </div>
             <div className="space-y-2">
                <h2 className="text-5xl font-display font-black text-ink">Session Paused</h2>
                <p className="text-stone-400 text-lg">Take a deep breath. Your progress is safe.</p>
             </div>
             <button 
               onClick={() => setIsPaused(false)}
               className="btn-primary py-6 px-12 rounded-[2.5rem] text-xl"
             >
               Resume Challenge
             </button>
             <button onClick={onBack} className="block mx-auto text-stone-300 font-bold hover:text-rose-500 uppercase text-xs tracking-widest mt-6">Quit Session</button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            key={currentIndex}
            className="space-y-10"
          >
      <div className="bg-surface p-12 md:p-16 rounded-[4rem] shadow-2xl shadow-brand-primary/5 border border-slate-border space-y-12 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-bg-light rounded-full"></div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
             <div className="px-5 py-2 bg-brand-primary/10 text-brand-primary text-xs font-black uppercase tracking-widest rounded-2xl border border-brand-primary/10">{current.subject}</div>
             <div className="px-5 py-2 bg-bg-light text-stone-400 text-xs font-black uppercase tracking-widest rounded-2xl border border-slate-border italic">Examination #{current.year}</div>
          </div>
          {current.passage && (
            <div className="bg-bg-light p-10 rounded-[2.5rem] border border-slate-border text-stone-500 italic leading-relaxed text-xl mb-8 max-h-80 overflow-y-auto no-scrollbar shadow-inner">
              {current.passage}
            </div>
          )}
          <h3 className="text-4xl md:text-5xl font-display font-extrabold leading-[1.1] text-ink">{current.question}</h3>
        </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                {current.options.map((option, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  let stateStyle = "bg-stone-50 border-stone-100 hover:border-brand-primary hover:bg-white hover:shadow-2xl hover:-translate-y-1";
                  
                  if (showExplanation) {
                    if (option === current.correct_answer) stateStyle = "bg-emerald-500 border-emerald-500 text-white shadow-2xl shadow-emerald-500/40";
                    else if (option === selected) stateStyle = "bg-rose-500 border-rose-500 text-white shadow-2xl shadow-rose-500/40 opacity-40";
                    else stateStyle = "opacity-20 border-stone-100 scale-95 grayscale";
                  } else if (selected === option) {
                    stateStyle = "bg-ink border-ink text-white";
                  }

                  return (
                    <button
                      key={option}
                      onClick={() => handleSelect(option)}
                      className={`p-8 rounded-[2rem] border-4 text-left font-bold transition-all flex items-center gap-6 group ${stateStyle}`}
                    >
                      <span className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 ${showExplanation || selected === option ? 'bg-white/20' : 'bg-white text-stone-400 group-hover:text-brand-primary border border-stone-100'}`}>{letter}</span>
                      <span className="text-xl leading-snug">{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence>
              {showExplanation && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className={`p-12 rounded-[3.5rem] border-4 flex flex-col md:flex-row items-center gap-10 shadow-2xl ${isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                     <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-xl shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                       {isCorrect ? '🎉' : '💡'}
                     </div>
                     <div className="flex-1 text-center md:text-left space-y-4">
                       <h4 className={`text-3xl font-display font-black ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                         {isCorrect ? motivation : 'Not quite. Here\'s the key:'}
                       </h4>
                       <p className="text-stone-600 leading-relaxed font-medium text-lg">{current.explanation}</p>
                       <div className="flex items-center justify-center md:justify-start gap-6 pt-4">
                          <button 
                            onClick={() => onAskAI(`Explain this: ${current.question}. Ans: ${current.correct_answer}`)}
                            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-primary hover:underline hover:scale-105 transition-all"
                          >
                            <Bot className="w-5 h-5" /> Ask Mentor to Explain
                          </button>
                          <div className="w-px h-10 bg-stone-200"></div>
                          <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Subject: {current.subject}</p>
                       </div>
                     </div>
                  </div>
                  <button 
                    onClick={next} 
                    className="w-full btn-primary py-8 rounded-[3rem] text-2xl shadow-2xl shadow-brand-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                  >
                    {currentIndex === quizQuestions.length - 1 ? 'Unlock My Results' : 'Onward to Success!'}
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- AI Tutor Modal ---

function AITutorModal({ isOpen, onClose, initialContext }: { isOpen: boolean, onClose: () => void, initialContext: string }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && initialContext && messages.length === 0) {
      handleSend(initialContext);
    }
  }, [isOpen, initialContext]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    const msg = text || input;
    if (!msg.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setInput('');
    setLoading(true);

    try {
      const response = await askTutor(msg, initialContext, messages);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: "Oh no, I lost my connection for a second. Can you try saying that again?" }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-surface w-full max-w-2xl h-[85vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden relative z-10 border border-slate-border"
      >
        <header className="p-8 border-b border-slate-border flex items-center justify-between bg-bg-light/50">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center shadow-xl shadow-brand-primary/20 relative">
               <Bot className="w-7 h-7 text-white" />
               <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-stone-800"></div>
             </div>
             <div>
               <h3 className="font-display font-black text-xl text-ink">AI Study Assistant</h3>
               <p className="text-[10px] uppercase font-black text-brand-primary tracking-widest">Always here to support you</p>
             </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-bg-light transition-colors">
            <X className="w-6 h-6 text-stone-300" />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8">
          {messages.length === 0 && !loading && (
            <div className="text-center py-20 space-y-6">
              <div className="w-20 h-20 bg-bg-light rounded-[2rem] flex items-center justify-center mx-auto border border-slate-border shadow-inner">
                <Sparkles className="w-10 h-10 text-stone-200" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-display font-black text-ink">How can I help you today?</p>
                <p className="text-stone-400 text-sm max-w-xs mx-auto">Ask me about Science, Mathematics, or even help with your coding lessons!</p>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i} 
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-5 rounded-[1.5rem] shadow-sm text-sm leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-ink text-white dark:bg-stone-100 dark:text-stone-900 rounded-tr-none' 
                  : 'bg-bg-light text-ink rounded-tl-none border border-slate-border'
              }`}>
                {m.role === 'ai' ? (
                  <div className="markdown-body prose prose-stone dark:prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                ) : (
                  m.text
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
               <div className="bg-bg-light p-4 rounded-2xl rounded-tl-none border border-slate-border shadow-sm flex items-center gap-3">
                 <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                 </div>
                 <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Assistant is writing...</span>
               </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-surface border-t border-slate-border">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="flex gap-4"
          >
            <input 
              type="text" 
              placeholder="Ask a question or explain a topic..."
              className="flex-1 px-6 py-5 bg-bg-light border-2 border-transparent rounded-[1.5rem] focus:border-brand-primary focus:bg-surface transition-all outline-none text-ink font-medium placeholder:text-stone-300 shadow-inner"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="w-16 h-16 bg-brand-primary text-white rounded-[1.5rem] flex items-center justify-center hover:bg-ink transition-all disabled:opacity-50 shadow-xl shadow-brand-primary/20 active:scale-95 shrink-0"
            >
              <Send className="w-6 h-6" />
            </button>
          </form>
          <p className="text-[10px] text-center mt-4 text-stone-300 font-bold uppercase tracking-widest">Studying for success together 🇬🇭</p>
        </div>
      </motion.div>
    </div>
  );
}

function StatsView({ user, stats, onBack, onReset }: { 
  user: User | null, 
  stats: UserStats, 
  onBack: () => void,
  onReset: () => void
}) {
  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-[2rem] bg-surface border-4 border-surface p-1 shadow-2xl shadow-brand-primary/20 overflow-hidden shrink-0 rotate-3 group hover:rotate-0 transition-transform duration-500">
               <img 
                 src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} 
                 alt="Profile" 
                 className="w-full h-full object-cover rounded-[1.5rem]" 
                 referrerPolicy="no-referrer"
               />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg">
               <Zap className="w-4 h-4 fill-current text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-display font-black text-ink">{user?.displayName || 'Learning Legend'}</h1>
            <p className="text-stone-400 font-bold uppercase text-xs tracking-widest mt-1">Class of 2026 • Ghana Excellence</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onReset} 
            className="px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-bg-light text-stone-300 hover:text-rose-500 transition-all"
          >
            Reset
          </button>
          <button onClick={onBack} className="btn-primary px-10 py-4 rounded-2xl text-xs shadow-xl shadow-brand-primary/20">Go Home</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-8">
           <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden shadow-2xl">
              <Star className="absolute -top-6 -right-6 w-32 h-32 opacity-10 rotate-12" />
              <div className="relative z-10 space-y-2">
                 <p className="text-white/40 font-black uppercase text-[10px] tracking-widest">Current Rank</p>
                 <h4 className="text-3xl font-display font-black">Regional Pro</h4>
              </div>
              <div className="relative z-10 flex items-baseline gap-2">
                 <span className="text-6xl font-display font-black text-brand-primary">{stats.points}</span>
                 <span className="text-xs font-bold text-white/40 uppercase tracking-widest">XP</span>
              </div>
              <p className="text-xs font-medium text-white/60 leading-relaxed italic">You need 450 more XP to unlock the "National Scholar" title!</p>
           </div>
           
           <div className="bg-surface p-8 rounded-[2.5rem] border border-slate-border shadow-sm space-y-4">
              <p className="text-stone-400 font-black uppercase text-[10px] tracking-widest">Daily Streak</p>
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                    <Zap className="w-8 h-8 fill-current" />
                 </div>
                 <div>
                    <p className="text-4xl font-display font-black text-ink">{stats.streak}</p>
                    <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Day Streak</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-3 grid md:grid-cols-2 gap-8">
           <div className="bg-surface p-10 rounded-[3rem] border border-slate-border shadow-sm flex flex-col justify-between group hover:border-emerald-500/20 transition-all">
              <div className="space-y-4">
                 <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center text-emerald-500">
                    <CheckCircle2 className="w-8 h-8" />
                 </div>
                 <h3 className="text-2xl font-display font-black text-ink">Accuracy Master</h3>
                 <p className="text-stone-400 text-sm font-medium">Your current average performance across all mock exams.</p>
              </div>
              <div className="mt-8 space-y-2">
                 <div className="flex items-center justify-between">
                    <span className="text-4xl font-display font-black text-ink">{stats.totalAttempted > 0 ? Math.round((stats.totalCorrect / stats.totalAttempted) * 100) : 0}%</span>
                    <span className="text-xs font-black text-stone-300 uppercase tracking-widest">Global Top 10%</span>
                 </div>
                 <div className="w-full h-3 bg-bg-light rounded-full overflow-hidden border border-slate-border">
                    <motion.div 
                      className="h-full bg-emerald-500 shadow-lg shadow-emerald-500/20"
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.totalAttempted > 0 ? (stats.totalCorrect / stats.totalAttempted) * 100 : 0}%` }}
                    />
                 </div>
              </div>
           </div>

           <div className="bg-surface p-10 rounded-[3rem] border border-slate-border shadow-sm flex flex-col justify-between group hover:border-brand-primary/20 transition-all">
              <div className="space-y-4">
                 <div className="w-16 h-16 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-[1.5rem] flex items-center justify-center text-brand-primary">
                    <Trophy className="w-8 h-8" />
                 </div>
                 <h3 className="text-2xl font-display font-black text-ink">Unlocked Awards</h3>
                 <p className="text-stone-400 text-sm font-medium">Badges earned by consistently practicing and getting high scores.</p>
              </div>
              <div className="mt-8 flex -space-x-3">
                 {stats.badges.length > 0 ? stats.badges.slice(0, 5).map((badge, i) => (
                    <motion.div 
                      key={badge.id} 
                      whileHover={{ y: -5, scale: 1.1 }}
                      title={badge.name}
                      className="w-14 h-14 rounded-full border-4 border-surface flex items-center justify-center shadow-lg bg-brand-accent text-2xl"
                    >
                       {badge.icon}
                    </motion.div>
                 )) : (
                   <div className="w-full text-stone-300 font-bold text-xs uppercase tracking-widest italic pt-4">No badges yet. Start a quiz!</div>
                 )}
                 {stats.badges.length > 5 && (
                   <div className="w-14 h-14 rounded-full border-4 border-surface bg-bg-light flex items-center justify-center text-stone-300 text-xs font-black">
                      +{stats.badges.length - 5}
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {stats.history && stats.history.length > 0 && (
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-display font-black text-ink">Recent Performance</h2>
            <p className="text-stone-400 font-bold uppercase text-[10px] tracking-widest">Last {stats.history.length} Sessions</p>
          </div>
          <div className="bg-surface rounded-[3rem] border border-slate-border shadow-sm overflow-hidden no-scrollbar overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-bg-light/50">
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400 border-b border-slate-border">Test Content</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400 border-b border-slate-border">Score</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400 border-b border-slate-border">Accuracy</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400 border-b border-slate-border">Time</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400 border-b border-slate-border">Rewards</th>
                </tr>
              </thead>
              <tbody>
                {stats.history.map((h) => (
                  <tr key={h.id} className="hover:bg-bg-light/30 transition-colors group">
                    <td className="px-10 py-6 border-b border-bg-light">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                             <Zap className="w-5 h-5 fill-current" />
                          </div>
                          <div>
                             <p className="font-bold text-ink">{h.subject}</p>
                             <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{new Date(h.date).toLocaleDateString()}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-10 py-6 border-b border-bg-light">
                       <span className="font-display font-black text-xl text-ink">{h.score} <span className="text-stone-300">/ {h.total}</span></span>
                    </td>
                    <td className="px-10 py-6 border-b border-bg-light">
                       <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 w-24 bg-bg-light rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500" style={{ width: `${(h.score / h.total) * 100}%` }}></div>
                          </div>
                          <span className="text-xs font-black text-ink">{Math.round((h.score / h.total) * 100)}%</span>
                       </div>
                    </td>
                    <td className="px-10 py-6 border-b border-bg-light font-bold text-stone-500 text-sm">
                       {Math.floor(h.duration / 60)}m {h.duration % 60}s
                    </td>
                    <td className="px-10 py-6 border-b border-bg-light font-black text-brand-primary text-sm">
                       +{h.xpEarned} XP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-3xl font-display font-black text-ink">Subject Mastery</h2>
          <div className="grid md:grid-cols-2 gap-6">
             {[
               { id: 'math', name: 'Core Mathematics', label: 'Maths', color: 'bg-emerald-500' },
               { id: 'science', name: 'Integrated Science', label: 'Science', color: 'bg-brand-primary' },
               { id: 'english', name: 'English Language', label: 'English', color: 'bg-amber-400' },
               { id: 'social', name: 'Social Studies', label: 'Social', color: 'bg-rose-500' }
             ].map((sub) => {
               const data = stats.subjectStats?.[sub.name] || { attempted: 0, correct: 0 };
               const proficiency = data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0;
               
                return (
                  <div key={sub.id} className="bg-surface p-8 rounded-[2.5rem] border border-slate-border shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                       <div className={`w-10 h-10 ${sub.color} rounded-xl shadow-lg ring-4 ring-surface`}></div>
                       <span className="text-2xl font-display font-black text-ink">{proficiency}%</span>
                    </div>
                    <div>
                       <h4 className="font-display font-black text-stone-500 uppercase text-[10px] tracking-widest">{sub.label}</h4>
                       <p className="text-stone-300 text-[10px] font-bold mt-1 uppercase tracking-widest">{data.attempted} Questions Practice</p>
                    </div>
                    <div className="w-full h-2 bg-bg-light rounded-full overflow-hidden border border-slate-border">
                       <motion.div 
                         className={`h-full ${sub.color}`}
                         initial={{ width: 0 }}
                         animate={{ width: `${proficiency}%` }}
                       />
                    </div>
                  </div>
                );
             })}
          </div>
        </div>

        <div className="space-y-8">
            <h2 className="text-3xl font-display font-black text-ink flex items-center gap-3">
               Leaderboard <Trophy className="w-6 h-6 text-brand-accent shrink-0" />
            </h2>
            <div className="bg-surface rounded-[2.5rem] border border-slate-border p-8 shadow-sm space-y-6">
               {[
                 { name: "Prince O.", xp: 45200, seed: "prince", rank: 1 },
                 { name: "Serwaa K.", xp: 38100, seed: "serwaa", rank: 2 },
                 { name: "Abena M.", xp: 32400, seed: "abena", rank: 3 },
                 { name: user?.displayName || "You", xp: stats.points, seed: user?.uid, rank: "12th", isMe: true },
               ].map((entry, idx) => (
                 <div key={idx} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${entry.isMe ? 'bg-brand-primary/5 ring-2 ring-brand-primary/10' : 'hover:bg-bg-light'}`}>
                    <div className="w-8 font-display font-black text-stone-300 text-sm">{entry.rank}</div>
                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-surface shadow-sm shrink-0">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.seed}`} alt={entry.name} />
                    </div>
                    <div className="flex-1">
                       <p className={`font-bold ${entry.isMe ? 'text-brand-primary' : 'text-ink'} text-sm`}>{entry.name}</p>
                       <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">{entry.xp.toLocaleString()} XP</p>
                    </div>
                    {entry.rank === 1 && <span className="text-xl">👑</span>}
                 </div>
               ))}
               <button className="w-full text-center py-4 text-[10px] font-black uppercase text-stone-400 hover:text-brand-primary transition-colors tracking-widest border-t border-slate-border mt-4">View Full Global Rankings</button>
            </div>
        </div>
      </section>
    </div>
  );
}
