import { Brain } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar = () => {
  return (
    <nav className="h-16 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Brain className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-primary">c</span>urio
          </span>
        </Link>
      </div>
    </nav>
  );
};
