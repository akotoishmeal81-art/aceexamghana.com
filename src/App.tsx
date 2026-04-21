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
  User as UserIcon
} from 'lucide-react';
import { Question, UserStats, ExamType, SubjectType } from './types';
import { QUESTIONS } from './data/questions';
import { 
  auth, 
  loginWithGoogle, 
  logout, 
  signUpManual,
  loginManual,
  getUserProgress, 
  saveUserProgress 
} from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// --- Sub-components (Simplified for brevity) ---

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

// --- Content Components ---

export default function App() {
  const [view, setView] = useState<'dashboard' | 'study' | 'quiz' | 'stats' | 'auth'>('dashboard');
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
    if (saved) return JSON.parse(saved);
    return {
      totalAttempted: 0,
      totalCorrect: 0,
      streak: 4, // Default for aesthetic in demo
      lastActive: new Date().toISOString(),
      subjectScores: {}
    };
  });

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'study', icon: BookOpen, label: 'Flash Cards' },
    { id: 'quiz', icon: Zap, label: 'Quizzes' },
    { id: 'stats', icon: Trophy, label: 'Performance' },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (currentUser) {
        // Fetch cloud stats
        const cloudStats = await getUserProgress(currentUser.uid);
        if (cloudStats) {
          setStats(cloudStats);
        } else {
          // If no cloud stats, sync local stats to cloud
          await saveUserProgress(currentUser.uid, stats);
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

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">
            {user ? `Welcome back, ${user.displayName?.split(' ')[0]} 👋` : 'Welcome back, Student 👋'}
          </h2>
          <p className="text-slate-500">Ready to crush your BECE 2025 prep?</p>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-bold border border-amber-200">⭐ 1,450 Points</div>
          {user ? (
            <button 
              onClick={() => logout()}
              className="w-12 h-12 rounded-full bg-slate-200 border-2 border-white shadow-sm ring-1 ring-slate-100 overflow-hidden group relative"
            >
              <img src={user.photoURL || ''} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <LogOut className="w-5 h-5 text-white" />
              </div>
            </button>
          ) : (
            <button 
              onClick={() => setView('auth')}
              className="w-12 h-12 rounded-full bg-slate-200 border-2 border-white shadow-sm ring-1 ring-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-300 transition-colors"
            >
              <UserIcon className="w-6 h-6" />
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
            className="btn-primary bg-white text-blue-700 hover:bg-blue-50 w-full md:w-auto"
          >
            Login Now
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 text-2xl font-bold">🃏</div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Attempted</p>
              <p className="text-xl font-bold">{stats.totalAttempted}</p>
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
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-1">PRO PREP</h3>
            <p className="text-lg font-bold text-slate-800">Master 2025 Core Subjects</p>
            <p className="text-xs text-slate-500 mt-1">Personalized study plan active.</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform duration-500 opacity-50"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Search Library</h3>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Keyword search..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all font-medium"
                  value={filters.search}
                  onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setFilters(f => ({ ...f, examType: 'BECE' }))}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${filters.examType === 'BECE' ? 'bg-brand-primary text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-border hover:bg-slate-100'}`}
                >
                  BECE
                </button>
                <button 
                  onClick={() => setFilters(f => ({ ...f, examType: 'WASSCE' }))}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${filters.examType === 'WASSCE' ? 'bg-brand-primary text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-border hover:bg-slate-100'}`}
                >
                  WASSCE
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Subject</label>
                  <select 
                    className="w-full p-2.5 bg-slate-50 border border-slate-border rounded-xl text-sm font-medium focus:outline-none"
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-border rounded-xl text-sm font-medium focus:outline-none"
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
                  className="w-full py-2 flex items-center justify-center gap-2 text-rose-600 font-bold text-xs uppercase hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Reset Filters
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Subject Mastery</h3>
            <div className="space-y-4">
              {[
                { name: 'Mathematics', score: 85, color: 'bg-emerald-500' },
                { name: 'Science', score: 72, color: 'bg-blue-500' },
                { name: 'English', score: 94, color: 'bg-amber-500' },
              ].map(subj => (
                <div key={subj.name} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-slate-700">{subj.name}</span>
                    <span className="font-bold text-slate-400 italic">{subj.score}%</span>
                  </div>
                  <div className="h-2 bg-slate-50 rounded-full border border-slate-100 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${subj.score}%` }}
                      className={`h-full ${subj.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              Quick Practice
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => setView('study')}
              className="bg-white p-8 rounded-[2rem] border-2 border-slate-border hover:border-brand-primary transition-all group relative overflow-hidden"
            >
              <div className="relative z-10 text-left">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-7 h-7 text-brand-primary" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Study Mode</h3>
                <p className="text-slate-500 mt-2 font-medium">Flashcards with active recall</p>
                <div className="mt-8 flex items-center gap-2 text-brand-primary font-bold uppercase text-xs">
                  Start Sessions <ChevronRight className="w-4 h-4" />
                </div>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <div className="text-8xl font-black">ST</div>
              </div>
            </button>

            <button 
              onClick={() => setView('quiz')}
              className="bg-slate-900 p-8 rounded-[2rem] text-white hover:shadow-2xl transition-all group relative overflow-hidden"
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

          <div className="bg-white p-6 rounded-2xl border border-slate-200">
             <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-slate-800">Recent Questions</h3>
               <button className="text-xs font-bold text-brand-primary hover:underline">View All</button>
             </div>
             <div className="space-y-3">
              {filteredQuestions.slice(0, 3).map(q => (
                <div key={q.id} className="p-4 bg-slate-50 border border-slate-border rounded-xl flex items-center justify-between group hover:bg-white hover:border-slate-300 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md">{q.exam_type}</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter italic">#{q.year} • {q.subject}</span>
                    </div>
                    <p className="text-slate-800 font-semibold line-clamp-1">{q.question}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                </div>
              ))}
             </div>
          </div>
        </section>
      </div>
    </div>
  );

  const renderStudy = () => <StudyMode onBack={() => setView('dashboard')} questions={filteredQuestions} />;
  const renderQuiz = () => <QuizModeView onBack={() => setView('dashboard')} questions={filteredQuestions} onFinish={(correct) => {
    setStats(prev => ({
      ...prev,
      totalAttempted: prev.totalAttempted + filteredQuestions.length,
      totalCorrect: prev.totalCorrect + correct,
      streak: prev.streak + 1, // Simple streak
      lastActive: new Date().toISOString()
    }));
  }} />;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isSignUp) {
        await signUpManual(email, password, authDisplayName);
      } else {
        await loginManual(email, password);
      }
      setView('dashboard');
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    }
  };

  const renderAuth = () => (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="max-w-md w-full bg-white p-10 rounded-[3rem] border border-slate-border shadow-2xl text-center space-y-8 relative overflow-hidden">
        {/* Background Geometric Decor */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-rose-50 rounded-full blur-3xl opacity-50"></div>

        <div className="relative space-y-6">
          <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-brand-primary/20 rotate-12">
            <UserIcon className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              {isSignUp ? 'Start your journey to BECE excellence today.' : 'Sign in to continue your mastery journey.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4 relative">
          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold flex items-center gap-2">
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
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-brand-primary focus:bg-white transition-all outline-none text-slate-800 font-medium"
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
                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-brand-primary focus:bg-white transition-all outline-none text-slate-800 font-medium"
              />
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-brand-primary focus:bg-white transition-all outline-none text-slate-800 font-medium"
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
            <div className="h-px flex-1 bg-slate-100"></div>
            <span className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">Or Continue With</span>
            <div className="h-px flex-1 bg-slate-100"></div>
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
            className="w-full flex items-center justify-center gap-3 py-3 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-600 hover:border-slate-300 transition-all active:scale-95 text-sm"
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
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-border hidden md:flex flex-col z-40 transform transition-transform duration-300">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg ring-1 ring-blue-400/20">A</div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">AceExams<span className="text-brand-primary">.gh</span></h1>
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
        </nav>

        <div className="p-6 border-t border-slate-50 m-4 rounded-2xl bg-slate-50/50">
          <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-widest mb-3">Today's Streak</p>
          <div className="flex gap-1.5 mb-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 flex-1 rounded-full ${i < stats.streak ? 'bg-brand-primary' : 'bg-slate-200'}`} 
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
              {view === 'stats' && <StatsView stats={stats} onBack={() => setView('dashboard')} />}
              {view === 'auth' && renderAuth()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Nav (Floating Bar) */}
        <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-2xl border border-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2rem] p-2 flex items-center justify-around z-50">
          {navItems.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setView(id as any)}
              className={`p-4 rounded-3xl transition-all ${view === id ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/30 scale-110' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}

// --- Study Mode ---

function StudyMode({ onBack, questions }: { onBack: () => void, questions: Question[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const current = questions[index];

  if (!current) return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
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
          <div className="flip-card-front">
            <div className="absolute top-6 left-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{current.subject}</span>
            </div>
            <div className="absolute top-6 right-8 text-slate-200 font-mono text-xl italic drop-shadow-sm leading-none">#{current.year}</div>
            
            <h2 className="text-2xl md:text-3xl font-display leading-tight px-6">{current.question}</h2>
            
            <div className="mt-12 flex flex-col items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-full">
                <RotateCcw className="w-5 h-5 text-brand-primary" />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tap to flip card</p>
            </div>
          </div>
          <div className="flip-card-back bg-brand-primary">
            <div className="absolute top-6 left-8 text-white/40 text-[10px] font-bold uppercase tracking-widest">Verified Answer</div>
            <div className="space-y-6 px-4">
              <div className="space-y-2">
                <p className="text-3xl font-display font-black text-white drop-shadow-md">{current.correct_answer}</p>
                <div className="h-1 w-12 bg-white/30 mx-auto rounded-full"></div>
              </div>
              <div className="bg-white/10 p-6 rounded-2xl text-sm border border-white/10 text-white/90 text-left leading-relaxed">
                <strong className="block text-white mb-2 font-bold uppercase text-[10px] tracking-widest">Explanation:</strong>
                {current.explanation}
              </div>
            </div>
            <div className="mt-12 text-white/40 text-xs font-bold uppercase tracking-widest animate-bounce">Tap to close</div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 max-w-2xl mx-auto">
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
      </div>
    </div>
  );
}

// --- Quiz Mode ---

function QuizModeView({ onBack, questions, onFinish }: { onBack: () => void, questions: Question[], onFinish: (correct: number) => void }) {
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
      onFinish(correct);
      setStep('results');
    } else {
      setCurrentIndex(i => i + 1);
      setShowExplanation(false);
    }
  };

  if (step === 'config') return (
    <div className="space-y-8 py-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-rose-100">
          <Zap className="w-10 h-10 text-rose-600 fill-rose-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800">Quiz Arena</h2>
        <p className="text-slate-500 max-w-sm mx-auto font-medium">Test your knowledge under pressure and climb the leaderboard.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {[5, 10, 20].map(n => (
          <button 
            key={n}
            onClick={() => startQuiz(n)}
            className="bg-white p-8 rounded-3xl border-2 border-slate-border hover:border-brand-primary transition-all text-center group active:scale-95"
          >
            <div className="text-4xl font-black text-slate-200 mb-2 group-hover:text-brand-primary transition-colors">{n}</div>
            <span className="font-bold text-slate-500 uppercase text-xs tracking-widest">Questions</span>
          </button>
        ))}
      </div>
      <div className="text-center">
        <button onClick={onBack} className="text-slate-400 font-bold uppercase text-xs tracking-widest hover:text-slate-800">Cancel</button>
      </div>
    </div>
  );

  if (step === 'results') {
    const score = quizQuestions.filter(q => answers[q.id] === q.correct_answer).length;
    const percentage = Math.round((score / quizQuestions.length) * 100);

    return (
      <div className="space-y-12 py-10 text-center animate-in fade-in zoom-in-95 duration-700">
        <div className="relative inline-block">
          <div className="w-56 h-56 rounded-full border-[12px] border-slate-100 flex items-center justify-center mx-auto relative overflow-hidden bg-white shadow-inner">
            <div className={`absolute bottom-0 left-0 right-0 ${percentage > 70 ? 'bg-emerald-500' : 'bg-brand-primary'} transition-all`} style={{ height: `${percentage}%`, opacity: 0.1 }}></div>
            <span className={`text-6xl font-black ${percentage > 70 ? 'text-emerald-600' : 'text-brand-primary'}`}>{percentage}%</span>
          </div>
          <div className="absolute -top-4 -right-4 p-4 bg-amber-400 rounded-2xl shadow-xl shadow-amber-200 rotate-12">
            <Star className="w-8 h-8 text-white fill-white" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-4xl font-bold text-slate-800">Excellent Work!</h2>
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
        <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden border border-slate-300">
          <motion.div 
            className="bg-brand-primary h-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / quizQuestions.length) * 100}%` }}
          />
        </div>
        <span className="text-lg font-black text-slate-400 font-mono tracking-tighter">{currentIndex + 1} / {quizQuestions.length}</span>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Zap className="w-32 h-32 text-brand-primary" />
        </div>
        
        <div className="relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-slate-100 text-slate-500 rounded-lg">{current.subject}</span>
          <h3 className="text-3xl font-bold mt-6 leading-tight text-slate-800">{current.question}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {current.options.map((option, idx) => {
            const letter = String.fromCharCode(65 + idx);
            let style = "border-slate-border bg-slate-50/50 hover:bg-white hover:border-brand-primary hover:shadow-md";
            let letterStyle = "bg-slate-100 text-slate-400 mb-0 group-hover:bg-brand-primary group-hover:text-white";
            
            if (showExplanation) {
              if (option === current.correct_answer) {
                style = "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-100";
                letterStyle = "bg-emerald-600 text-white";
              }
              else if (option === selected) {
                style = "border-rose-500 bg-rose-50 text-rose-800 shadow-sm ring-1 ring-rose-100";
                letterStyle = "bg-rose-600 text-white";
              }
              else style = "opacity-40 border-slate-border pointer-events-none";
            } else if (selected === option) {
              style = "border-brand-primary bg-blue-50 text-brand-primary";
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
          <div className={`p-8 rounded-[2rem] border-2 flex items-start gap-4 ${isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
            <div className={`p-2 rounded-full flex-shrink-0 ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
              {isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            <div>
              <p className={`text-lg font-bold mb-1 ${isCorrect ? 'text-emerald-900' : 'text-rose-900'}`}>
                {isCorrect ? 'Fantastic! You got it right.' : 'Oops, not quite!'}
              </p>
              <p className={`text-sm leading-relaxed ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                {current.explanation}
              </p>
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

// --- Stats View ---

function StatsView({ stats, onBack }: { stats: UserStats, onBack: () => void }) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Learning Mastery</h1>
        <button onClick={onBack} className="btn-secondary px-4 py-2">Back Home</button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-gradient-to-br from-slate-800 to-slate-900 p-10 rounded-[2.5rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="bg-white/10 border border-white/10 px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest text-white/60">Learning Streak</span>
            <Zap className="w-8 h-8 fill-amber-300 text-amber-300 drop-shadow-glow" />
          </div>
          <div className="space-y-2 relative z-10">
            <div className="flex items-baseline gap-2">
              <p className="text-7xl font-bold tracking-tighter">{stats.streak}</p>
              <p className="text-xl font-bold text-white/40 uppercase tracking-widest">Days</p>
            </div>
            <p className="text-white/40 font-bold uppercase text-xs tracking-widest leading-relaxed">
              You're in the top 5% of active students this week! Keep it up.
            </p>
          </div>
          <div className="flex gap-2 relative z-10">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i < stats.streak ? 'bg-amber-400' : 'bg-white/10'}`}></div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-border flex flex-col justify-between shadow-sm group hover:border-brand-primary transition-all">
            <div className="space-y-1">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Questions Correct</p>
              <p className="text-4xl font-bold text-slate-800 tracking-tighter">{stats.totalCorrect}</p>
            </div>
            <p className="text-xs text-slate-400 mt-4 font-medium italic">Mastery across all subjects.</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-border flex flex-col justify-between shadow-sm group hover:border-blue-500 transition-all">
            <div className="space-y-1">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6 text-brand-primary" />
              </div>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Accuracy Record</p>
              <p className="text-4xl font-bold text-brand-primary tracking-tighter">{stats.totalAttempted > 0 ? Math.round((stats.totalCorrect / stats.totalAttempted) * 100) : 0}%</p>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
              <motion.div 
                className="h-full bg-brand-primary"
                initial={{ width: 0 }}
                animate={{ width: `${stats.totalAttempted > 0 ? (stats.totalCorrect / stats.totalAttempted) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Achievements</h2>
          <div className="px-3 py-1 bg-amber-50 rounded-full text-amber-700 text-xs font-bold ring-1 ring-amber-100">{Math.floor(stats.totalCorrect / 10)} Badges Unlocked</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[1, 5, 10, 20, 50, 100].map(n => {
            const earned = stats.totalCorrect >= n;
            return (
              <motion.div 
                key={n} 
                whileHover={earned ? { y: -5 } : {}}
                className={`relative p-6 rounded-[2rem] flex flex-col items-center justify-center gap-4 border-2 transition-all group ${earned ? 'bg-white border-amber-200 text-amber-600 shadow-lg shadow-amber-100' : 'bg-slate-50 border-slate-100 text-slate-300 opacity-40 grayscale'}`}
              >
                <div className={`p-4 rounded-2xl ${earned ? 'bg-amber-100' : 'bg-slate-100'}`}>
                  <Trophy className={`w-10 h-10 ${earned ? 'text-amber-600' : 'text-slate-300'}`} />
                </div>
                <div className="text-center">
                   <p className="text-lg font-black tracking-tighter">{n}</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Successes</p>
                </div>
                {!earned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50/20 backdrop-blur-[1px] rounded-[2rem]">
                    <X className="w-6 h-6 text-slate-200" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
