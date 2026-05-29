import { useState, useEffect, useRef } from 'react';
import { joinRoom } from 'trystero';
import { Upload, Users, Play, X, Trophy } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import type { Quiz, Player } from '../types';
import { calculateScore } from '../utils/scoring';
import { cn } from '../utils/cn';

const config = { appId: 'curio-quiz-p2p' };

export const HostView = () => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [roomCode, setRoomCode] = useState<string>('');
  const [, setRoom] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStatus, setGameStatus] = useState<'upload' | 'lobby' | 'question' | 'result' | 'podium'>('upload');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [answersReceived, setAnswersReceived] = useState<Record<string, { optionIndex: number; points: number }>>({});

  const timerRef = useRef<any>(null);
  const remainingTimeRef = useRef<number>(0);
  const currentQuestionIndexRef = useRef<number>(0);
  const quizRef = useRef<Quiz | null>(null);
  const actionsRef = useRef<any>({});

  useEffect(() => {
    remainingTimeRef.current = remainingTime;
  }, [remainingTime]);

  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  useEffect(() => {
    quizRef.current = quiz;
  }, [quiz]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (gameStatus !== 'upload' && gameStatus !== 'podium') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [gameStatus]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setQuiz(json);
        initRoom();
      } catch (err) {
        alert('Ungültige Quiz-Datei.');
      }
    };
    reader.readAsText(file);
  };

  const initRoom = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    const newRoom = joinRoom(config, code);
    setRoom(newRoom);
    setGameStatus('lobby');

    actionsRef.current.gameStart = newRoom.makeAction('gameStart');
    actionsRef.current.nextQuestion = newRoom.makeAction('nextQuestion');
    actionsRef.current.timesUp = newRoom.makeAction('timesUp');
    actionsRef.current.results = newRoom.makeAction('results');
    actionsRef.current.kick = newRoom.makeAction('kick');

    const getJoin = newRoom.makeAction('join');
    const getSubmitAnswer = newRoom.makeAction('submitAnswer');

    getJoin.onMessage = (data: any, { peerId }: { peerId: string }) => {
      setPlayers((prev) => {
        if (prev.find((p) => p.id === peerId)) return prev;
        return [...prev, { ...data, id: peerId, score: 0 }];
      });
    };

    getSubmitAnswer.onMessage = (data: any, { peerId }: { peerId: string }) => {
      const qIndex = currentQuestionIndexRef.current;
      const currentQuiz = quizRef.current;
      if (!currentQuiz) return;

      const question = currentQuiz.questions[qIndex];
      let points = 0;

      if (data.answerIndex === question.correctAnswerIndex) {
        points = calculateScore(remainingTimeRef.current, question.timeLimit);
      }

      setAnswersReceived((prev) => ({
        ...prev,
        [peerId]: { optionIndex: data.answerIndex, points },
      }));
    };

    newRoom.onPeerLeave = (peerId: string) => {
      setPlayers((prev) => prev.filter((p) => p.id !== peerId));
    };
  };

  const startGame = () => {
    if (players.length === 0) {
      alert('Warte auf Teilnehmende...');
      return;
    }
    actionsRef.current.gameStart?.send({});
    startNextQuestion(0);
  };

  const startNextQuestion = (index: number) => {
    const question = quiz!.questions[index];
    setCurrentQuestionIndex(index);
    setAnswersReceived({});
    setRemainingTime(question.timeLimit);
    setGameStatus('question');
    actionsRef.current.nextQuestion?.send(question);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (remainingTime === 0 && gameStatus === 'question') {
      finishQuestion();
    }
  }, [remainingTime, gameStatus]);

  const finishQuestion = () => {
    actionsRef.current.timesUp?.send({});
    setGameStatus('result');

    setPlayers((prevPlayers) => {
      const updated = prevPlayers.map((player) => {
        const answer = answersReceived[player.id];
        return {
          ...player,
          score: player.score + (answer?.points || 0),
          lastAnswerCorrect: (answer?.points || 0) > 0,
        };
      });
      return updated;
    });
  };

  useEffect(() => {
    if (gameStatus === 'result') {
      const sorted = [...players].sort((a, b) => b.score - a.score);
      actionsRef.current.results?.send(sorted);
    }
  }, [players, gameStatus]);

  const nextAction = () => {
    if (currentQuestionIndex < quiz!.questions.length - 1) {
      startNextQuestion(currentQuestionIndex + 1);
    } else {
      setGameStatus('podium');
    }
  };

  const kickPlayer = (id: string) => {
    actionsRef.current.kick?.send(id);
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  if (gameStatus === 'upload') {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center">
        <Card className="max-w-md w-full p-12 text-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Upload className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Quiz laden</h2>
          <p className="text-gray-500 mb-8">Lade deine .json Datei hoch, um eine Lobby zu starten.</p>
          <div className="block">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="quiz-upload"
            />
            <label htmlFor="quiz-upload" className="flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95 bg-primary hover:bg-opacity-80 text-text-dark shadow-sm px-6 py-3 text-lg font-semibold w-full cursor-pointer">
              Datei auswählen
            </label>
          </div>
        </Card>
      </div>
    );
  }

  if (gameStatus === 'lobby') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <p className="text-gray-500 uppercase tracking-widest font-semibold mb-2">Raum-Code</p>
          <h1 className="text-7xl font-black text-secondary">{roomCode}</h1>
        </div>

        <Card className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">{players.length} Teilnehmende</h2>
            </div>
            <Button onClick={startGame} disabled={players.length === 0} className="gap-2">
              <Play className="w-4 h-4" /> Spiel starten
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {players.map((p) => (
              <div key={p.id} className="relative group bg-gray-50 p-4 rounded-2xl flex flex-col items-center gap-2">
                <button
                  onClick={() => kickPlayer(p.id)}
                  className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
                <span className="text-3xl">{p.avatar}</span>
                <span className="font-medium truncate w-full text-center">{p.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (gameStatus === 'question') {
    const q = quiz!.questions[currentQuestionIndex];
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col">
        <div className="bg-white border-b border-gray-100 p-8 text-center">
          <div className="flex justify-between items-center max-w-6xl mx-auto mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center font-bold text-xl">
              {remainingTime}
            </div>
            <div className="text-gray-400 font-medium">
              Frage {currentQuestionIndex + 1} von {quiz!.questions.length}
            </div>
            <div className="bg-secondary/20 text-secondary px-4 py-2 rounded-full font-bold">
              {Object.keys(answersReceived).length} / {players.length} Antworten
            </div>
          </div>
          <h1 className="text-4xl font-bold max-w-4xl mx-auto">{q.questionText}</h1>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 p-8 max-w-6xl mx-auto w-full">
          {q.options.map((opt, i) => (
            <div
              key={i}
              className={cn(
                "rounded-3xl flex items-center justify-center p-8 text-2xl font-bold text-white shadow-lg",
                i === 0 && "bg-red-400",
                i === 1 && "bg-blue-400",
                i === 2 && "bg-yellow-400",
                i === 3 && "bg-green-400"
              )}
            >
              {opt}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (gameStatus === 'result') {
    const q = quiz!.questions[currentQuestionIndex];
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">Ergebnis der Runde</h2>
          <h1 className="text-3xl font-bold text-gray-600 mb-8">{q.questionText}</h1>
          <div className="bg-primary/20 text-primary-dark inline-block px-6 py-3 rounded-2xl font-bold text-xl mb-12">
            Richtige Antwort: {q.options[q.correctAnswerIndex]}
          </div>
        </div>

        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Bestenliste</h3>
            <Button onClick={nextAction}>
              {currentQuestionIndex < quiz!.questions.length - 1 ? 'Nächste Frage' : 'Zum Endergebnis'}
            </Button>
          </div>
          <div className="space-y-3">
            {players.slice(0, 5).map((p, i) => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-gray-400 w-6">#{i + 1}</span>
                  <span className="text-2xl">{p.avatar}</span>
                  <span className="font-bold">{p.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  {p.lastAnswerCorrect ? (
                    <span className="text-green-500 font-bold text-sm">Richtig!</span>
                  ) : (
                    <span className="text-red-400 font-bold text-sm">Falsch</span>
                  )}
                  <span className="bg-white px-4 py-1 rounded-full border border-gray-200 font-mono font-bold">
                    {p.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (gameStatus === 'podium') {
    const winners = [...players].sort((a, b) => b.score - a.score);
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center">
        <Trophy className="w-20 h-20 text-yellow-400 mb-6" />
        <h1 className="text-5xl font-black mb-12">Endergebnis</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl items-end mb-12">
          {/* 2nd Place */}
          {winners[1] && (
            <div className="flex flex-col items-center order-2 md:order-1">
              <span className="text-4xl mb-2">{winners[1].avatar}</span>
              <div className="bg-gray-100 w-full rounded-t-3xl p-8 flex flex-col items-center h-48 shadow-inner">
                <span className="font-bold text-xl mb-1">{winners[1].name}</span>
                <span className="text-gray-500">{winners[1].score} Punkte</span>
                <div className="mt-auto font-black text-4xl text-gray-300">2</div>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {winners[0] && (
            <div className="flex flex-col items-center order-1 md:order-2">
              <span className="text-6xl mb-2 animate-bounce">👑</span>
              <span className="text-5xl mb-2">{winners[0].avatar}</span>
              <div className="bg-secondary/30 w-full rounded-t-3xl p-8 flex flex-col items-center h-64 border-x-4 border-t-4 border-secondary shadow-lg">
                <span className="font-bold text-2xl mb-1">{winners[0].name}</span>
                <span className="text-secondary-dark font-bold text-lg">{winners[0].score} Punkte</span>
                <div className="mt-auto font-black text-6xl text-secondary">1</div>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {winners[2] && (
            <div className="flex flex-col items-center order-3 md:order-3">
              <span className="text-4xl mb-2">{winners[2].avatar}</span>
              <div className="bg-orange-50 w-full rounded-t-3xl p-8 flex flex-col items-center h-32 shadow-inner">
                <span className="font-bold text-lg mb-1">{winners[2].name}</span>
                <span className="text-gray-500">{winners[2].score} Punkte</span>
                <div className="mt-auto font-black text-3xl text-orange-200">3</div>
              </div>
            </div>
          )}
        </div>

        <Button size="lg" onClick={() => window.location.reload()}>
          Neues Spiel
        </Button>
      </div>
    );
  }

  return null;
};
