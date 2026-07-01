import { useState, useEffect } from 'react';

interface NavbarProps {
  onSearch: (query: string) => void;
  onLogout: () => void;
}

export function Navbar({ onSearch, onLogout }: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between
        px-4 md:px-12 py-4 transition-colors duration-300
        ${scrolled ? 'bg-black' : 'bg-gradient-to-b from-black/80 to-transparent'}`}
    >
      <div className="flex items-center gap-8">
        <h1 className="text-red-600 text-2xl md:text-3xl font-black tracking-tight">
          STREAMR
        </h1>
        <ul className="hidden md:flex gap-5 text-sm text-neutral-200">
          <li className="hover:text-neutral-400 cursor-pointer">Home</li>
          <li className="hover:text-neutral-400 cursor-pointer">Movies</li>
          <li className="hover:text-neutral-400 cursor-pointer">My List</li>
        </ul>
      </div>

      <div className="flex items-center gap-4">
        {searchOpen ? (
          <input
            autoFocus
            type="text"
            placeholder="Titles, genres..."
            onChange={(e) => onSearch(e.target.value)}
            onBlur={() => setSearchOpen(false)}
            className="bg-black/80 border border-neutral-500 text-white text-sm
              px-3 py-1.5 rounded outline-none w-48 md:w-64"
          />
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="text-white hover:text-neutral-300"
            aria-label="Search"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        )}
        <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center text-sm font-bold">
          M
        </div>
        <button
          onClick={onLogout}
          className="text-neutral-400 hover:text-white text-sm transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
