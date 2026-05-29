import { LayoutGrid, Users, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export const Home = () => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="text-center mb-16">
        <h1 className="text-6xl font-black mb-6 tracking-tight">
          Willkommen bei <span className="text-primary">c</span>urio
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          Die serverlose, datenschutzfreundliche Quiz-Plattform für den modernen Unterricht.
          Kein Account, kein Tracking, einfach spielen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="flex flex-col items-center text-center p-8 hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6">
            <Play className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Mitspielen</h2>
          <p className="text-gray-500 mb-8">Tritt einem bestehenden Quiz bei und zeig was du kannst.</p>
          <Link to="/play" className="w-full mt-auto">
            <Button className="w-full" size="lg">Beitreten</Button>
          </Link>
        </Card>

        <Card className="flex flex-col items-center text-center p-8 hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mb-6">
            <Users className="w-8 h-8 text-secondary" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Hosten</h2>
          <p className="text-gray-500 mb-8">Starte eine Quiz-Runde für deine Schüler*innen oder Freund*innen.</p>
          <Link to="/host" className="w-full mt-auto">
            <Button variant="secondary" className="w-full" size="lg">Hosten</Button>
          </Link>
        </Card>

        <Card className="flex flex-col items-center text-center p-8 hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
            <LayoutGrid className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Builder</h2>
          <p className="text-gray-500 mb-8">Erstelle eigene Quizze und speichere sie als Datei auf deinem PC.</p>
          <Link to="/builder" className="w-full mt-auto">
            <Button variant="outline" className="w-full" size="lg">Erstellen</Button>
          </Link>
        </Card>
      </div>

      <div className="mt-24 text-center text-gray-400 text-sm">
        <p>Entwickelt mit ❤️ für datenschutzfreundliche Bildung.</p>
        <p className="mt-2">Alle Daten bleiben in deinem Browser. P2P-Technologie via Trystero.</p>
      </div>
    </div>
  );
};
