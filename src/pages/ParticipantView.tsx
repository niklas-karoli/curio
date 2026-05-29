import { useState, useRef, useEffect } from 'react';
import mqtt from 'mqtt';
import { LogIn, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { AvatarPicker } from '../components/AvatarPicker';
import type { Player, Question } from '../types';
import { isProfane } from '../utils/profanityFilter';
import { cn } from '../utils/cn';

const BROKER_URL = 'wss://broker.hivemq.com:8004/mqtt';

export const ParticipantView = () => {
  const savedData = JSON.parse(sessionStorage.getItem('curio-player') || '{}');

  const [roomCode, setRoomCode] = useState(savedData.roomCode || '');
  const [name, setName] = useState(savedData.name || '');
  const [avatar, setAvatar] = useState(savedData.avatar || '🐶');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'join' | 'waiting' | 'question' | 'answered' | 'result' | 'kicked'>('join');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [lastResult, setLastResult] = useState<{ correct: boolean; score: number } | null>(null);
  const [isWelcomed, setIsWelcome] = useState(false);

  // Eindeutige ID für dieses Gerät generieren/behalten
  const peerIdRef = useRef<string>(
    savedData.peerId || `client_${Math.random().toString(16).substring(2, 10)}`
  );
  const clientRef = useRef<mqtt.MqttClient | null>(null);
  const statusRef = useRef<string>('join');

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Cleanup bei Unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) clientRef.current.end();
    };
  }, []);

  const handleJoin = () => {
    if (!roomCode) return setError('Bitte gib einen Raum-Code ein.');
    if (!name) return setError('Bitte gib deinen Namen ein.');
    if (isProfane(name)) return setError('Dieser Name ist leider nicht erlaubt.');

    const cleanCode = roomCode.toUpperCase();
    const myId = peerIdRef.current;

    sessionStorage.setItem(
      'curio-player',
      JSON.stringify({ name, avatar, roomCode: cleanCode, peerId: myId })
    );

    // Verbindung zum performanten Cloud-Broker aufbauen
    const client = mqtt.connect(BROKER_URL, {
      keepalive: 30,
      reconnectPeriod: 2000,
      connectTimeout: 5000,
      clientId: `curio_client_${myId}`
    });

    clientRef.current = client;
    setStatus('waiting');

    client.on('connect', () => {
      // Relevante Host-Kanäle abonnieren
      client.subscribe(`curio/${cleanCode}/gameStart`, { qos: 0 });
      client.subscribe(`curio/${cleanCode}/nextQuestion`, { qos: 0 });
      client.subscribe(`curio/${cleanCode}/timesUp`, { qos: 0 });
      client.subscribe(`curio/${cleanCode}/results`, { qos: 0 });
      client.subscribe(`curio/${cleanCode}/kick`, { qos: 0 });
      client.subscribe(`curio/${cleanCode}/welcome`, { qos: 0 });

      // Dem Host direkt signalisieren, dass wir da sind
      const joinPayload = {
        peerId: myId,
        data: { name, avatar }
      };
      client.publish(`curio/${cleanCode}/join`, JSON.stringify(joinPayload), { qos: 0, retain: false });
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        const { targetPeerId, data } = payload;

        // Falls die Nachricht an einen spezifischen Client gerichtet ist, filtern
        if (targetPeerId && targetPeerId !== myId) return;

        if (topic.endsWith('/welcome')) {
          setIsWelcome(true);
        }

        if (topic.endsWith('/gameStart')) {
          setStatus('waiting');
        }

        if (topic.endsWith('/nextQuestion')) {
          setCurrentQuestion(data as Question);
          setStatus('question');
        }

        if (topic.endsWith('/timesUp')) {
          if (statusRef.current !== 'answered') {
            setStatus('result');
          }
        }

        if (topic.endsWith('/results')) {
          const players = data as Player[];
          const me = players.find((p) => p.id === myId);
          if (me) {
            setLastResult({ correct: !!me.lastAnswerCorrect, score: me.score });
          }
          setStatus('result');
        }

        if (topic.endsWith('/kick')) {
          setStatus('kicked');
          sessionStorage.removeItem('curio-player');
          if (clientRef.current) clientRef.current.end();
        }
      } catch (err) {
        console.error('Fehler bei der Nachrichtenverarbeitung:', err);
      }
    });
  };

  const handleAnswer = (index: number) => {
    if (status !== 'question' || !clientRef.current) return;

    const answerPayload = {
      peerId: peerIdRef.current,
      data: { answerIndex: index }
    };

    clientRef.current.publish(
      `curio/${roomCode.toUpperCase()}/submitAnswer`,
      JSON.stringify(answerPayload),
      { qos: 0, retain: false }
    );

    setStatus('answered');
  };

  // --- UI-Komponenten bleiben identisch mit Jules Version ---
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
