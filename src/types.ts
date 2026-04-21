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
}

export interface UserStats {
  uid?: string;
  totalAttempted: number;
  totalCorrect: number;
  streak: number;
  lastActive: string; // ISO date
  subjectScores: Record<string, number>;
}

export type QuizMode = 5 | 10 | 20;

export interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  score: number;
  answers: Record<string, string>; // questionId -> selectedOption
  isFinished: boolean;
}
