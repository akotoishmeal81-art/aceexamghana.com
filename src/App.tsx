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
  Sun
} from 'lucide-react';
import { Question, UserStats, ExamType, SubjectType } from './types';
import { QUESTIONS } from './data/questions';
import { SYLLABUS_DATA } from './data/resources';
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
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-ink">{value}</p>
    </div>
  </div>
);

// --- Content Components ---

export default function App() {
  const [view, setView] = useState<'dashboard' | 'study' | 'quiz' | 'resources' | 'stats' | 'auth'>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => 'light'); // Force light mode for brightness
  const [aiModal, setAIModal] = useState<{ open: boolean, context: string }>({ open: false, context: '' });
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
      // Ensure points and subjectStats exist for older local data
      return { 
        ...parsed, 
        points: parsed.points || 0,
        subjectStats: parsed.subjectStats || {},
        subjectScores: parsed.subjectScores || {}
      };
    }
    return {
      totalAttempted: 0,
      totalCorrect: 0,
      streak: 0,
      points: 0,
      lastActive: new Date().toISOString(),
      subjectScores: {},
      subjectStats: {}
    };
  });

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'study', icon: BookOpen, label: 'Flash Cards' },
    { id: 'quiz', icon: Zap, label: 'Quizzes' },
    { id: 'resources', icon: Book, label: 'Study Resources' },
    { id: 'stats', icon: Trophy, label: 'Performance' },
  ];

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
          // Fetch cloud stats
          const cloudStats = await getUserProgress(currentUser.uid);
          if (cloudStats) {
            setStats(cloudStats);
          } else {
            // New user: sync whatever local progress they have (guest progress) to cloud
            await saveUserProgress(currentUser.uid, stats);
          }
        } catch (error) {
          console.error("Firebase sync error:", error);
          setAuthError("Failed to sync progress with cloud. You are working offline.");
        }
      } else {
        // Logged out: Load guest stats from local storage or reset
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
            subjectStats: {}
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

  // --- Views ---

  const handleResetStats = async () => {
    const freshStats: UserStats = {
      totalAttempted: 0,
      totalCorrect: 0,
      streak: 0,
      points: 0,
      lastActive: new Date().toISOString(),
      subjectScores: {},
      subjectStats: {}
    };
    
    setStats(freshStats);
    localStorage.setItem('ace_exams_stats', JSON.stringify(freshStats));
    if (user) {
      await saveUserProgress(user.uid, freshStats);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-ink">
        <div className="flex items-center gap-4">
          {user && (
            <div className="w-16 h-16 rounded-2xl bg-surface border-2 border-brand-primary p-0.5 shadow-lg shadow-brand-primary/10 overflow-hidden shrink-0">
               <img 
                 src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                 alt="Profile" 
                 className="w-full h-full object-cover rounded-[0.9rem]" 
                 referrerPolicy="no-referrer"
               />
            </div>
          )}
          <div>
            <h2 className="text-3xl font-bold">
              {user ? `Welcome, ${user.displayName?.split(' ')[0] || 'Learner'} 👋` : 'Welcome back, Student 👋'}
            </h2>
            <p className="text-slate-500 font-medium">
              {stats.points > 0 ? `You've earned ${stats.points.toLocaleString()} XP. Keep going!` : 'Ready to start your mastery journey?'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 sm:flex-none bg-amber-500/10 text-amber-600 px-5 py-2.5 rounded-2xl text-sm font-bold border border-amber-500/20 flex items-center justify-center gap-2 shadow-sm">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            {stats.points.toLocaleString()} Points
          </div>
          {user ? (
            <button 
              onClick={handleLogout}
              className="px-5 py-2.5 rounded-2xl bg-surface border border-slate-border text-slate-500 font-bold text-sm hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          ) : (
            <button 
              onClick={() => setView('auth')}
              className="px-5 py-2.5 rounded-2xl bg-brand-primary text-white font-bold text-sm hover:bg-blue-600 shadow-lg shadow-brand-primary/20 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {!user && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-200">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Cloud Syncing Disabled</h3>
            <p className="text-blue-100 text-sm max-w-md">Login to save your progress, unlock achievements, and access your stats on any device.</p>
          </div>
          <button 
            onClick={() => setView('auth')}
            className="btn-primary bg-brand-primary text-white hover:bg-blue-600 w-full md:w-auto"
          >
            Login Now
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-surface p-6 rounded-2xl border border-slate-border flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-600 text-2xl font-bold">🃏</div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Attempted</p>
              <p className="text-xl font-bold text-ink">{stats.totalAttempted}</p>
            </div>
          </div>
          <div className="bg-blue-600 p-6 rounded-2xl flex items-center gap-4 text-white shadow-lg">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white text-2xl font-bold">🎯</div>
            <div>
              <p className="text-[10px] uppercase font-bold text-white/70 tracking-wider">Success Rate</p>
              <p className="text-xl font-bold">{stats.totalAttempted > 0 ? `${Math.round((stats.totalCorrect / stats.totalAttempted) * 100)}%` : '0%'}</p>
            </div>
          </div>
        </div>
        <div className="md:col-span-2 bg-surface p-6 rounded-2xl border border-slate-border relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-brand-primary mb-1">PRO PREP</h3>
            <p className="text-lg font-bold text-ink">Master 2025 Core Subjects</p>
            <p className="text-xs text-slate-500 mt-1">Personalized study plan active.</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-brand-primary/10 rounded-full group-hover:scale-110 transition-transform duration-500 opacity-50"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-surface p-6 rounded-2xl border border-slate-border shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 text-center">Search Library</h3>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Keyword search..."
                  className="w-full pl-9 pr-4 py-2.5 bg-bg-light border border-slate-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all font-medium text-ink"
                  value={filters.search}
                  onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setFilters(f => ({ ...f, examType: 'BECE' }))}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${filters.examType === 'BECE' ? 'bg-brand-primary text-white shadow-md' : 'bg-bg-light text-slate-500 border border-slate-border hover:bg-bg-light/80'}`}
                >
                  BECE
                </button>
                <button 
                  onClick={() => setFilters(f => ({ ...f, examType: 'WASSCE' }))}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${filters.examType === 'WASSCE' ? 'bg-brand-primary text-white shadow-md' : 'bg-bg-light text-slate-500 border border-slate-border hover:bg-bg-light/80'}`}
                >
                  WASSCE
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Subject</label>
                  <select 
                    className="w-full p-2.5 bg-bg-light border border-slate-border rounded-xl text-sm font-medium focus:outline-none text-ink"
                    value={filters.subjectType}
                    onChange={(e) => setFilters(f => ({ ...f, subjectType: e.target.value as any }))}
                  >
                    <option value="">All Subjects</option>
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Exam Year</label>
                  <select 
                    className="w-full p-2.5 bg-bg-light border border-slate-border rounded-xl text-sm font-medium focus:outline-none text-ink"
                    value={filters.year}
                    onChange={(e) => setFilters(f => ({ ...f, year: e.target.value }))}
                  >
                    <option value="">All Years</option>
                    {Array.from({ length: 16 }, (_, i) => 2025 - i).map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {(filters.examType || filters.subjectType || filters.year || filters.search) && (
                <button 
                  onClick={() => setFilters({ search: '', examType: '', subjectType: '', year: '' })}
                  className="w-full py-2 flex items-center justify-center gap-2 text-rose-500 font-bold text-xs uppercase hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                >
                  <RotateCcw className="w-4 h-4" /> Reset Filters
                </button>
              )}
            </div>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-slate-border shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Subject Mastery</h3>
            <div className="space-y-5">
              {[
                { label: 'Mathematics', dbKey: 'Core Mathematics', color: 'bg-emerald-500' },
                { label: 'Science', dbKey: 'Integrated Science', color: 'bg-blue-500' },
                { label: 'English', dbKey: 'English Language', color: 'bg-amber-500' },
                { label: 'Social Studies', dbKey: 'Social Studies', color: 'bg-rose-500' },
              ].map(subj => {
                const score = stats.subjectScores[subj.dbKey] || 0;
                return (
                  <button 
                    key={subj.label} 
                    onClick={() => setFilters(f => ({ ...f, search: subj.dbKey }))}
                    className="w-full text-left space-y-1.5 group p-1 rounded-xl hover:bg-bg-light transition-all active:scale-[0.98]"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-ink group-hover:text-brand-primary transition-colors">{subj.label}</span>
                      <span className="font-bold text-slate-400 italic">{score}%</span>
                    </div>
                    <div className="h-2.5 bg-bg-light rounded-full border border-slate-border overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        className={`h-full ${subj.color}`}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-slate-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Electives</h3>
              <Sparkles className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Economics', 'Government', 'Elective Maths', 'Biology', 'Chemistry', 'Physics'
              ].map(subj => (
                <button 
                  key={subj}
                  onClick={() => setFilters({ ...filters, search: subj, subjectType: 'Elective' })}
                  className="px-3 py-2 bg-bg-light border border-slate-border rounded-xl text-[11px] font-bold text-slate-500 hover:bg-brand-primary hover:text-white transition-all text-center"
                >
                  {subj}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold flex items-center gap-2 text-ink">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              Quick Practice
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => setView('study')}
              className="bg-surface p-8 rounded-[2rem] border-2 border-slate-border hover:border-brand-primary transition-all group relative overflow-hidden"
            >
              <div className="relative z-10 text-left">
                <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-7 h-7 text-brand-primary" />
                </div>
                <h3 className="text-2xl font-bold text-ink">Study Mode</h3>
                <p className="text-slate-500 mt-2 font-medium">Flashcards with active recall</p>
                <div className="mt-8 flex items-center gap-2 text-brand-primary font-bold uppercase text-xs">
                  Start Sessions <ChevronRight className="w-4 h-4" />
                </div>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <div className="text-8xl font-black text-ink">ST</div>
              </div>
            </button>

            <button 
              onClick={() => setView('quiz')}
              className="bg-brand-primary p-8 rounded-[2rem] text-white hover:shadow-2xl transition-all group relative overflow-hidden border border-white/10 dark:bg-slate-950"
            >
              <div className="relative z-10 text-left">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-7 h-7 text-amber-400 fill-amber-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Quiz Arena</h3>
                <p className="text-white/50 mt-2 font-medium">Timed competitive testing</p>
                <div className="mt-8 flex items-center gap-2 text-amber-400 font-bold uppercase text-xs">
                  Enter Arena <ChevronRight className="w-4 h-4" />
                </div>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <div className="text-8xl font-black text-white">QZ</div>
              </div>
            </button>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-slate-border">
             <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-ink">Recent Questions</h3>
               <button className="text-xs font-bold text-brand-primary hover:underline">View All</button>
             </div>
             <div className="space-y-3">
              {filteredQuestions.slice(0, 3).map(q => (
                <div key={q.id} className="p-4 bg-bg-light border border-slate-border rounded-xl flex items-center justify-between group hover:bg-surface hover:border-brand-primary/20 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-md">{q.exam_type}</span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter italic">#{q.year} • {q.subject}</span>
                    </div>
                    <p className="text-ink font-semibold line-clamp-1">{q.question}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-brand-primary transition-colors" />
                </div>
              ))}
             </div>
          </div>
        </section>
      </div>
    </div>
  );

  const renderStudy = () => <StudyMode onBack={() => setView('dashboard')} questions={filteredQuestions} onAskAI={(ctx) => setAIModal({ open: true, context: ctx })} onCardAction={(subject, isCorrect) => {
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
        points: prev.points + (isCorrect ? 5 : 2), // Earn a bit of XP for studying
        lastActive: new Date().toISOString(),
        subjectStats: newSubjectStats,
        subjectScores: newSubjectScores
      };
    });
  }} />;
  const renderQuiz = () => <QuizModeView onBack={() => setView('dashboard')} questions={filteredQuestions} onAskAI={(ctx) => setAIModal({ open: true, context: ctx })} onFinish={(correct, subjectSummary) => {
    setStats(prev => {
      const newSubjectStats = { ...prev.subjectStats };
      const newSubjectScores = { ...prev.subjectScores };

      Object.entries(subjectSummary).forEach(([subject, data]) => {
        const existing = newSubjectStats[subject] || { attempted: 0, correct: 0 };
        const updated = {
          attempted: existing.attempted + data.attempted,
          correct: existing.correct + data.correct
        };
        newSubjectStats[subject] = updated;
        newSubjectScores[subject] = Math.round((updated.correct / updated.attempted) * 100);
      });

      return {
        ...prev,
        totalAttempted: prev.totalAttempted + filteredQuestions.length,
        totalCorrect: prev.totalCorrect + correct,
        points: prev.points + (correct * 10),
        streak: prev.streak + 1, // Simple streak tracking
        lastActive: new Date().toISOString(),
        subjectStats: newSubjectStats,
        subjectScores: newSubjectScores
      };
    });
  }} />;

  const renderResources = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/20 shadow-sm">
             <Book className="w-6 h-6 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-ink tracking-tight">Study Resources</h1>
            <p className="text-slate-500 font-medium">Official BECE & WASSCE Syllabus Overview</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['Mathematics', 'Science', 'English', 'Social Studies'].map(category => {
          const topics = SYLLABUS_DATA.filter(t => t.subject.includes(category));
          const colorClass = category === 'Mathematics' ? 'bg-emerald-500' : 
                            category === 'Science' ? 'bg-blue-500' :
                            category === 'English' ? 'bg-amber-500' : 'bg-rose-500';
          
          return (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className={`w-2 h-2 rounded-full ${colorClass}`}></div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">{category}</h3>
              </div>
              <div className="space-y-4">
                {topics.map(topic => (
                  <div key={topic.id} className="bg-surface p-6 rounded-3xl border border-slate-border shadow-sm hover:shadow-md transition-shadow group">
                    <h4 className="font-bold text-ink text-lg mb-2">{topic.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">{topic.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {topic.subtopics.map(sub => (
                        <span key={sub} className="text-[10px] font-bold px-2 py-1 bg-bg-light text-slate-500 rounded-lg group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">{sub}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-brand-primary/5 dark:bg-slate-900 rounded-[2.5rem] p-10 text-ink dark:text-white relative overflow-hidden border border-brand-primary/10">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <Bot className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-4xl font-display leading-tight mb-6 italic">Stuck on a topic? Your GH AI Tutor is here to help.</h2>
          <p className="text-slate-500 dark:text-white/60 text-lg mb-8">Get instant explanations customized for the Ghanaian curriculum using the power of Gemini AI.</p>
          <button 
            onClick={() => setAIModal({ open: true, context: 'General Syllabus Inquiry' })}
            className="px-8 py-4 bg-brand-primary text-white rounded-2xl font-bold text-lg hover:bg-blue-600 transition-all flex items-center gap-3 shadow-xl"
          >
            <Sparkles className="w-6 h-6 text-white" />
            Talk to AI Tutor
          </button>
        </div>
      </div>
    </div>
  );

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('ace_exams_stats');
      setStats({
        totalAttempted: 0,
        totalCorrect: 0,
        streak: 0,
        points: 0,
        lastActive: new Date().toISOString(),
        subjectScores: {},
        subjectStats: {}
      });
      setView('dashboard');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

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
          subjectStats: {}
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
    <div className="min-h-screen bg-bg-light flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-light flex overflow-hidden">
      {/* Sidebar Rail (Desktop) */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-surface border-r border-slate-border hidden md:flex flex-col z-40 transform transition-transform duration-300">
        <div className="p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg ring-1 ring-blue-400/20">A</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">AceExams<span className="text-brand-primary">.gh</span></h1>
          </div>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 p-3 rounded-2xl bg-bg-light border border-slate-border text-slate-500 hover:text-brand-primary transition-all font-bold text-sm"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 pt-4">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setView(id as any)}
              className={`w-full nav-item ${view === id ? 'nav-item-active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
          
          <div className="pt-6 mt-6 border-t border-slate-border px-2">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-4 ml-2">Account</p>
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-bg-light rounded-2xl border border-slate-border">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-brand-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink truncate">{user.displayName || 'Learner'}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-2xl transition-all font-bold text-sm"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setView('auth')}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all font-bold text-sm ${view === 'auth' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-500 hover:bg-brand-primary/5 hover:text-brand-primary'}`}
              >
                <LogIn className="w-5 h-5" />
                Sign In / Join
              </button>
            )}
          </div>
        </nav>

        <div className="p-6 border-t border-slate-border m-4 rounded-2xl bg-bg-light/50">
          <p className="text-[10px] uppercase font-extrabold text-slate-500 tracking-widest mb-3 text-center">Today's Streak</p>
          <div className="flex gap-1.5 mb-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 flex-1 rounded-full ${i < stats.streak ? 'bg-brand-primary' : 'bg-slate-border'}`} 
              />
            ))}
          </div>
          <p className="text-xs font-bold text-brand-primary flex items-center gap-1.5">
            <Zap className="w-3 h-3 fill-brand-primary" />
            {stats.streak} Day Streak!
          </p>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="flex-1 flex flex-col md:ml-64 relative min-h-screen">
        <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full pb-28 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {view === 'dashboard' && renderDashboard()}
              {view === 'study' && renderStudy()}
              {view === 'quiz' && renderQuiz()}
              {view === 'resources' && renderResources()}
              {view === 'stats' && <StatsView user={user} stats={stats} onBack={() => setView('dashboard')} onReset={handleResetStats} />}
              {view === 'auth' && renderAuth()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Nav (Floating Bar) */}
        <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-surface/90 backdrop-blur-2xl border border-slate-border shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2rem] p-2 flex items-center justify-around z-50">
          {navItems.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setView(id as any)}
              className={`p-4 rounded-3xl transition-all ${view === id ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/30 scale-110' : 'text-slate-500 hover:bg-bg-light'}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
            </button>
          ))}
          <button
             onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
             className="p-4 rounded-3xl transition-all text-slate-500 hover:bg-bg-light"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
          </button>
          <button
            onClick={() => setView('auth')}
            className={`p-4 rounded-3xl transition-all ${view === 'auth' ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/30 scale-110' : 'text-slate-400 hover:bg-bg-light'}`}
          >
            {user ? (
              <div className="w-5 h-5 rounded-full overflow-hidden border border-current">
                <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <UserIcon className="w-5 h-5 flex-shrink-0" />
            )}
          </button>
        </nav>
      </main>

      <AITutorModal 
        isOpen={aiModal.open} 
        onClose={() => setAIModal({ ...aiModal, open: false })} 
        initialContext={aiModal.context} 
      />

      {/* Floating AI Action Button (Desktop only, or corner) */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setAIModal({ open: true, context: 'General support and study help.' })}
        className="fixed right-6 bottom-32 md:bottom-8 z-40 w-14 h-14 bg-brand-primary text-white rounded-2xl shadow-2xl flex items-center justify-center group"
      >
        <Bot className="w-7 h-7 group-hover:hidden" />
        <Sparkles className="w-7 h-7 hidden group-hover:block animate-pulse" />
        <div className="absolute right-full mr-4 px-3 py-1.5 bg-brand-primary text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest">
          AI Tutor Help
        </div>
      </motion.button>
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
      onBack(); // End session if it's the last card
    }
  };

  if (!current) return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="w-16 h-16 bg-bg-light rounded-full flex items-center justify-center text-slate-400">
        <BookOpen className="w-8 h-8" />
      </div>
      <p className="text-slate-500 font-medium">No questions found. Try adjusting filters.</p>
      <button onClick={onBack} className="btn-secondary">Go Back</button>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-secondary px-4 py-2 flex items-center gap-2">
          <X className="w-4 h-4" /> Exit Session
        </button>
        <span className="font-mono text-lg font-bold text-slate-400">Card {index + 1} of {questions.length}</span>
      </div>

      <div 
        className={`flip-card max-w-2xl mx-auto cursor-pointer ${flipped ? 'flipped' : ''}`}
        onClick={() => setFlipped(!flipped)}
      >
        <div className="flip-card-inner">
          <div className="flip-card-front bg-surface border border-slate-border">
            <div className="absolute top-6 left-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{current.subject}</span>
            </div>
            <div className="absolute top-6 right-8 text-slate-300 font-mono text-xl italic drop-shadow-sm leading-none">#{current.year}</div>
            
            <div className="px-6 space-y-6">
              {current.passage && (
                <div className="bg-bg-light p-6 rounded-2xl border border-slate-border text-sm italic text-slate-500 leading-relaxed text-left max-h-40 overflow-y-auto mb-4">
                  {current.passage}
                </div>
              )}
              <h2 className="text-2xl md:text-3xl font-display leading-tight text-ink">{current.question}</h2>
            </div>
            
            <div className="mt-12 flex flex-col items-center gap-3">
              <div className="p-3 bg-brand-primary/10 rounded-full">
                <RotateCcw className="w-5 h-5 text-brand-primary" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tap to flip card</p>
            </div>
          </div>
          <div className="flip-card-back bg-brand-primary">
            <div className="absolute top-6 left-8 text-white/40 text-[10px] font-bold uppercase tracking-widest">Verified Answer</div>
            <div className="space-y-6 px-4">
              <div className="space-y-2">
                <p className="text-3xl font-display font-black text-white drop-shadow-md">{current.correct_answer}</p>
                <div className="h-1 w-12 bg-white/30 mx-auto rounded-full"></div>
              </div>
              <div className="bg-surface/10 p-6 rounded-2xl text-sm border border-white/10 text-white/90 text-left leading-relaxed">
                <div className="flex items-center justify-between mb-2">
                  <strong className="text-white font-bold uppercase text-[10px] tracking-widest">Explanation:</strong>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onAskAI(`Explain this: ${current.question}. The correct answer is ${current.correct_answer}.`); }}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 hover:bg-surface text-white hover:text-brand-primary rounded-lg text-[10px] font-black uppercase transition-all shadow-sm"
                  >
                    <Sparkles className="w-3 h-3" /> Ask AI Tutor
                  </button>
                </div>
                {current.explanation}
              </div>
            </div>
            <div className="mt-12 text-white/40 text-xs font-bold uppercase tracking-widest animate-bounce">Tap to close</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {flipped && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="grid grid-cols-2 gap-4"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); handleAction(true); }}
                className="p-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all flex flex-col items-center gap-1 shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-6 h-6" />
                <span className="text-xs uppercase tracking-widest">I Know This</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleAction(false); }}
                className="p-4 bg-slate-border text-ink rounded-2xl font-bold hover:bg-slate-700 hover:text-white transition-all flex flex-col items-center gap-1 shadow-lg"
              >
                <AlertCircle className="w-6 h-6" />
                <span className="text-xs uppercase tracking-widest">Still Learning</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-4">
          <button 
            disabled={index === 0}
            onClick={(e) => {
              e.stopPropagation();
              setIndex(i => i - 1);
              setFlipped(false);
            }}
            className="flex-1 btn-secondary group flex items-center justify-center gap-2"
          >
            <ChevronRight className="w-5 h-5 rotate-180 transition-transform group-hover:-translate-x-1" /> Previous
          </button>
          {!flipped && (
            <button 
              disabled={index === questions.length - 1}
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i => i + 1);
                setFlipped(false);
              }}
              className="flex-1 btn-primary group flex items-center justify-center gap-2"
            >
              Next Card <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Quiz Mode ---

