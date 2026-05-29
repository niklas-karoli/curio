import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { QuizBuilder } from './pages/QuizBuilder';
import { HostView } from './pages/HostView';
import { ParticipantView } from './pages/ParticipantView';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background selection:bg-primary/30">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/builder" element={<QuizBuilder />} />
            <Route path="/host" element={<HostView />} />
            <Route path="/play" element={<ParticipantView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
