import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const LandingNavbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  const scrollTo = (id: string) => {
    setIsMobileOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { label: 'Fonctionnalités', id: 'fonctionnalites' },
    { label: 'Tarifs', id: 'tarifs' },
    { label: 'Témoignages', id: 'temoignages' },
    { label: 'FAQ', id: 'faq' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'landing-navbar-glass shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                J
              </div>
              <span className="text-xl font-bold text-white">Jang</span>
            </div>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="text-sm text-white/70 hover:text-white transition-colors font-medium"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm text-white/70 hover:text-white transition-colors font-medium px-4 py-2"
              >
                Se connecter
              </Link>
              <Link
                to="/register"
                className="text-sm bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
              >
                Commencer gratuitement
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 text-white/80 hover:text-white transition-colors"
            >
              {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Mobile menu */}
      <div
        className={`fixed top-0 right-0 h-full w-72 z-50 bg-gray-900/95 backdrop-blur-xl transform transition-transform duration-300 md:hidden ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 pt-20 flex flex-col gap-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="text-left text-white/80 hover:text-white text-lg font-medium py-3 px-4 rounded-lg hover:bg-white/10 transition-colors"
            >
              {link.label}
            </button>
          ))}
          <div className="border-t border-white/10 mt-4 pt-4 space-y-3">
            <Link
              to="/login"
              onClick={() => setIsMobileOpen(false)}
              className="block text-center text-white/80 hover:text-white text-base font-medium py-3 px-4 rounded-lg hover:bg-white/10 transition-colors"
            >
              Se connecter
            </Link>
            <Link
              to="/register"
              onClick={() => setIsMobileOpen(false)}
              className="block text-center bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 px-4 rounded-full hover:opacity-90 transition-opacity"
            >
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default LandingNavbar;
