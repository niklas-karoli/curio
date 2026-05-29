import { useState, useRef, useEffect } from 'react';
import { joinRoom, selfId } from 'trystero';
import { LogIn, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { AvatarPicker } from '../components/AvatarPicker';
import type { Player, Question } from '../types';
import { isProfane } from '../utils/profanityFilter';
import { cn } from '../utils/cn';

const config = { appId: 'curio-quiz-p2p' };

export const ParticipantView = () => {
  // Try to recover state from sessionStorage
  const savedData = JSON.parse(sessionStorage.getItem('curio-player') || '{}');

  const [roomCode, setRoomCode] = useState(savedData.roomCode || '');
  const [name, setName] = useState(savedData.name || '');
  const [avatar, setAvatar] = useState(savedData.avatar || '🐶');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'join' | 'waiting' | 'question' | 'answered' | 'result' | 'kicked'>('join');
  const [, setRoom] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [lastResult, setLastResult] = useState<{ correct: boolean; score: number } | null>(null);
  const [isWelcomed, setIsWelcome] = useState(false);

  const actionsRef = useRef<{
    join?: any;
    submitAnswer?: any;
  }>({});

  const retryTimerRef = useRef<any>(null);

  const handleJoin = () => {
    if (!roomCode) return setError('Bitte gib einen Raum-Code ein.');
    if (!name) return setError('Bitte gib deinen Namen ein.');
    if (isProfane(name)) return setError('Dieser Name ist leider nicht erlaubt.');

    // Save to session storage for reconnection
    sessionStorage.setItem('curio-player', JSON.stringify({ name, avatar, roomCode: roomCode.toUpperCase() }));

    const newRoom = joinRoom(config, roomCode.toUpperCase());
    setRoom(newRoom);

    const sendJoin = newRoom.makeAction('join');
    const sendSubmitAnswer = newRoom.makeAction('submitAnswer');

    actionsRef.current = {
      join: sendJoin,
      submitAnswer: sendSubmitAnswer,
    };

    const getGameStart = newRoom.makeAction('gameStart');
    const getNextQuestion = newRoom.makeAction('nextQuestion');
    const getTimesUp = newRoom.makeAction('timesUp');
    const getResults = newRoom.makeAction('results');
    const getKick = newRoom.makeAction('kick');
    const getWelcome = newRoom.makeAction('welcome');

    getGameStart.onMessage = () => setStatus('waiting');

    getNextQuestion.onMessage = (q: any) => {
      setCurrentQuestion(q as Question);
      setStatus('question');
    };

    getTimesUp.onMessage = () => {
      if (status !== 'answered') {
        setStatus('result');
      }
    };

    getResults.onMessage = (players: any) => {
      const me = (players as Player[]).find(p => p.name === name && p.avatar === avatar);
      if (me) {
        setLastResult({ correct: !!me.lastAnswerCorrect, score: me.score });
      }
      setStatus('result');
    };

    getKick.onMessage = (kickedId: any) => {
      if (kickedId === selfId) {
        setStatus('kicked');
        sessionStorage.removeItem('curio-player');
      }
    };

    getWelcome.onMessage = () => {
       setIsWelcome(true);
       if (retryTimerRef.current) clearInterval(retryTimerRef.current);
    };

    newRoom.onPeerJoin = (peerId: string) => {
      console.log('Peer joined:', peerId);
      actionsRef.current.join?.send({ name, avatar }, peerId);
    };

    setStatus('waiting');

    // Start a retry loop to ensure the host sees us
    if (retryTimerRef.current) clearInterval(retryTimerRef.current);
    retryTimerRef.current = setInterval(() => {
        actionsRef.current.join?.send({ name, avatar });
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearInterval(retryTimerRef.current);
    };
  }, []);

  const handleAnswer = (index: number) => {
    if (status !== 'question') return;
    const timestamp = Date.now();
    actionsRef.current.submitAnswer?.send({ answerIndex: index, timestamp });
    setStatus('answered');
  };

  if (status === 'kicked') {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">Entfernt</h1>
        <p className="text-gray-500 mb-8">Du wurdest aus der Lobby entfernt.</p>
        <Button onClick={() => window.location.reload()}>Zurück zum Start</Button>
      </div>
    );
  }

  if (status === 'join') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Beitreten</h1>
            <p className="text-gray-500">Gib den Code ein und wähle dein Profil.</p>
          </div>

          {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm border border-red-100">{error}</div>}

          <Input
            label="Raum-Code"
            placeholder="ABCDEF"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
          />

          <Input
            label="Dein Name"
            placeholder="z.B. Quiz-Held*in"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 ml-1">Wähle deinen Avatar</label>
            <AvatarPicker selectedAvatar={avatar} onSelect={setAvatar} />
          </div>

          <Button onClick={handleJoin} size="lg" className="w-full gap-2">
            <LogIn className="w-5 h-5" /> Jetzt beitreten
          </Button>
        </Card>
      </div>
    );
  }

  if (status === 'waiting') {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-bounce text-6xl mb-6">{avatar}</div>
        <h2 className="text-2xl font-bold mb-2">Hallo {name}!</h2>
        <p className="text-gray-500">
            {isWelcomed
                ? 'Du bist in der Lobby. Warte auf den Start durch die*den Hostende*n...'
                : 'Verbindung wird hergestellt...'}
        </p>
      </div>
    );
  }

  if (status === 'question' && currentQuestion) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col p-4 gap-4">
        <div className="text-center py-4 bg-white rounded-2xl shadow-sm border border-gray-50">
           <h2 className="text-xl font-bold px-4">{currentQuestion.questionText}</h2>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4">
          {currentQuestion.options.map((_, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              className={cn(
                "rounded-3xl shadow-lg active:scale-95 transition-transform",
                i === 0 && "bg-red-400",
                i === 1 && "bg-blue-400",
                i === 2 && "bg-yellow-400",
                i === 3 && "bg-green-400"
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  if (status === 'answered') {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <Clock className="w-16 h-16 text-secondary mx-auto mb-6 animate-pulse" />
        <h2 className="text-2xl font-bold mb-2">Antwort abgegeben!</h2>
        <p className="text-gray-500">Warte auf die anderen Teilnehmenden...</p>
      </div>
    );
  }

  if (status === 'result') {
    return (
      <div className={cn(
        "min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center p-6 transition-colors duration-500",
        lastResult?.correct ? "bg-green-50" : "bg-red-50"
      )}>
        {lastResult?.correct ? (
          <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="bg-white p-6 rounded-full shadow-lg inline-block">
              <CheckCircle2 className="w-24 h-24 text-green-500" />
            </div>
            <h1 className="text-5xl font-black text-green-600">Richtig!</h1>
            <div className="bg-green-600 text-white px-8 py-4 rounded-3xl shadow-md inline-block">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Punktestand</p>
              <p className="text-4xl font-black">{lastResult.score}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in duration-500">
             <div className="bg-white p-6 rounded-full shadow-lg inline-block">
              <XCircle className="w-24 h-24 text-red-400" />
            </div>
            <h1 className="text-5xl font-black text-red-600">Leider falsch</h1>
            <p className="text-gray-500 text-lg">Nächste Frage wird besser!</p>
            <div className="bg-white border-2 border-red-100 px-8 py-4 rounded-3xl inline-block">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Aktueller Stand</p>
              <p className="text-4xl font-black text-gray-700">{lastResult?.score || 0}</p>
            </div>
          </div>
        )}
        <p className="mt-16 text-gray-400 font-medium animate-pulse">Warte auf die nächste Frage...</p>
      </div>
    );
  }

  return null;
};
