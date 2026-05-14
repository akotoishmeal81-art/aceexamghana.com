export type ExamType = 'BECE' | 'WASSCE';
export type SubjectType = 'Core' | 'Elective';

export interface Question {
  id: string;
  exam_type: ExamType;
  subject_type: SubjectType;
  subject: string;
  year: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  passage?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
}

export interface QuizHistory {
  id: string;
  date: string;
  subject: string;
  score: number;
  total: number;
  xpEarned: number;
  duration: number; // in seconds
}

export interface UserStats {
  uid?: string;
  totalAttempted: number;
  totalCorrect: number;
  streak: number;
  points: number;
  lastActive: string; // ISO date
  subjectScores: Record<string, number>; // Mastery percentage per subject
  subjectStats: Record<string, { attempted: number, correct: number }>;
  badges: Badge[];
  history: QuizHistory[];
}

export type QuizMode = 20 | 35 | 50;

export interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  score: number;
  answers: Record<string, string>; // questionId -> selectedOption
  isFinished: boolean;
  startTime: number;
  pausedTime: number;
  isPaused: boolean;
}