function QuizModeView({ onBack, questions, onAskAI, onFinish }: { 
  onBack: () => void, 
  questions: Question[], 
  onAskAI: (context: string) => void,
  onFinish: (correct: number, subjectSummary: Record<string, { attempted: number, correct: number }>) => void 
}) {
  const [step, setStep] = useState<'config' | 'running' | 'results'>('config');
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);

  const startQuiz = (limit: number) => {
    const shuffled = [...questions].sort(() => 0.5 - Math.random()).slice(0, limit);
    setQuizQuestions(shuffled);
    setStep('running');
  };

  const handleSelect = (option: string) => {
    if (showExplanation) return;
    setAnswers(prev => ({ ...prev, [quizQuestions[currentIndex].id]: option }));
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

      onFinish(correct, subjectSummary);
      setStep('results');
    } else {
      setCurrentIndex(i => i + 1);
      setShowExplanation(false);
    }
  };

  if (step === 'config') return (
    <div className="space-y-8 py-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-rose-500/20">
          <Zap className="w-10 h-10 text-rose-500 fill-rose-500" />
        </div>
        <h2 className="text-3xl font-bold text-ink">Quiz Arena</h2>
        <p className="text-slate-500 max-w-sm mx-auto font-medium">Test your knowledge under pressure and climb the leaderboard.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {[10, 20, 40].map(n => (
          <button 
            key={n}
            onClick={() => startQuiz(n)}
            className="bg-surface p-8 rounded-3xl border-2 border-slate-border hover:border-brand-primary transition-all text-center group active:scale-95"
          >
            <div className="text-4xl font-black text-slate-300 md:text-slate-200 mb-2 group-hover:text-brand-primary transition-colors">{n}</div>
            <span className="font-bold text-slate-400 uppercase text-xs tracking-widest">Questions</span>
          </button>
        ))}
      </div>
      <div className="text-center">
        <button onClick={onBack} className="text-slate-400 font-bold uppercase text-xs tracking-widest hover:text-ink">Cancel</button>
      </div>
    </div>
  );

  if (step === 'results') {
    const score = quizQuestions.filter(q => answers[q.id] === q.correct_answer).length;
    const percentage = Math.round((score / quizQuestions.length) * 100);

    return (
      <div className="space-y-12 py-10 text-center animate-in fade-in zoom-in-95 duration-700">
        <div className="relative inline-block">
          <div className="w-56 h-56 rounded-full border-[12px] border-slate-border flex items-center justify-center mx-auto relative overflow-hidden bg-surface shadow-inner">
            <div className={`absolute bottom-0 left-0 right-0 ${percentage > 70 ? 'bg-emerald-500' : 'bg-brand-primary'} transition-all`} style={{ height: `${percentage}%`, opacity: 0.1 }}></div>
            <span className={`text-6xl font-black ${percentage > 70 ? 'text-emerald-500' : 'text-brand-primary'}`}>{percentage}%</span>
          </div>
          <div className="absolute -top-4 -right-4 p-4 bg-amber-400 rounded-2xl shadow-xl shadow-amber-400/20 rotate-12">
            <Star className="w-8 h-8 text-white fill-white" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-4xl font-bold text-ink">Excellent Work!</h2>
          <p className="text-lg text-slate-500 font-medium">You dominated {score} out of {quizQuestions.length} questions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
          <button onClick={() => setStep('config')} className="btn-primary flex items-center justify-center gap-2 py-4">
            <RotateCcw className="w-5 h-5" /> Retake Quiz
          </button>
          <button onClick={onBack} className="btn-secondary py-4">Finish</button>
        </div>
      </div>
    );
  }

  const current = quizQuestions[currentIndex];
  const selected = answers[current.id];
  const isCorrect = selected === current.correct_answer;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1 bg-bg-light h-2.5 rounded-full overflow-hidden border border-slate-border">
          <motion.div 
            className="bg-brand-primary h-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / quizQuestions.length) * 100}%` }}
          />
        </div>
        <span className="text-lg font-black text-slate-500 font-mono tracking-tighter">{currentIndex + 1} / {quizQuestions.length}</span>
      </div>

      <div className="bg-surface p-10 rounded-[2.5rem] shadow-sm border border-slate-border space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Zap className="w-32 h-32 text-brand-primary" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-lg">{current.subject}</span>
          {current.passage && (
            <div className="bg-bg-light p-6 rounded-2xl border border-slate-border text-sm italic text-slate-500 leading-relaxed max-h-60 overflow-y-auto">
              {current.passage}
            </div>
          )}
          <h3 className="text-3xl font-bold mt-6 leading-tight text-ink">{current.question}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {current.options.map((option, idx) => {
            const letter = String.fromCharCode(65 + idx);
            let style = "border-slate-border bg-bg-light/50 hover:bg-surface hover:border-brand-primary hover:shadow-md";
            let letterStyle = "bg-bg-light text-slate-500 mb-0 group-hover:bg-brand-primary group-hover:text-white";
            
            if (showExplanation) {
              if (option === current.correct_answer) {
                style = "border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-sm ring-1 ring-emerald-500/20";
                letterStyle = "bg-emerald-500 text-white";
              }
              else if (option === selected) {
                style = "border-rose-500 bg-rose-500/10 text-rose-500 shadow-sm ring-1 ring-rose-500/20";
                letterStyle = "bg-rose-500 text-white";
              }
              else style = "opacity-40 border-slate-border pointer-events-none";
            } else if (selected === option) {
              style = "border-brand-primary bg-brand-primary/10 text-brand-primary";
              letterStyle = "bg-brand-primary text-white";
            }

            return (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={`w-full p-5 rounded-2xl border-2 text-left font-bold transition-all group flex items-center gap-4 ${style}`}
              >
                <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-colors ${letterStyle}`}>{letter}</span>
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {showExplanation && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className={`p-8 rounded-[2rem] border-2 flex items-start gap-4 ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-full flex-shrink-0 ${isCorrect ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                {isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2 gap-4">
                  <p className={`text-lg font-bold ${isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isCorrect ? 'Fantastic! You got it right.' : 'Oops, not quite!'}
                  </p>
                  <button 
                     onClick={() => onAskAI(`I answered ${selected} to the question "${current.question}" but the correct answer is ${current.correct_answer}. Please explain why.`)}
                     className="flex items-center gap-2 px-3 py-1.5 bg-bg-light hover:bg-brand-primary hover:text-white text-slate-500 rounded-xl text-xs font-bold transition-all border border-slate-border"
                  >
                    <Bot className="w-4 h-4" /> Explain with AI
                  </button>
                </div>
                <p className={`text-sm leading-relaxed ${isCorrect ? 'text-emerald-600/80' : 'text-rose-600/80'}`}>
                  {current.explanation}
                </p>
              </div>
            </div>
          </div>
          <button onClick={next} className="w-full btn-primary py-5 text-lg shadow-xl shadow-brand-primary/20">
            {currentIndex === quizQuestions.length - 1 ? 'See Results' : 'Continue Practice'}
          </button>
        </motion.div>
      )}
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
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting right now. Please try again." }]);
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
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-surface w-full max-w-2xl h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative z-10 border border-slate-border"
      >
        <header className="p-6 border-b border-slate-border flex items-center justify-between bg-bg-light/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
               <Sparkles className="w-5 h-5 text-white" />
             </div>
             <div>
               <h3 className="font-bold text-ink">Your GH AI Tutor</h3>
               <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Powered by Gemini AI</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button 
                onClick={() => setMessages([])}
                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                title="Clear Chat"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 bg-bg-light text-slate-400 rounded-xl hover:text-ink transition-colors border border-slate-border">
              <X className="w-6 h-6" />
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-bg-light/30">
          {messages.length === 0 && !loading && (
            <div className="text-center py-20 space-y-4">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-border">
                <MessageSquare className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium italic">Ask me anything about your syllabus or questions!</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                m.role === 'user' 
                  ? 'bg-brand-primary text-white rounded-tr-none' 
                  : 'bg-surface text-ink rounded-tl-none border border-slate-border'
              }`}>
                {m.role === 'ai' ? (
                  <div className="markdown-body prose prose-sm max-w-none">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                ) : (
                  m.text
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
               <div className="bg-surface p-4 rounded-2xl rounded-tl-none border border-slate-border shadow-sm flex items-center gap-2">
                 <Loader2 className="w-4 h-4 text-brand-primary animate-spin" />
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tutor is thinking...</span>
               </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-border bg-surface">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="relative"
          >
            <input 
              type="text" 
              placeholder="What would you like to know?"
                className="w-full pl-6 pr-16 py-4 bg-bg-light border-2 border-slate-border rounded-2xl focus:border-brand-primary focus:bg-surface transition-all outline-none text-ink font-medium placeholder:text-slate-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 px-4 bg-brand-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-surface border-2 border-brand-primary p-0.5 shadow-lg shadow-brand-primary/10 overflow-hidden shrink-0">
             <img 
               src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} 
               alt="Profile" 
               className="w-full h-full object-cover rounded-[0.9rem]" 
               referrerPolicy="no-referrer"
             />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-ink">{user?.displayName || 'Mastery Profile'}</h1>
            <p className="text-slate-500 font-medium">{user?.email || 'AceExams.gh Learner'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onReset} 
            className="px-6 py-3 rounded-2xl font-bold text-sm bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
          >
            Reset Progress
          </button>
          <button onClick={onBack} className="btn-secondary px-6 py-3 rounded-2xl font-bold text-sm h-fit">Back Home</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-gradient-to-br from-brand-primary/10 to-indigo-500/10 dark:from-slate-800 dark:to-slate-900 p-10 rounded-[2.5rem] text-ink dark:text-white space-y-8 shadow-sm border border-brand-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 blur-sm opacity-10"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="bg-brand-primary/10 border border-brand-primary/20 px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest text-brand-primary">Learning Streak</span>
            <Zap className="w-8 h-8 fill-amber-500 text-amber-500" />
          </div>
          <div className="space-y-2 relative z-10">
            <div className="flex items-baseline gap-2">
              <p className="text-7xl font-bold tracking-tighter">{stats.streak}</p>
              <p className="text-xl font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Days</p>
            </div>
            <p className="text-slate-500 dark:text-white/40 font-bold uppercase text-xs tracking-widest leading-relaxed">
              You're in the top 5% of active students this week! Keep it up.
            </p>
          </div>
          <div className="flex gap-2 relative z-10">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i < stats.streak ? 'bg-amber-400' : 'bg-slate-200 dark:bg-white/5'}`}></div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface p-8 rounded-[2.5rem] border border-slate-border flex flex-col justify-between shadow-sm group hover:border-amber-500 transition-all">
            <div className="space-y-1">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 text-amber-600 fill-amber-600" />
              </div>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Experience Points</p>
              <p className="text-4xl font-bold text-ink tracking-tighter">{stats.points.toLocaleString()}</p>
            </div>
            <p className="text-xs text-slate-400 mt-4 font-medium italic">Earned from quizzes & study.</p>
          </div>

          <div className="bg-surface p-8 rounded-[2.5rem] border border-slate-border flex flex-col justify-between shadow-sm group hover:border-emerald-500 transition-all">
            <div className="space-y-1">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Accuracy Record</p>
              <p className="text-4xl font-bold text-ink tracking-tighter">{stats.totalAttempted > 0 ? Math.round((stats.totalCorrect / stats.totalAttempted) * 100) : 0}%</p>
            </div>
            <div className="w-full h-1.5 bg-bg-light rounded-full mt-4 overflow-hidden">
              <motion.div 
                className="h-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${stats.totalAttempted > 0 ? (stats.totalCorrect / stats.totalAttempted) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-ink">Achievements</h2>
          <div className="px-3 py-1 bg-brand-primary/10 rounded-full text-brand-primary text-xs font-bold ring-1 ring-brand-primary/20">{Math.floor(stats.totalCorrect / 10)} Badges Unlocked</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[1, 5, 10, 20, 50, 100].map(n => {
            const earned = stats.totalCorrect >= n;
            return (
              <motion.div 
                key={n} 
                whileHover={earned ? { y: -5 } : {}}
                className={`relative p-6 rounded-[2rem] flex flex-col items-center justify-center gap-4 border-2 transition-all group ${earned ? 'bg-surface border-amber-500/50 text-amber-500 shadow-lg shadow-amber-500/10' : 'bg-bg-light border-slate-border text-slate-500 opacity-40 grayscale'}`}
              >
                <div className={`p-4 rounded-2xl ${earned ? 'bg-amber-500/10' : 'bg-slate-border'}`}>
                  <Trophy className={`w-10 h-10 ${earned ? 'text-amber-500' : 'text-slate-500'}`} />
                </div>
                <div className="text-center">
                   <p className="text-lg font-black tracking-tighter">{n}</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Successes</p>
                </div>
                {!earned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-bg-light/20 backdrop-blur-[1px] rounded-[2rem]">
                    <X className="w-6 h-6 text-slate-500" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-ink">Subject Mastery</h2>
        <div className="bg-surface p-8 rounded-[2.5rem] border border-slate-border shadow-sm">
          <div className="space-y-8">
            {[
              { id: 'math', name: 'Core Mathematics', label: 'Mathematics', color: 'bg-emerald-500' },
              { id: 'science', name: 'Integrated Science', label: 'Science', color: 'bg-blue-500' },
              { id: 'english', name: 'English Language', label: 'English', color: 'bg-amber-500' },
              { id: 'social', name: 'Social Studies', color: 'bg-rose-500' }
            ].map((sub) => {
              const data = stats.subjectStats?.[sub.name] || { attempted: 0, correct: 0 };
              const proficiency = data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0;
              
              return (
                <div key={sub.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-ink">{sub.label || sub.name}</p>
                    <p className="text-lg font-bold text-slate-500">{proficiency}%</p>
                  </div>
                  <div className="w-full h-2.5 bg-bg-light rounded-full overflow-hidden border border-slate-border">
                    <motion.div 
                      className={`h-full ${sub.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${proficiency}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
