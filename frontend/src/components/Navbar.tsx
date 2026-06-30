import { useState, useEffect } from 'react';

interface NavbarProps {
  // Callback prop — the parent (HomePage) owns the search state
  // The Navbar just reports "the user typed this" upward
  // This pattern is called "lifting state up"
  onSearch: (query: string) => void;
}

export function Navbar({ onSearch }: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // ── Netflix's signature scroll effect ────────────────────────────────────
  // Navbar is transparent at the top of the page, solid black once you scroll
  // This is a classic "scroll listener" pattern
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    // Attach the listener when this component mounts
    window.addEventListener('scroll', handleScroll);

    // Cleanup: remove the listener when component unmounts
    // Without this, the listener stays attached forever — a memory leak
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // empty array = run once on mount, cleanup once on unmount

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between
        px-4 md:px-12 py-4 transition-colors duration-300
        ${scrolled ? 'bg-black' : 'bg-gradient-to-b from-black/80 to-transparent'}`}
    >
      <div className="flex items-center gap-8">
        {/* Netflix-style wordmark — bold, red, condensed */}
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
            {/* Inline SVG search icon — no icon library needed for one icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        )}
        <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center text-sm font-bold">
          M
        </div>
      </div>
    </nav>
  );
}
