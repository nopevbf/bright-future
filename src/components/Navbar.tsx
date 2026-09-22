import React, { useState, useEffect } from 'react';
import { Menu, X, Calculator, ArrowRight, LogIn } from 'lucide-react';

interface NavbarProps {
  onOpenLogin: () => void;
  onOpenCalculator: () => void;
  onSelectRegister: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLogin,
  onOpenCalculator,
  onSelectRegister,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Beranda', href: '#beranda' },
    { label: 'Program Belajar', href: '#program' },
    { label: 'Testimoni', href: '#testimoni' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (href === '#beranda') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setMobileMenuOpen(false);
      return;
    }

    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      // 110px offset leaves 1 generous upward scroll margin so section headers are never blocked by navbar
      const yOffset = -110;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({
        top: Math.max(0, y),
        behavior: 'smooth',
      });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 pointer-events-none transition-all duration-200">
      <div
        className={`max-w-7xl mx-auto h-16 sm:h-20 px-3 sm:px-6 rounded-[20px] sm:rounded-[22px] flex items-center justify-between pointer-events-auto border transition-all duration-300 ${
          isScrolled
            ? 'bg-[#FAF7F1]/95 sm:liquid-glass backdrop-blur-xl shadow-glass border-white/80'
            : 'bg-[#FAF7F1]/95 sm:bg-[#FAF7F1]/90 backdrop-blur-md border-[rgba(42,40,35,0.08)] shadow-sm'
        }`}
      >
        {/* Brand Logo */}
        <a
          href="#beranda"
          onClick={(e) => handleNavClick(e, '#beranda')}
          className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer min-w-0"
        >
          <img
            src="/logo.svg"
            alt="Bright Future Logo"
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-xs"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col justify-center min-w-0">
            <span className="font-display font-extrabold text-[15px] sm:text-lg md:text-xl tracking-tight text-[#3F5A46] leading-tight whitespace-nowrap">
              Bright Future
            </span>
            <span className="text-[9.5px] sm:text-[11px] md:text-xs font-semibold text-[#6F8F76] leading-tight whitespace-nowrap tracking-normal sm:tracking-wider mt-0.5">
              Digital Learning Center
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#F1ECE1]/90 p-1.5 rounded-full border border-[rgba(42,40,35,0.08)] text-sm font-medium text-[#2A2823]">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="px-4 py-1.5 rounded-full text-[#6B675F] hover:text-[#3F5A46] hover:bg-white/70 transition-colors text-xs font-semibold cursor-pointer"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Cost Calculator trigger button */}
          <button
            onClick={onOpenCalculator}
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#3F5A46] bg-white/70 hover:bg-white transition-all border border-[rgba(42,40,35,0.08)] hover:border-[#6F8F76]/40"
            title="Hitung Biaya Sesi & Bulanan"
          >
            <Calculator className="w-3.5 h-3.5 text-[#6F8F76]" />
            <span>Kalkulator</span>
          </button>

          {/* Login Portal modal button */}
          <button
            onClick={onOpenLogin}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#3F5A46] hover:bg-white/80 transition-all border border-transparent hover:border-[rgba(42,40,35,0.08)]"
          >
            <LogIn className="w-3.5 h-3.5 text-[#6F8F76]" />
            <span>Login Portal</span>
          </button>

          {/* Registration CTA */}
          <button
            onClick={onSelectRegister}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#C1683F] hover:bg-[#A85530] text-white text-xs sm:text-sm font-bold shadow-glow transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <span>Daftar Siswa</span>
            <ArrowRight className="w-3.5 h-3.5 font-bold" />
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl text-[#3F5A46] hover:bg-white/80 transition-colors shrink-0"
            aria-label="Buka menu navigasi"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden pointer-events-auto max-w-7xl mx-auto mt-2 p-5 rounded-[22px] bg-[#FAF7F1]/98 backdrop-blur-2xl border border-white/90 shadow-glass">
          <div className="flex flex-col space-y-2">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#2A2823] hover:bg-[#EAF2ED] hover:text-[#3F5A46] transition-colors cursor-pointer"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-3 border-t border-[rgba(42,40,35,0.08)] grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCalculator();
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white border border-[rgba(42,40,35,0.08)] text-xs font-bold text-[#3F5A46]"
              >
                <Calculator className="w-4 h-4 text-[#6F8F76]" />
                <span>Kalkulator</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white border border-[rgba(42,40,35,0.08)] text-xs font-bold text-[#3F5A46]"
              >
                <LogIn className="w-4 h-4 text-[#6F8F76]" />
                <span>Login Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
