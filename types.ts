export enum Role {
  PROFESSOR = 'Professor',
  STUDENT = 'Student',
}

export interface GradingStep {
  description: string;
  marks: number;
}

export interface GradingKeyword {
  keyword: string;
  marks: number;
}

export interface GradingQuestion {
  questionNumber: string;
  maxMarks: number;
  finalAnswer: string;
  steps: GradingStep[];
  keywords: GradingKeyword[];
}

export interface GradingCriteria {
  examName: string;
  totalMarks: number;
  questions: GradingQuestion[];
}

export interface GradedStep {
  step: number;
  description: string;
  correct: boolean;
  marks: number;
}

export interface GradedQuestionResult {
  questionNumber: string;
  marksAwarded: number;
  maxMarks: number;
  feedback: string;
  steps: GradedStep[];
  keywordsFound: string[];
  areaForImprovement: string;
  isDisputed: boolean;
  disputeResolutionComment?: string;
}

export interface GradedResult {
  totalMarksAwarded: number;
  totalMaxMarks: number;
  questions: GradedQuestionResult[];
}

export interface StudentSubmission {
  id: string;
  submissionDate: string;
  studentName: string;
  answerSheetUrl: string; // In a real app, this would be a URL to stored file
  answerSheetBase64: string; // For passing to API
  gradedResult: GradedResult | null;
}