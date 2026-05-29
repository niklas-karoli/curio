import type { Player, Question } from '../types';

export type RoomEvents = {
  join: (player: Player) => void;
  gameStart: () => void;
  nextQuestion: (question: Question, questionIndex: number) => void;
  submitAnswer: (answerIndex: number, timestamp: number) => void;
  timesUp: () => void;
  results: (players: Player[]) => void;
  kick: (playerId: string) => void;
};
