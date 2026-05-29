export interface Question {
  id: string;
  questionText: string;
  timeLimit: number; // in seconds
  options: string[];
  correctAnswerIndex: number;
}

export interface Quiz {
  quizTitle: string;
  questions: Question[];
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  lastAnswerCorrect?: boolean;
  lastAnswerTime?: number;
}

export interface GameState {
  status: 'lobby' | 'playing' | 'question_result' | 'finished';
  currentQuestionIndex: number;
  remainingTime: number;
  players: Player[];
}
